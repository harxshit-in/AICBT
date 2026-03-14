import { Type } from "@google/genai";
import { parseQuestions } from "./parser";
import { Question } from "./storage";
import { getAI, withRetry } from "./aiClient";

import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const PROMPT = `
Extract MCQ questions with (a)(b)(c)(d) options from this exam paper text.
Rules:
1. Support both English and Hindi languages.
2. If a question is provided in both English and Hindi, extract BOTH versions.
3. Detect answer keys like "1.(b) 2.(c)" or "Ans.(b)" and set the correct index (0 for a, 1 for b, 2 for c, 3 for d).
4. Preserve math expressions exactly: x²+1/x, √3, ₹, %.
5. Identify the language of each question.
6. Return ONLY a JSON array of objects with this structure: [{"question":"...","options":["a","b","c","d"],"correct":1, "language": "english" | "hindi"}]
`;

async function extractTextFromPdf(file: File): Promise<{ text: string; images?: { data: string; mimeType: string }[] }> {
  const url = URL.createObjectURL(file);
  try {
    const pdf = await pdfjsLib.getDocument(url).promise;
    let fullText = '';
    const numPages = Math.min(pdf.numPages, 15);
    
    // 1. Try text extraction first
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    // 2. If text is too short, it's likely a scanned PDF. Fallback to images (OCR)
    if (fullText.trim().length < 200) {
      const images: { data: string; mimeType: string }[] = [];
      // Limit to 5 pages for OCR to stay under Vercel's 10s timeout
      const ocrPages = Math.min(pdf.numPages, 5);
      
      for (let i = 1; i <= ocrPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 }); // Good balance of quality and size
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context!, viewport }).promise;
        const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        images.push({ data: base64, mimeType: 'image/jpeg' });
      }
      return { text: '', images };
    }

    return { text: fullText };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function extractFromPDF(file: File): Promise<Question[]> {
  const { generateContent } = await getAI();
  
  const { text, images } = await extractTextFromPdf(file);

  const contents: any = [];
  if (images && images.length > 0) {
    // Image-based OCR path
    contents.push({
      parts: [
        { text: PROMPT },
        ...images.map(img => ({
          inlineData: {
            mimeType: img.mimeType,
            data: img.data
          }
        }))
      ]
    });
  } else {
    // Text-based path
    contents.push({
      parts: [{ text: `${PROMPT}\n\nExam Paper Text:\n${text}` }]
    });
  }

  const response = await withRetry(() => generateContent({
    model: "gemini-3-flash-preview",
    contents: contents,
    feature: "PDF_TO_CBT",
    config: {
      responseMimeType: "application/json"
    }
  }));

  return parseQuestions(response.text || '[]');
}

export async function extractFromImages(images: { base64: string; mimeType: string }[]): Promise<Question[]> {
  const { generateContent } = await getAI();
  
  const parts = [
    { text: PROMPT },
    ...images.map(img => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64
      }
    }))
  ];

  const response = await withRetry(() => generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts }],
    feature: "PDF_TO_CBT"
  }));

  return parseQuestions(response.text || '');
}

export async function scanOMR(imageBase64: string, answerKey: number[]): Promise<any> {
  const { generateContent } = await getAI();
  const prompt = `
    This is a photo of an OMR answer sheet. 
    Please read the marked bubbles for each question number.
    Return a JSON array of the selected option index (0 for A, 1 for B, 2 for C, 3 for D) for each question.
    Example: [0, 2, 1, 3, ...]
    If a question is skipped, use null.
  `;

  const response = await withRetry(() => generateContent({
    model: "gemini-3-flash-preview",
    feature: "PDF_TO_CBT",
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64,
            },
          },
        ],
      },
    ],
  }));

  try {
    const studentAnswers = JSON.parse(response.text || '[]');
    let correctCount = 0;
    const results = studentAnswers.map((ans: number | null, i: number) => {
      const isCorrect = ans === answerKey[i];
      if (isCorrect) correctCount++;
      return {
        questionNum: i + 1,
        studentAnswer: ans,
        correctAnswer: answerKey[i],
        isCorrect
      };
    });

    return {
      results,
      score: correctCount,
      total: answerKey.length
    };
  } catch (e) {
    throw new Error('Failed to parse OMR results');
  }
}

export async function categorizeBank(bankName: string, questions: Question[]): Promise<{ category: string; tags: string[] }> {
  const { generateContent } = await getAI();
  const sampleQuestions = questions.slice(0, 5).map(q => q.question).join('\n');
  const prompt = `
    Analyze this exam paper titled "${bankName}" and its sample questions:
    ${sampleQuestions}

    Based on this, identify:
    1. The most appropriate category (e.g., Civil Services, SSC, Engineering, Medical, Banking, General, etc.)
    2. A few relevant tags (subjects, specific exam name, etc.)

    Return ONLY a JSON object: {"category": "...", "tags": ["...", "..."]}
  `;

  const response = await withRetry(() => generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
  }));

  try {
    return JSON.parse(response.text || '{"category": "General", "tags": []}');
  } catch (e) {
    return { category: "General", "tags": [] };
  }
}
