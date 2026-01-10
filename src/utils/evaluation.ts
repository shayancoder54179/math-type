import type { Question, EvaluationResult, QuizEvaluation, StepEvaluation } from '@/types';
import { evaluateWorkingStepsWithOpenAI } from './supabase-edge';

const WORKING_STEPS_KEY_PREFIX = 'working-steps-';

/**
 * Normalize LaTeX expression for comparison
 */
export function normalizeMathExpression(latex: string): string {
  if (!latex) return '';
  
  // Remove all whitespace
  let normalized = latex.replace(/\s+/g, '');
  
  // Normalize multiplication symbols
  normalized = normalized.replace(/\\times/g, '*');
  normalized = normalized.replace(/\\cdot/g, '*');
  
  // Normalize division
  normalized = normalized.replace(/\\div/g, '/');
  
  // Normalize common functions
  normalized = normalized.replace(/\\sin/g, 'sin');
  normalized = normalized.replace(/\\cos/g, 'cos');
  normalized = normalized.replace(/\\tan/g, 'tan');
  
  // Normalize Greek letters
  normalized = normalized.replace(/\\pi/g, 'pi');
  normalized = normalized.replace(/\\theta/g, 'theta');
  
  // Remove unnecessary braces in simple cases
  normalized = normalized.replace(/\\left\(/g, '(');
  normalized = normalized.replace(/\\right\)/g, ')');
  
  return normalized.toLowerCase();
}

/**
 * Extract numeric/expression values from equations
 * Handles formats like "x = 5", "x=5", "x = -2, -3", etc.
 */
export function extractValueFromEquation(latex: string): string[] {
  if (!latex) return [];
  
  // Remove LaTeX formatting for easier parsing
  let cleaned = latex.replace(/\\/g, '');
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Try to match patterns like "x = 5" or "x=5"
  // Also handle "x = -2 or x = -3" type answers by splitting on "or" / "and" first
  const splitParts = cleaned.split(/\s+(?:or|and)\s+/i);
  
  if (splitParts.length > 1) {
    // If we have "or"/"and", process each part
    const values: string[] = [];
    for (const part of splitParts) {
       const partMatch = part.match(/=\s*([^,]+)/);
       if (partMatch) {
         values.push(partMatch[1].trim());
       } else {
         // If just a number/expression without "=", take it as is
         values.push(part.trim());
       }
    }
    return values;
  }

  const equationMatch = cleaned.match(/=\s*([^,]+(?:,\s*[^,]+)*)/);
  if (equationMatch) {
    const values = equationMatch[1].split(',').map(v => v.trim());
    return values;
  }
  
  // If no equation format, return the whole string as a single value
  return [cleaned.trim()];
}

/**
 * Compare two math expressions
 */
