export type BlockType = 'text' | 'math';
export type QuestionType = 'mcq' | 'open-ended' | 'fill-in-the-blank';

export interface QuestionBlock {
  id: string;
  type: BlockType;
  content: string; // Text content for text blocks, LaTeX for math blocks
}

// Segmented elements for fill-in-the-blank questions
export type SegmentedElement = 
  | { type: 'math'; value: string; id: string }
  | { type: 'blank'; id: number };

export interface AnswerBox {
  id: string;
  label: string; // e.g., "x="
  labelIsMath?: boolean; // Whether the label should be rendered as math
  answer: string; // LaTeX answer
}

export interface MCQOption {
  id: string;
  label: string; // LaTeX math expression for the option
  isCorrect: boolean; // Whether this is the correct answer
}

export interface Question {
  id: string;
  instruction: string; // Main instruction text like "Solve the equation"
  questionType?: QuestionType; // Default to 'open-ended' for backward compatibility
  blocks: QuestionBlock[];
  answerBoxes?: AnswerBox[]; // For open-ended questions
  mcqOptions?: MCQOption[]; // For MCQ questions
  segmentedElements?: SegmentedElement[]; // For fill-in-the-blank questions
  marks?: number; // Total marks allocated for this question (default: 1)
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

// Evaluation types
export interface StepEvaluation {
  stepIndex: number;
  stepContent: string;
  isCorrect: boolean;
  feedback: string;
  marksAwarded?: number; // Marks awarded for this step (for partial credit)
}

export interface EvaluationResult {
  questionId: string;
  isCorrect: boolean;
  studentAnswer: string | string[];
  correctAnswer: string | string[];
  finalAnswerCorrect: boolean;
  workingSteps?: StepEvaluation[];
  correctSolutionSteps?: string[]; // Correct solution steps for open-ended questions
  marksAwarded: number; // Marks awarded for this question
  maxMarks: number; // Maximum marks for this question
  feedback?: string;
}

export interface QuizEvaluation {
  results: EvaluationResult[];
  totalScore: number;
  maxScore: number;
  totalMarksAwarded: number; // Total marks awarded
  totalMaxMarks: number; // Total maximum marks
  percentage: number;
}

