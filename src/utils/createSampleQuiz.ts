import { saveQuiz, generateId } from './storage';
import type { Quiz, Question } from '../types';

export function createGCSEQuiz(): Quiz {
  // Create Open-ended Question: Solve a quadratic equation
  // Note: For open-ended questions, you only need to provide:
  // - The question/problem
  // - The correct final answer
  // The AI will evaluate student's working steps automatically
  const openEndedQuestion: Question = {
    id: generateId(),
    instruction: 'Solve the equation',
    questionType: 'open-ended',
    marks: 5,
    blocks: [
      {
        id: generateId(),
        type: 'math',
        content: 'x^2 + 5x + 6 = 0'
      }
    ],
    answerBoxes: [
      {
        id: generateId(),
        label: 'x',
        labelIsMath: false,
        answer: '-2, -3' // Correct final answer - AI will evaluate student steps against this
      }
    ]
  };

  // Create Fill-in-the-Blank Question: Complete the equation
  const fillInTheBlankQuestion: Question = {
    id: generateId(),
    instruction: 'Fill in the blanks to complete the equation',
    questionType: 'fill-in-the-blank',
    marks: 3,
    blocks: [],
    segmentedElements: [
      { type: 'math', value: '(x + ', id: generateId() },
      { type: 'blank', id: 1 },
      { type: 'math', value: ')(x + ', id: generateId() },
      { type: 'blank', id: 2 },
      { type: 'math', value: ') = x^2 + 7x + 12', id: generateId() }
    ],
    answerBoxes: [
      {
        id: generateId(),
        label: 'Blank #1',
        labelIsMath: false,
        answer: '3'
      },
      {
        id: generateId(),
        label: 'Blank #2',
        labelIsMath: false,
        answer: '4'
      }
    ]
  };

  // Create MCQ Question: What is the value of x?
  const mcqQuestion: Question = {
    id: generateId(),
    instruction: 'What is the value of x in the equation?',
    questionType: 'mcq',
    marks: 2,
    blocks: [
      {
        id: generateId(),
        type: 'math',
        content: '2x + 8 = 20'
      }
    ],
    mcqOptions: [
      {
        id: generateId(),
        label: 'x = 4',
        isCorrect: false
      },
      {
        id: generateId(),
        label: 'x = 6',
        isCorrect: true
      },
      {
        id: generateId(),
        label: 'x = 8',
        isCorrect: false
      },
      {
        id: generateId(),
        label: 'x = 10',
        isCorrect: false
      }
    ]
  };

  // Create the quiz
  const quiz: Quiz = {
    id: generateId(),
    title: 'GCSE Math Practice Questions',
    questions: [openEndedQuestion, fillInTheBlankQuestion, mcqQuestion],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Save the quiz
  saveQuiz(quiz);

  return quiz;
}

