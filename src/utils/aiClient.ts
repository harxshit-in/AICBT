import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export async function getAI(): Promise<{ ai: GoogleGenAI; systemInstruction: string }> {
  // Priority 1: Key stored in localStorage (User's manually saved key in Settings)
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') : null;
  
  // Priority 2: Key selected via platform dialog (process.env.API_KEY)
  const platformDialogKey = process.env.API_KEY;
  
  let apiKey = localKey || platformDialogKey;
  
  // Validation: Ensure it's not a placeholder or empty
  if (apiKey && (apiKey.includes('YOUR_') || apiKey.includes('...') || apiKey.length < 10)) {
    apiKey = null;
  }
  
  if (!apiKey) {
    // Check if we can prompt the user via platform dialog
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      const aistudio = (window as any).aistudio;
      try {
        const hasKey = await aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await aistudio.openSelectKey();
          // After opening, the key should be available in process.env.API_KEY
          apiKey = process.env.API_KEY;
        }
      } catch (e) {
        console.warn('Platform key selection failed:', e);
      }
    }
  }

  if (!apiKey) {
    throw new Error('Gemini API Key not found. Please go to Settings and provide your own API key to use AI features.');
  }
  
  const ai = new GoogleGenAI({ apiKey });
  const systemInstruction = "You are a helpful assistant for SSC, Railways, and Banking exam preparation. You provide accurate, educational, and encouraging responses.";
  
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
