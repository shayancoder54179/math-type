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
  correctSolutionSteps?: string[];
  error?: string;
}

export interface StepEvaluationResult {
  steps: StepEvaluation[];
  correctSolutionSteps?: string[];
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
      correctSolutionSteps: response.correctSolutionSteps,
    };
  } catch (err) {
    console.error('Exception calling edge function:', err);
    return null;
  }
}

