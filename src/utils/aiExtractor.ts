import { Type, ThinkingLevel } from "@google/genai";
import { parseQuestions } from "./parser";
import { Question } from "./storage";
import { getAI, withRetry } from "./aiClient";

const PROMPT = `
Extract MCQ questions with (a)(b)(c)(d) options from this exam paper.
Rules:
1. Support both English and Hindi languages.
2. If a question is provided in both English and Hindi, extract BOTH versions.
3. Skip garbled text or font corruption.
4. Skip cover pages, author names, Telegram links, phone numbers.
5. Skip open-ended questions without options.
6. Detect answer keys like "1.(b) 2.(c)" or "Ans.(b)" and set the correct index (0 for a, 1 for b, 2 for c, 3 for d).
7. Preserve math expressions exactly: x²+1/x, √3, ₹, %.
8. Identify the language of each question.
9. Return ONLY a JSON array of objects with this structure: [{"question":"...","options":["a","b","c","d"],"correct":1, "language": "english" | "hindi"}]
`;

export async function extractFromPDF(file: File): Promise<Question[]> {
  const ai = await getAI();
  const buf = await file.arrayBuffer();
  const base64 = btoa(new Uint8Array(buf).reduce((data, byte) => data + String.fromCharCode(byte), ''));

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: [
      {
        parts: [
          { text: PROMPT },
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64,
            },
          },
        ],
      },
    ],
    config: {
      temperature: 0.1,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
    }
  }));

  return parseQuestions(response.text || '');
}

export async function extractFromImages(images: { base64: string; mimeType: string }[]): Promise<Question[]> {
  const ai = await getAI();
  
  // We might need to chunk images if there are too many, but for now let's try all
  const parts = [
    { text: PROMPT },
    ...images.map(img => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64
      }
    }))
  ];

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: [{ parts }],
    config: {
      temperature: 0.1,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
    }
  }));

  return parseQuestions(response.text || '');
}

export async function scanOMR(imageBase64: string, answerKey: number[]): Promise<any> {
  const ai = await getAI();
  const prompt = `
    This is a photo of an OMR answer sheet. 
    Please read the marked bubbles for each question number.
    Return a JSON array of the selected option index (0 for A, 1 for B, 2 for C, 3 for D) for each question.
    Example: [0, 2, 1, 3, ...]
    If a question is skipped, use null.
  `;

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-flash-latest",
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
    config: {
      temperature: 0.1,
      responseMimeType: "application/json"
    }
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
  const ai = await getAI();
  const sampleQuestions = questions.slice(0, 5).map(q => q.question).join('\n');
  const prompt = `
    Analyze this exam paper titled "${bankName}" and its sample questions:
    ${sampleQuestions}

    Based on this, identify:
    1. The most appropriate category (e.g., Civil Services, SSC, Engineering, Medical, Banking, General, etc.)
    2. A few relevant tags (subjects, specific exam name, etc.)

    Return ONLY a JSON object: {"category": "...", "tags": ["...", "..."]}
  `;

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      temperature: 0.1,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
    }
  }));

  try {
    return JSON.parse(response.text || '{"category": "General", "tags": []}');
  } catch (e) {
    return { category: "General", "tags": [] };
  }
}
