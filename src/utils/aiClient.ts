import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { auth, getUserProfile } from "./firebase";

export async function getAI(): Promise<{ ai: GoogleGenAI; systemInstruction: string }> {
  const apiKey = localStorage.getItem('user_gemini_api_key');
  if (!apiKey) throw new Error('Gemini API Key not found in settings. Please configure it first.');
  
  const ai = new GoogleGenAI({ apiKey });
  
  let systemInstruction = "You are a helpful assistant.";
  if (auth.currentUser) {
    const profile = await getUserProfile(auth.currentUser.uid);
    if (profile) {
      systemInstruction = `You are a helpful assistant. The user's name is ${profile.name}. They are preparing for the ${profile.exam} exam, it is their ${profile.attempt}, and they are at the ${profile.level} level. Tailor your responses to their profile.`;
    }
  }
  
  // Note: Since we cannot pass systemInstruction directly to GoogleGenAI constructor,
  // we will have to pass it in the config of each generateContent call.
  // This function will return the AI instance and the system instruction.
  return { ai, systemInstruction };
}

/**
 * Wrapper for Gemini API calls with exponential backoff retry logic for 429 errors.
 */
export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 2000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      // Check if it's a 429 (Rate Limit) error
      const isRateLimit = error.message?.includes('429') || 
                          error.status === 429 || 
                          JSON.stringify(error).includes('429') ||
                          JSON.stringify(error).includes('RESOURCE_EXHAUSTED');
      
      if (isRateLimit && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i) + Math.random() * 1000;
        console.warn(`Rate limit hit. Retrying in ${Math.round(delay)}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}
