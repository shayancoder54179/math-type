import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StepEvaluationRequest {
  question: {
    id: string;
    instruction: string;
    blocks: Array<{ type: string; content: string }>;
    answerBoxes?: Array<{ id: string; label: string; answer: string }>;
    marks?: number;
  };
  studentSteps: string[];
  studentFinalAnswer: string | string[];
  correctAnswer: string | string[];
}

interface StepEvaluation {
  stepIndex: number;
  stepContent: string;
  isCorrect: boolean;
  feedback: string;
}

interface StepEvaluationResponse {
  steps: StepEvaluation[];
  correctSolutionSteps?: string[];
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get OpenAI API key from Supabase secrets
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const requestData: StepEvaluationRequest = await req.json();
    const { question, studentSteps, studentFinalAnswer, correctAnswer } = requestData;

    if (!studentSteps || studentSteps.length === 0) {
      return new Response(
        JSON.stringify({ steps: [] }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Build the prompt for OpenAI
    const questionText = question.blocks
      .map(block => block.content)
      .join(' ');
    
    const correctAnswerStr = Array.isArray(correctAnswer) 
      ? correctAnswer.join(', ') 
      : correctAnswer;
    
    const studentFinalAnswerStr = Array.isArray(studentFinalAnswer)
      ? studentFinalAnswer.join(', ')
      : studentFinalAnswer;

    const stepsText = studentSteps
      .map((step, idx) => `Step ${idx + 1}: ${step}`)
      .join('\n');

    const maxMarks = question.marks || 1;
    
    const prompt = `You are a math teacher evaluating a student's solution to a math problem.

PROBLEM TO SOLVE:
Question: ${question.instruction}
${questionText}

CORRECT FINAL ANSWER: ${correctAnswerStr}
STUDENT'S FINAL ANSWER: ${studentFinalAnswerStr}
TOTAL MARKS FOR THIS QUESTION: ${maxMarks}

STUDENT'S WORKING STEPS:
${stepsText}

TASK: 
1. Evaluate each of the student's working steps to determine if they are mathematically correct and logically lead toward solving the problem correctly.
2. If the student's final answer is incorrect, provide the correct solution steps.
3. Consider the mark allocation (${maxMarks} marks total) when evaluating - steps should be evaluated fairly based on their contribution to solving the problem.

For each student step, evaluate:
1. Is the step mathematically correct? (Check for calculation errors, algebraic mistakes, etc.)
2. Does this step logically progress toward the correct answer? (Even if the student's final answer is wrong, the steps can still be correct if they follow valid mathematical reasoning)
3. Is the step appropriate for solving this type of problem?

IMPORTANT:
- Evaluate steps independently - a step can be correct even if the student's final answer is wrong
- A step is correct if it's mathematically valid and moves toward the solution
- Be strict but fair - mark steps as incorrect only if there are actual mathematical errors
- Consider that there may be multiple valid solution paths
- If the student's answer is wrong, provide clear, step-by-step correct solution

Return your evaluation as a JSON object with:
- "steps": array of step evaluations (same format as before)
- "correctSolutionSteps": array of strings (only include if student's final answer is incorrect) - each string is a step in the correct solution

IMPORTANT FOR correctSolutionSteps FORMATTING:
- Format each step as "Text description: math expression"
- Keep text and math separate - text before colon, math after colon
- ALWAYS include spaces around operators and keywords in math expressions:
  - Use "x + 2 = 0 or x + 3 = 0" NOT "x+2=0orx+3=0"
  - Use "x = -2 or x = -3" NOT "x=-2orx=-3"
  - Always put spaces around: =, +, -, *, /, "or", "and"
- Examples:
  - "Factor: (x + 2)(x + 3) = 0"
  - "Apply zero product property: x + 2 = 0 or x + 3 = 0"
  - "Solve: x = -2 or x = -3"
- If a step is pure math with no description, just provide the math expression with proper spacing

Example format:
{
  "steps": [
    {
      "stepIndex": 0,
      "stepContent": "x^2 + 5x + 6 = 0",
      "isCorrect": true,
      "feedback": "Correctly set up the equation from the problem statement."
    }
  ],
  "correctSolutionSteps": [
    "x^2 + 5x + 6 = 0",
    "Factor: (x + 2)(x + 3) = 0",
    "Apply zero product property: x + 2 = 0 or x + 3 = 0",
    "Solve: x = -2 or x = -3"
  ]
}`;

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful math teacher assistant. Always respond with valid JSON only, no additional text.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      return new Response(
        JSON.stringify({ 
          error: `OpenAI API error: ${openaiResponse.status}`,
          steps: [] 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ 
          error: 'No response from OpenAI',
          steps: [] 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse OpenAI response
    let parsedResponse: { steps?: StepEvaluation[] };
    try {
      parsedResponse = JSON.parse(content);
    } catch (e) {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\{.*?\})\s*```/s);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[1]);
      } else {
        // Fallback: create evaluation from student steps
        const fallbackSteps: StepEvaluation[] = studentSteps.map((step, idx) => ({
          stepIndex: idx,
          stepContent: step,
          isCorrect: false,
          feedback: 'Could not parse OpenAI response. Please review manually.',
        }));
        return new Response(
          JSON.stringify({ steps: fallbackSteps }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Ensure we have the correct structure
    let steps: StepEvaluation[] = [];
    if (parsedResponse.steps && Array.isArray(parsedResponse.steps)) {
      steps = parsedResponse.steps;
    } else {
      // Fallback: create evaluation from student steps
      steps = studentSteps.map((step, idx) => ({
        stepIndex: idx,
        stepContent: step,
        isCorrect: false,
        feedback: 'Could not evaluate this step automatically.',
      }));
    }

    // Ensure stepContent matches original student steps
    steps = steps.map((step, idx) => ({
      ...step,
      stepIndex: idx,
      stepContent: studentSteps[idx] || step.stepContent,
    }));

    // Extract correct solution steps if provided
    const correctSolutionSteps = parsedResponse.correctSolutionSteps && Array.isArray(parsedResponse.correctSolutionSteps)
      ? parsedResponse.correctSolutionSteps
      : undefined;

    const response: StepEvaluationResponse = {
      steps,
      correctSolutionSteps,
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in edge function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        steps: [] 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

