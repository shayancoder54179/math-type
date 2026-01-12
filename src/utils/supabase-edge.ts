import { supabase } from './supabase';
import type { Question, StepEvaluation } from '@/types';

interface StepEvaluationRequest {
  question: Question;
  studentSteps: string[];
  studentFinalAnswer: string | string[];
  correctAnswer: string | string[];
}

interface StepEvaluationResponse {
  steps: StepEvaluation[];
  modelAnswer?: string[];
  correctPoints?: string[];
  improvementPoints?: string[];
  error?: string;
}

export interface StepEvaluationResult {
  steps: StepEvaluation[];
  modelAnswer: string[];
  correctPoints: string[];
  improvementPoints: string[];
}

export async function evaluateWorkingStepsWithOpenAI(
  question: Question,
  studentSteps: string[],
  studentFinalAnswer: string | string[],
  correctAnswer: string | string[]
): Promise<StepEvaluationResult | null> {
  try {
    const requestPayload: StepEvaluationRequest = {
      question,
      studentSteps,
      studentFinalAnswer,
      correctAnswer,
    };

    const { data, error } = await supabase.functions.invoke('evaluate-steps', {
      body: requestPayload,
    });

    if (error) {
      console.error('Error calling edge function:', error);
      return null;
    }

    const response = data as StepEvaluationResponse;
    
    if (response.error) {
      console.error('Error from edge function:', response.error);
      return null;
    }

    return {
      steps: response.steps || [],
      modelAnswer: response.modelAnswer || [],
      correctPoints: response.correctPoints || [],
      improvementPoints: response.improvementPoints || [],
    };
  } catch (err) {
    console.error('Exception calling edge function:', err);
    return null;
  }
}

export interface GenerateQuestionsRequest {
  qualification: string;
  board: string;
  topic: string;
  subtopic?: string;
  count: number;
  difficulty?: string;
  totalMarks?: number;
}

export async function generateQuestionsWithOpenAI(
  params: GenerateQuestionsRequest
): Promise<Question[] | null> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-questions', {
      body: params,
    });

    if (error) {
      console.error('Error calling edge function:', error);
      throw new Error(error.message || 'Error calling question generation service');
    }

    if (data.questions) {
      // Map the response to our Question type, ensuring IDs and other fields are present
      return data.questions.map((q: any) => ({
        id: crypto.randomUUID(),
        instruction: "Solve the following problem:", // Default instruction if not provided
        questionType: 'open-ended',
        blocks: (q.questionBlocks || []).map((b: any) => ({
          ...b,
          id: b.id || crypto.randomUUID()
        })),
        marks: q.marks || 1,
        modelAnswer: q.modelAnswer?.workingSteps ? [
            ...q.modelAnswer.workingSteps,
            `Final Answer: ${q.modelAnswer.finalAnswer}`
        ] : [],
        answerBoxes: q.answerBoxes ? q.answerBoxes.map((box: any) => ({
            id: crypto.randomUUID(),
            label: box.label || "Answer",
            answer: box.answer || "",
            labelIsMath: box.label ? /[a-zA-Z]/.test(box.label) && box.label.includes('=') : false
        })) : [{
            id: crypto.randomUUID(),
            label: "Answer",
            answer: q.modelAnswer?.finalAnswer || ""
        }]
      }));
    }

    throw new Error('No questions returned from service');
  } catch (err) {
    console.error('Exception calling edge function:', err);
    throw err;
  }
}

