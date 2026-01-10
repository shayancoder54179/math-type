import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateQuestionsRequest {
  qualification: string;
  board: string;
  topic: string;
  subtopic?: string;
  count: number;
  difficulty?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { qualification, board, topic, subtopic, count, difficulty } = await req.json() as GenerateQuestionsRequest;

    const prompt = `
    You are an expert mathematics examiner creating questions for ${qualification} ${board} curriculum.
    Generate questions that match the difficulty and style of real past papers.

    Generate ${count} mathematics questions for:
    - Qualification: ${qualification}
    - Board: ${board}
    - Subject: Mathematics
    - Topic: ${topic}
    ${subtopic ? `- Subtopic: ${subtopic}` : ''}
    ${difficulty ? `- Difficulty Level: ${difficulty}` : ''}

    Requirements:
    1. All questions must be OPEN-ENDED (students show working steps).
    2. Each question needs:
       - Clear question text with proper mathematical notation.
       - Marks allocation (appropriate to difficulty, typically 2-8 marks).
       - Detailed model answer showing step-by-step working.
       - STRICT BLOCK SEPARATION: "text" blocks must contain ONLY plain text. "math" blocks must contain ONLY LaTeX math.
       - NEVER put LaTeX (like $x$ or equations) inside a "text" block.
       - Answer Boxes: Define one or more answer boxes for the final result. Each box needs a label (e.g., "x =") and the correct answer value.

    Format the output as a JSON object with this structure:
    {
      "questions": [
        {
          "questionBlocks": [
            {"type": "text", "content": "Solve for "},
            {"type": "math", "content": "x"},
            {"type": "text", "content": ": "}
          ],
          "marks": 4,
          "answerBoxes": [
            { "label": "x =", "answer": "5" }
          ],
          "modelAnswer": {
            "finalAnswer": "x = 5",
            "workingSteps": [
              "Expand the brackets...",
              "Collect like terms..."
            ]
          }
        }
      ]
    }

    IMPORTANT:
    - BLOCK INTEGRITY: Any mathematical variable (like $x$), number in a formula, or equation MUST be in its own "math" block. 
    - Text blocks must NOT contain any $ symbols or LaTeX commands.
    - DOUBLE-CHECK YOUR MATH: Before finalizing each question, solve it yourself internally to ensure the finalAnswer is 100% accurate.
    - ANSWER BOXES: If solving for multiple variables (e.g., x and y), provide an answer box for each. The label should be concise (e.g., "x =", "y =", "Total Area =").
    - DO NOT include "Step 1", "Step 2" prefixes in workingSteps.
    - Ensure questions are curriculum-appropriate.
    - Use proper LaTeX notation for all math.
    - Provide complete and accurate model answers.
    - Do not include any text outside the JSON object.
    `;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Using GPT-4o for better math reasoning
        messages: [
          {
            role: 'system',
            content: 'You are a helpful math teacher assistant. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsedData = JSON.parse(content);

    return new Response(
      JSON.stringify(parsedData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