export function compareMathExpressions(student: string, correct: string): boolean {
  if (!student || !correct) return false;
  
  // Normalize both expressions
  const normalizedStudent = normalizeMathExpression(student);
  const normalizedCorrect = normalizeMathExpression(correct);
  
  // Direct comparison
  if (normalizedStudent === normalizedCorrect) {
    return true;
  }
  
  // Try extracting values from equations
  const studentValues = extractValueFromEquation(student);
  const correctValues = extractValueFromEquation(correct);
  
  // Compare extracted values
  if (studentValues.length > 0 && correctValues.length > 0) {
    // Check if all correct values are present in student values
    const studentSet = new Set(studentValues.map(v => normalizeMathExpression(v)));
    const correctSet = new Set(correctValues.map(v => normalizeMathExpression(v)));
    
    if (studentSet.size === correctSet.size) {
      for (const val of correctSet) {
        if (!studentSet.has(val)) {
          return false;
        }
      }
      return true;
    }
  }
  
  // Try comparing individual values
  for (const correctVal of correctValues) {
    const normalizedCorrectVal = normalizeMathExpression(correctVal);
    for (const studentVal of studentValues) {
      const normalizedStudentVal = normalizeMathExpression(studentVal);
      if (normalizedStudentVal === normalizedCorrectVal) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Evaluate MCQ question
 */
export function evaluateMCQ(
  question: Question,
  studentAnswer: string
): EvaluationResult {
  const maxMarks = question.marks || 1;
  
  if (!question.mcqOptions) {
    return {
      questionId: question.id,
      isCorrect: false,
      status: 'incorrect',
      studentAnswer,
      correctAnswer: '',
      finalAnswerCorrect: false,
      marksAwarded: 0,
      maxMarks,
      feedback: 'Invalid question format',
    };
  }
  
  const correctOption = question.mcqOptions.find(opt => opt.isCorrect);
  const isCorrect = correctOption ? studentAnswer === correctOption.id : false;
  
  return {
    questionId: question.id,
    isCorrect,
    status: isCorrect ? 'correct' : 'incorrect',
    studentAnswer,
    correctAnswer: correctOption?.id || '',
    finalAnswerCorrect: isCorrect,
    marksAwarded: isCorrect ? maxMarks : 0,
    maxMarks,
    feedback: isCorrect ? 'Correct!' : 'Incorrect. Please try again.',
  };
}

/**
 * Evaluate fill-in-the-blank question
 */
export function evaluateFillInTheBlank(
  question: Question,
  studentAnswers: Record<string, string>
): EvaluationResult {
  const maxMarks = question.marks || 1;
  
  if (!question.answerBoxes || question.answerBoxes.length === 0) {
    return {
      questionId: question.id,
      isCorrect: false,
      status: 'incorrect',
      studentAnswer: Object.values(studentAnswers),
      correctAnswer: [],
      finalAnswerCorrect: false,
      marksAwarded: 0,
      maxMarks,
      feedback: 'Invalid question format',
    };
  }
  
  const studentAnswerArray: string[] = [];
  const correctAnswerArray: string[] = [];
  let correctCount = 0;
  let totalCount = 0;
  
  for (const answerBox of question.answerBoxes) {
    const studentAnswer = studentAnswers[answerBox.id] || '';
    const correctAnswer = answerBox.answer;
    
    studentAnswerArray.push(studentAnswer);
    correctAnswerArray.push(correctAnswer);
    totalCount++;
    
    if (compareMathExpressions(studentAnswer, correctAnswer)) {
      correctCount++;
    }
  }
  
  const allCorrect = correctCount === totalCount;
  
  // Calculate marks: proportional to number of correct blanks (rounded to whole number)
  const marksAwarded = totalCount > 0 
    ? Math.round((correctCount / totalCount) * maxMarks)
    : 0;
  
  // Generate appropriate feedback based on how many are correct
  let feedback: string;
  let status: 'correct' | 'incorrect' | 'partially_correct';
  
  if (allCorrect) {
    feedback = 'All blanks filled correctly!';
    status = 'correct';
  } else if (correctCount === 0) {
    feedback = 'All answers are incorrect.';
    status = 'incorrect';
  } else {
    feedback = `Some answers are incorrect. (${correctCount} of ${totalCount} correct)`;
    status = 'partially_correct';
  }
  
  return {
    questionId: question.id,
    isCorrect: allCorrect,
    status,
    studentAnswer: studentAnswerArray,
    correctAnswer: correctAnswerArray,
    finalAnswerCorrect: allCorrect,
    marksAwarded,
    maxMarks,
    feedback,
  };
}

/**
 * Evaluate open-ended question
 */
export async function evaluateOpenEnded(
  question: Question,
  studentAnswers: Record<string, string>
): Promise<EvaluationResult> {
  const WORKING_STEPS_KEY = `${WORKING_STEPS_KEY_PREFIX}${question.id}`;
  
  // Extract working steps
  const workingStepsData = studentAnswers[WORKING_STEPS_KEY];
  let workingSteps: string[] = [];
  if (workingStepsData) {
    try {
      const parsed = JSON.parse(workingStepsData);
      workingSteps = Array.isArray(parsed) ? parsed : [];
    } catch {
      workingSteps = [];
    }
  }
  
  // Extract correct answer(s) from question
  const correctAnswers: string[] = [];
  if (question.answerBoxes && question.answerBoxes.length > 0) {
    correctAnswers.push(...question.answerBoxes.map(b => b.answer));
  } else if (question.answerBoxes?.[0]?.answer) {
    correctAnswers.push(question.answerBoxes[0].answer);
  }
  
  // Determine student's "final answer" from the last working step
  // Filter out empty steps if any, but keep at least one if all empty
  const nonEmptySteps = workingSteps.filter(s => s.trim() !== '');
  const lastStep = nonEmptySteps.length > 0 ? nonEmptySteps[nonEmptySteps.length - 1] : (workingSteps[workingSteps.length - 1] || '');
  const studentFinalAnswer = lastStep;
  
  // Evaluate final answer (local check)
  let finalAnswerCorrect = false;
  if (correctAnswers.length > 0 && studentFinalAnswer) {
     // Check if the last step matches ANY of the correct answers
     finalAnswerCorrect = correctAnswers.some(ca => compareMathExpressions(studentFinalAnswer, ca));
  }
  
  const maxMarks = question.marks || 1;
  
  // Evaluate working steps with OpenAI if student provided steps
  let stepEvaluations: StepEvaluation[] | undefined;
  let aiFeedback: { modelAnswer: string[]; correctPoints: string[]; improvementPoints: string[] } | undefined;
  
  if (workingSteps.length > 0 && correctAnswers.length > 0) {
    try {
      // Filter out empty steps before sending to AI to avoid hallucinations
      const cleanWorkingSteps = workingSteps.filter(s => s.trim() !== '');
      
      if (cleanWorkingSteps.length === 0) {
        // If all steps were empty, skip AI evaluation
        return {
          questionId: question.id,
          isCorrect: finalAnswerCorrect,
          status: finalAnswerCorrect ? 'correct' : 'incorrect',
          studentAnswer: studentFinalAnswer,
          correctAnswer: correctAnswers.length === 1 ? correctAnswers[0] : correctAnswers,
          finalAnswerCorrect,
          workingSteps: [],
          marksAwarded: finalAnswerCorrect ? maxMarks : 0,
          maxMarks,
          feedback: finalAnswerCorrect ? 'Correct answer!' : 'Incorrect answer.',
        };
      }

      const stepResult = await evaluateWorkingStepsWithOpenAI(
        question,
        cleanWorkingSteps,
        studentFinalAnswer,
        correctAnswers
      );
      
      if (stepResult) {
        stepEvaluations = stepResult.steps;
        aiFeedback = {
          modelAnswer: stepResult.modelAnswer,
          correctPoints: stepResult.correctPoints,
          improvementPoints: stepResult.improvementPoints
        };
      }
    } catch (error) {
      console.error('Error evaluating working steps:', error);
      // Continue without step evaluation
    }
  }
  
  // Calculate marks based on final answer and steps (rounded to whole number)
  let marksAwarded = 0;
  
  if (finalAnswerCorrect) {
    // Full marks for correct final answer
    marksAwarded = maxMarks;
  } else if (stepEvaluations && stepEvaluations.length > 0) {
    // Partial marks based on correct steps
    const correctStepsCount = stepEvaluations.filter(s => s.isCorrect).length;
    const totalSteps = stepEvaluations.length;
    
    // Award marks proportionally: 70% for steps, 30% for final answer
    const stepMarks = Math.round((correctStepsCount / totalSteps) * maxMarks * 0.7);
    marksAwarded = Math.max(0, stepMarks);
  }
  
  // Determine status
  let status: 'correct' | 'incorrect' | 'partially_correct' = 'incorrect';
  if (finalAnswerCorrect) {
    status = 'correct';
  } else if (marksAwarded > 0) {
    status = 'partially_correct';
  }

  return {
    questionId: question.id,
    isCorrect: finalAnswerCorrect,
    status,
    studentAnswer: workingSteps.filter(s => s.trim() !== ''), // Use all non-empty working steps as the student answer
    correctAnswer: correctAnswers.length === 1 ? correctAnswers[0] : correctAnswers,
    finalAnswerCorrect,
    workingSteps: stepEvaluations,
    aiFeedback,
    marksAwarded,
    maxMarks,
    feedback: status === 'correct'
      ? 'Correct answer!'
      : status === 'partially_correct'
        ? 'Partially correct. You got some steps right.'
        : 'Incorrect answer. Please review your solution.',
  };
}

/**
 * Evaluate entire quiz
 */
export async function evaluateQuiz(
  quiz: { questions: Question[] },
  studentAnswers: Record<string, Record<string, string>>
): Promise<QuizEvaluation> {
  const results: EvaluationResult[] = [];
  
  for (const question of quiz.questions) {
    const questionAnswers = studentAnswers[question.id] || {};
    let result: EvaluationResult;
    
    if (question.questionType === 'mcq' || question.mcqOptions) {
      const selectedOptionId = questionAnswers[question.id] || '';
      result = evaluateMCQ(question, selectedOptionId);
    } else if (question.questionType === 'fill-in-the-blank') {
      result = evaluateFillInTheBlank(question, questionAnswers);
    } else {
      // Open-ended
      result = await evaluateOpenEnded(question, questionAnswers);
    }
    
    results.push(result);
  }
  
  const totalScore = results.filter(r => r.isCorrect).length;
  const maxScore = results.length;
  const totalMarksAwarded = results.reduce((sum, r) => sum + r.marksAwarded, 0);
  const totalMaxMarks = results.reduce((sum, r) => sum + r.maxMarks, 0);
  const percentage = totalMaxMarks > 0 ? Math.round((totalMarksAwarded / totalMaxMarks) * 100) : 0;
  
  return {
    results,
    totalScore,
    maxScore,
    totalMarksAwarded,
    totalMaxMarks,
    percentage,
  };
}

