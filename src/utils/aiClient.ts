export async function getAI(): Promise<{ generateContent: (params: any) => Promise<any>; systemInstruction: string }> {
  const systemInstruction = "You are a helpful assistant for SSC, Railways, and Banking exam preparation. You provide accurate, educational, and encouraging responses.";
  
  const generateContent = async (params: any) => {
    const response = await fetch('/api/gemini-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: params.contents,
        model: params.model || 'gemini-3-flash-preview',
        systemInstruction: systemInstruction,
        config: params.config,
        feature: params.feature || 'General'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to call AI service');
    }

    const data = await response.json();
    
    // Transform proxy response to match GoogleGenAI response structure
    return {
      text: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
      candidates: data.candidates,
      usageMetadata: data.usageMetadata
    };
  };

  return { generateContent, systemInstruction };
}

/**
 * Wrapper for AI calls with exponential backoff retry logic.
 */
export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a retryable error (rate limit or server error)
      const isRetryable = error.message?.includes('429') || 
                          error.message?.includes('503') ||
                          error.message?.includes('exhausted') ||
                          error.message?.includes('limit reached');
      
      if (isRetryable && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i) + Math.random() * 500;
        console.warn(`AI error hit. Retrying in ${Math.round(delay)}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}
