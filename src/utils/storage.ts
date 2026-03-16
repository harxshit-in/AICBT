import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'examprep';
const STORE_NAME = 'banks';
const RESULTS_STORE = 'results';
const USER_STATS_STORE = 'user_stats';

export interface UserStats {
  id: string; // always 'current'
  streak: number;
  lastStudyDate: string; // YYYY-MM-DD
  totalXP: number;
  subjectMastery: Record<string, { correct: number; total: number }>;
  totalQuestionsSolved: number;
}

export interface ExamResult {
  resultId: string;
  bankId: string;
  candidateName: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  timeTaken: number;
  timestamp: number;
  accuracy: number;
  questionResults?: boolean[]; // true if correct, false if incorrect/skipped
}

export interface Question {
  question: string;
  options: string[];
  correct: number; // 0-3 index
  language?: 'english' | 'hindi';
  section?: string;
}

export interface QuestionBank {
  bankId: string;
  name: string;
  questions: Question[];
  createdAt: number;
  sourceFile: string;
  timeLimit?: number; // in minutes
  negativeMarking?: number; // e.g., 0.25
  createdBy?: string;
  isPublic?: boolean;
  category?: string;
  tags?: string[];
  author?: string;
  authorImage?: string;
  attempts?: number;
  rating?: number;
  approved?: boolean;
}

async function getDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 3, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'bankId' });
      }
      if (!db.objectStoreNames.contains(RESULTS_STORE)) {
        const store = db.createObjectStore(RESULTS_STORE, { keyPath: 'resultId' });
        store.createIndex('bankId', 'bankId');
      }
      if (!db.objectStoreNames.contains(USER_STATS_STORE)) {
        db.createObjectStore(USER_STATS_STORE, { keyPath: 'id' });
      }
    },
  });
}

export async function getUserStats(): Promise<UserStats> {
  const db = await getDb();
  const stats = await db.get(USER_STATS_STORE, 'current');
  if (!stats) {
    const initialStats: UserStats = {
      id: 'current',
      streak: 0,
      lastStudyDate: '',
      totalXP: 0,
      subjectMastery: {},
      totalQuestionsSolved: 0
    };
    await db.put(USER_STATS_STORE, initialStats);
    return initialStats;
  }
  return stats;
}

export async function updateUserStats(result: ExamResult, questions: Question[]): Promise<UserStats> {
  const db = await getDb();
  const stats = await getUserStats();
  
  // 1. Update Streak
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  if (stats.lastStudyDate === yesterday) {
    stats.streak += 1;
  } else if (stats.lastStudyDate !== today) {
    stats.streak = 1;
  }
  stats.lastStudyDate = today;

  // 2. Update XP (10 XP per correct answer, 2 XP per incorrect)
  const xpGained = (result.correctCount * 10) + (result.incorrectCount * 2);
  stats.totalXP += xpGained;
  stats.totalQuestionsSolved += result.totalQuestions;

  // 3. Update Subject Mastery
  questions.forEach((q, idx) => {
    const subject = q.section || 'General';
    if (!stats.subjectMastery[subject]) {
      stats.subjectMastery[subject] = { correct: 0, total: 0 };
    }
    stats.subjectMastery[subject].total += 1;
    
    // Use the per-question result if available
    if (result.questionResults && result.questionResults[idx]) {
      stats.subjectMastery[subject].correct += 1;
    }
  });
  
  await db.put(USER_STATS_STORE, stats);
  return stats;
}

export async function saveResult(result: ExamResult): Promise<void> {
  const db = await getDb();
  await db.put(RESULTS_STORE, result);
}

export async function getAllResults(): Promise<ExamResult[]> {
  const db = await getDb();
  return db.getAll(RESULTS_STORE);
}

export async function getResultsForBank(bankId: string): Promise<ExamResult[]> {
  const db = await getDb();
  return db.getAllFromIndex(RESULTS_STORE, 'bankId', bankId);
}

export async function saveBank(bank: QuestionBank): Promise<string> {
  const db = await getDb();
  await db.put(STORE_NAME, bank);
  return bank.bankId;
}

export async function getAllBanks(): Promise<QuestionBank[]> {
  const db = await getDb();
  return db.getAll(STORE_NAME);
}

export async function getBank(id: string): Promise<QuestionBank | undefined> {
  const db = await getDb();
  return db.get(STORE_NAME, id);
}

export async function deleteBank(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_NAME, id);
}

export function generateBankId(name: string): string {
  return `bank_${Date.now()}_${name.slice(0, 20).replace(/\s+/g, '_')}`;
}
