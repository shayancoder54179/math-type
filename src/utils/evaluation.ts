import type { Question, EvaluationResult, QuizEvaluation, StepEvaluation } from '@/types';
import { evaluateWorkingStepsWithOpenAI } from './supabase-edge';

const WORKING_STEPS_KEY_PREFIX = 'working-steps-';
const FINAL_ANSWER_KEY_PREFIX = 'final-answer-';

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
  if (allCorrect) {
    feedback = 'All blanks filled correctly!';
  } else if (correctCount === 0) {
    feedback = 'All answers are incorrect.';
  } else {
    feedback = `Some answers are incorrect. (${correctCount} of ${totalCount} correct)`;
  }
  
  return {
    questionId: question.id,
    isCorrect: allCorrect,
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
  const FINAL_ANSWER_KEY = `${FINAL_ANSWER_KEY_PREFIX}${question.id}`;
  
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
  
  // Extract final answers
  const finalAnswers: string[] = [];
  const correctAnswers: string[] = [];
  
  if (question.answerBoxes && question.answerBoxes.length > 0) {
    for (const answerBox of question.answerBoxes) {
      const finalAnswerKey = `${FINAL_ANSWER_KEY}-${answerBox.id}`;
      const studentFinalAnswer = studentAnswers[finalAnswerKey] || '';
      finalAnswers.push(studentFinalAnswer);
      correctAnswers.push(answerBox.answer);
    }
  } else {
    // Fallback: single final answer
    const studentFinalAnswer = studentAnswers[FINAL_ANSWER_KEY] || '';
    finalAnswers.push(studentFinalAnswer);
    // For single answer, we need to extract from question blocks or use a default
    correctAnswers.push(question.answerBoxes?.[0]?.answer || '');
  }
  
  // Evaluate final answers
  let finalAnswerCorrect = true;
  if (finalAnswers.length === correctAnswers.length) {
    for (let i = 0; i < finalAnswers.length; i++) {
      if (!compareMathExpressions(finalAnswers[i], correctAnswers[i])) {
        finalAnswerCorrect = false;
        break;
      }
    }
  } else {
    finalAnswerCorrect = false;
  }
  
  const maxMarks = question.marks || 1;
  
  // Evaluate working steps with OpenAI if student provided steps
  // This evaluates steps independently of whether the final answer is correct
  let stepEvaluations: StepEvaluation[] | undefined;
  let correctSolutionSteps: string[] | undefined;
  if (workingSteps.length > 0 && correctAnswers.length > 0) {
    try {
      // Use student's final answer (even if wrong) and correct answer for context
      const studentFinalAnswerForEvaluation = finalAnswers.length > 0 ? finalAnswers : ['(no answer provided)'];
      const stepResult = await evaluateWorkingStepsWithOpenAI(
        question,
        workingSteps,
        studentFinalAnswerForEvaluation,
        correctAnswers
      );
      
      if (stepResult) {
        stepEvaluations = stepResult.steps;
        correctSolutionSteps = stepResult.correctSolutionSteps;
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
    // Since final answer is wrong, only award based on steps
    const stepMarks = Math.round((correctStepsCount / totalSteps) * maxMarks * 0.7);
    marksAwarded = Math.max(0, stepMarks);
  }
  
  return {
    questionId: question.id,
    isCorrect: finalAnswerCorrect,
    studentAnswer: finalAnswers.length === 1 ? finalAnswers[0] : finalAnswers,
    correctAnswer: correctAnswers.length === 1 ? correctAnswers[0] : correctAnswers,
    finalAnswerCorrect,
    workingSteps: stepEvaluations,
    correctSolutionSteps,
    marksAwarded,
    maxMarks,
    feedback: finalAnswerCorrect 
      ? 'Correct answer!' 
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

