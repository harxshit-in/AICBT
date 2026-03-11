import { Question } from './storage';

export function parseQuestions(raw: string): Question[] {
  try {
    // Attempt to find JSON array in the text
    const jsonMatch = raw.match(/\[\s*\{.*\}\s*\]/s);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        return parsed.map((q: any) => ({
          question: q.question || 'Unknown Question',
          options: Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D'],
          correct: typeof q.correct === 'number' ? q.correct : 0,
          language: q.language || 'english',
        }));
      }
    }
    
    // Fallback: try to parse the whole string if it's just JSON
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((q: any) => ({
        ...q,
        language: q.language || 'english'
      }));
    }
  } catch (e) {
    console.error('Failed to parse questions from AI response:', e);
  }
  return [];
}
