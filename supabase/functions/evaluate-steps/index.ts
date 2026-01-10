import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

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
    
    // Hardcoded for now, but should come from question data in the future
    const qualification = "IGCSE"; // Default to IGCSE if not specified
    const board = "Edexcel"; // Default to Edexcel if not specified
    const subject = "Mathematics";

    let prompt = `You are an expert mathematics examiner for UK qualifications (${qualification}). 

CRITICAL EVALUATION SEQUENCE:
1. FINAL ANSWER CHECK: Does the student's final answer "${studentFinalAnswerStr}" match the ground truth "${correctAnswerStr}"? (Allow for equivalent mathematical forms).
2. WORKING VALIDITY CHECK: Regardless of whether the final answer is correct, evaluate the student's working steps. Are they mathematically sound?
3. AWARD MARKS: 
   - If (Final Answer Matches) AND (Working is Valid) → FULL MARKS.
   - If (Final Answer Matches) BUT (Working is missing/incomplete) → Award partial marks.
   - If (Final Answer is Wrong) BUT (Working shows correct method) → Award partial marks (Method marks).

RULES:
- Do NOT penalize for taking a different (but valid) approach than your model answer.
- Only mark a step as wrong if there is an actual mathematical error.
- The Ground Truth "${correctAnswerStr}" is absolute. If your internal solution differs, YOU are wrong. Adjust your logic to match the ground truth.

BEFORE EVALUATING THE STUDENT: 
1. Solve the question yourself: ${questionText}
2. Ensure your solution matches the absolute ground truth: ${correctAnswerStr}.

THEN EVALUATE THE STUDENT: 
- Student Final Answer: ${studentFinalAnswerStr}
- Student Working Steps:
${stepsText}

---

QUESTION DATA:
Question: ${question.instruction}
${questionText}
Marks Available: ${maxMarks}

---

FEEDBACK REQUIREMENTS:
    - Use $...$ for ALL mathematical expressions.
    - modelAnswer: Provide a 100% accurate step-by-step solution leading to "${correctAnswerStr}".
    - DO NOT include "Step 1", "Step 2" prefixes in modelAnswer.
    - Each item in modelAnswer array should be a single logical step. Do NOT combine multiple steps into one string with many periods.
    - positive_feedback: List exactly what was done correctly.
    - constructive_feedback: Only mention actual errors. If none, state "Your answer is completely correct."
    
    ---
    
    Return your evaluation as a JSON object:
    {
      "steps": [
        {
          "stepIndex": number,
          "stepContent": string,
          "isCorrect": boolean,
          "feedback": string
        }
      ],
      "modelAnswer": [
        "Description with $math$",
        "Next logical step with $math$"
      ],
      "correctPoints": ["..."],
      "improvementPoints": ["..."]
    }

IMPORTANT: Return ONLY the JSON object.`;

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
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
    } catch {
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
    // Truncate steps to match studentSteps length to avoid duplicates or hallucinations
    steps = steps.slice(0, studentSteps.length).map((step, idx) => ({
      ...step,
      stepIndex: idx,
      stepContent: studentSteps[idx] || step.stepContent,
    }));

    // Extract new fields
    const modelAnswer = parsedResponse.modelAnswer || [];
    const correctPoints = parsedResponse.correctPoints || [];
    const improvementPoints = parsedResponse.improvementPoints || [];

    const response: StepEvaluationResponse = {
      steps,
      modelAnswer,
      correctPoints,
      improvementPoints,
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

