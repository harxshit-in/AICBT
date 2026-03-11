import Filter from 'bad-words';
import { QuestionBank } from './storage';

const filter = new Filter();
// Add common Hindi/regional profanity words
filter.addWords(
  'madherchod', 'madarchod', 'bhenchod', 'behenchod', 'chutiya', 'bhosadike', 'bhosdike', 
  'gandu', 'randi', 'harami', 'kutta', 'kaminey', 'kamine', 'saala', 'saali', 'chut', 'loda', 'lund'
);

export function isProfane(text: string): boolean {
  return filter.isProfane(text);
}

export function isContentSafe(bank: QuestionBank, authorName: string): boolean {
  if (isProfane(authorName) || isProfane(bank.name)) {
    return false;
  }

  for (const q of bank.questions) {
    if (isProfane(q.question)) return false;
    for (const opt of q.options) {
      if (isProfane(opt)) return false;
    }
  }

  return true;
}
