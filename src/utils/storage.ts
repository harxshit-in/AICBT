import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'examprep';
const STORE_NAME = 'banks';
const RESULTS_STORE = 'results';

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
}

export interface Question {
  question: string;
  options: string[];
  correct: number; // 0-3 index
  language?: 'english' | 'hindi';
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
}

async function getDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 2, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'bankId' });
      }
      if (!db.objectStoreNames.contains(RESULTS_STORE)) {
        const store = db.createObjectStore(RESULTS_STORE, { keyPath: 'resultId' });
        store.createIndex('bankId', 'bankId');
      }
    },
  });
}

export async function saveResult(result: ExamResult): Promise<void> {
  const db = await getDb();
  await db.put(RESULTS_STORE, result);
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
