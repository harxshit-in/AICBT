import { Type } from "@google/genai";
import { Question } from "./storage";
import { getAI, withRetry } from "./aiClient";

export interface SlideData {
  title: string;
  content: string;
  imagePrompt: string;
  imageUrl?: string;
}

export async function generateVidyalayText(topic: string, exam: string): Promise<string> {
  const ai = await getAI();
  const prompt = `
You are an expert AI tutor for the ${exam} exam.
The student wants to study the topic: "${topic}".

Using Google Search to find the absolute latest data, provide a comprehensive study guide.
Include:
1. Core concepts and important points.
2. Recent questions asked in this exam for this topic (must include exam year/date and exact question if possible). Do not use old data; find the latest exam questions.
3. Explain the concepts so simply that a first-time reader can understand everything instantly. Use clear headings, bullet points, and simple language.

Format the output as clean Markdown.
`;

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.2,
    }
  }));

  return response.text || "Failed to generate content.";
}

export async function generateVidyalaySlides(topic: string, exam: string): Promise<SlideData[]> {
  const ai = await getAI();
  const prompt = `
You are an expert AI tutor for the ${exam} exam.
The student wants to study the topic: "${topic}".

Create a slide-deck presentation (minimum 5, maximum 15 slides depending on topic complexity).
Explain the concepts so simply that a first-time reader can understand everything instantly.
Using Google Search, ensure you include the latest recent questions asked in this exam for this topic.

Return a JSON array of objects. Each object must have:
- "title": The slide title.
- "content": Bullet points, facts, or recent questions (with exam dates/names).
- "imagePrompt": A detailed prompt to generate an educational infographic or visual note for this slide. IMPORTANT: Image generation models often misspell words, especially in Hindi/Hinglish. To fix this, you MUST provide EXACT, SHORT phrases enclosed in quotes for the model to render. Use simple Hinglish (Hindi in English alphabet). Keep the text extremely brief (maximum 2-4 words per text element) to ensure 100% correct spelling. Example: "An educational infographic. Include a bold title with the exact text 'Regulating Act'. Include a label with the exact text 'Supreme Court'."
`;

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            imagePrompt: { type: Type.STRING },
          },
          required: ["title", "content", "imagePrompt"]
        }
      }
    }
  }));

  try {
    const jsonStr = response.text?.trim() || "[]";
    return JSON.parse(jsonStr) as SlideData[];
  } catch (e) {
    console.error("Failed to parse slides JSON", e);
    return [];
  }
}

export async function generateSlideImage(imagePrompt: string): Promise<string> {
  const ai = await getAI();
  
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: imagePrompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      },
    }));

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64EncodeString = part.inlineData.data;
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${base64EncodeString}`;
      }
    }
    return "";
  } catch (e) {
    console.error("Failed to generate image", e);
    return "";
  }
}

export async function generateVidyalayTest(topic: string, exam: string): Promise<Question[]> {
  const ai = await getAI();
  const prompt = `
You are an expert examiner for the ${exam} exam.
Generate 10 high-quality multiple-choice questions (MCQs) on the topic: "${topic}".
Include a mix of conceptual questions and recent exam-style questions.

Return ONLY a JSON array of objects with this structure:
[{"question":"...","options":["a","b","c","d"],"correct":1, "language": "english"}]
(where correct is the 0-based index of the correct option).
`;

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            correct: { type: Type.INTEGER },
            language: { type: Type.STRING }
          },
          required: ["question", "options", "correct"]
        }
      }
    }
  }));

  try {
    const jsonStr = response.text?.trim() || "[]";
    return JSON.parse(jsonStr) as Question[];
  } catch (e) {
    console.error("Failed to parse test JSON", e);
    return [];
  }
}
