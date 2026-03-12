import { Modality, Type } from "@google/genai";
import { Question } from "./storage";
import { getAI, withRetry } from "./aiClient";

export async function generateTestFromSummary(summaryText: string, topic: string, language: string): Promise<Question[]> {
  const ai = await getAI();
  
  const prompt = `
Generate 5 multiple-choice questions based on the following summary text about "${topic}".
The questions should test the user's understanding of the key concepts mentioned in the text.
Language: ${language === 'hindi' ? 'Hindi' : language === 'hinglish' ? 'Hinglish' : 'English'}

Summary Text:
${summaryText}
`;

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: prompt,
    config: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING, description: "The question text" },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Exactly 4 options for the multiple choice question"
            },
            correct: { type: Type.INTEGER, description: "The index of the correct option (0 to 3)" }
          },
          required: ["question", "options", "correct"]
        }
      }
    }
  }));

  const text = response.text || "[]";
  try {
    const questions: Question[] = JSON.parse(text);
    return questions.map(q => ({
      ...q,
      language: language === 'hindi' ? 'hindi' : 'english'
    }));
  } catch (e) {
    console.error("Failed to parse questions", e);
    throw new Error("Failed to generate test questions.");
  }
}

export async function generateSummaryText(topic: string, exam: string, language: string): Promise<string> {
  const ai = await getAI();
  
  let langInstruction = "English";
  if (language === 'hindi') langInstruction = "Hindi (using Devanagari script)";
  if (language === 'hinglish') langInstruction = "Hinglish (Hindi written in English alphabet)";

  const prompt = `
You are an expert AI tutor for the ${exam} exam.
The student wants a concise audio-friendly summary on the topic: "${topic}".

Write a highly engaging, easy-to-understand summary script (around 200-300 words).
It should sound like a friendly teacher explaining the core concepts to a student.
Include 2-3 key facts or recent exam patterns if relevant.
The output MUST be entirely in ${langInstruction}.
Do not include any markdown formatting like ** or #, just plain text that is easy to read aloud.
`;

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: prompt,
    config: {
      temperature: 0.3,
    }
  }));

  return response.text || "Failed to generate summary.";
}

function createWavDataUrl(base64Pcm: string, sampleRate: number = 24000): string {
  const binaryString = window.atob(base64Pcm);
  const len = binaryString.length;
  const pcmData = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    pcmData[i] = binaryString.charCodeAt(i);
  }

  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (v: DataView, offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      v.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const pcmView = new Uint8Array(buffer, 44);
  pcmView.set(pcmData);

  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${window.btoa(binary)}`;
}

export async function generateSummaryAudio(text: string, language: string): Promise<string> {
  const ai = await getAI();
  
  // For Hindi/Hinglish, we might want a specific voice, but 'Kore' or 'Puck' works generally.
  // We will use 'Kore' as default.
  
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    }));

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return createWavDataUrl(base64Audio, 24000);
    }
    return "";
  } catch (e) {
    console.error("Failed to generate audio", e);
    throw new Error("Failed to generate audio narration.");
  }
}
