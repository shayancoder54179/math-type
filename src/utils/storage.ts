import type { Quiz } from '../types';

const STORAGE_KEY = 'math-quiz-app-quizzes';

export function saveQuiz(quiz: Quiz): void {
  const quizzes = getAllQuizzes();
  const existingIndex = quizzes.findIndex(q => q.id === quiz.id);
  
  const updatedQuiz = {
    ...quiz,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    quizzes[existingIndex] = updatedQuiz;
  } else {
    updatedQuiz.createdAt = new Date().toISOString();
    quizzes.push(updatedQuiz);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(quizzes));
}

export function getAllQuizzes(): Quiz[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading quizzes:', error);
    return [];
  }
}

export function getQuizById(id: string): Quiz | null {
  const quizzes = getAllQuizzes();
  return quizzes.find(q => q.id === id) || null;
}

export function deleteQuiz(id: string): void {
  const quizzes = getAllQuizzes();
  const filtered = quizzes.filter(q => q.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

