import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category') || 'technical';
    const role = url.searchParams.get('role') || 'Software Engineer';
    const experience = url.searchParams.get('experience') || 'mid';
    const duration = parseInt(url.searchParams.get('duration') || '30');
    const focus = url.searchParams.get('focus')?.split(',') || [];

    console.log(`Generating ${category} questions for ${role} (${experience} level)`);

    // Calculate number of questions based on duration (roughly 1 question per 6 minutes)
    const numQuestions = Math.max(3, Math.floor(duration / 6));

    const systemPrompt = `You are an expert interviewer generating realistic interview questions. 

Generate exactly ${numQuestions} interview questions for:
- Category: ${category}
- Role: ${role}
- Experience Level: ${experience}
- Focus Areas: ${focus.join(', ') || 'General'}

Guidelines:
- For Technical: Include coding, system design, algorithms, databases, frameworks
- For Behavioral: Use STAR method scenarios, leadership, teamwork, conflict resolution
- For HR: Company culture, motivation, career goals, strengths/weaknesses
- For System Design: Architecture, scalability, trade-offs, real-world systems

Adjust difficulty for experience level:
- Entry: Basic concepts, simple scenarios
- Mid: Moderate complexity, some leadership questions
- Senior: Complex problems, architecture decisions, mentoring
- Executive: Strategic thinking, high-level design, organizational impact

Return a JSON array with this exact structure:
[
  {
    "id": 1,
    "type": "${category}",
    "question": "Your question here",
    "expectedDuration": 180,
    "difficulty": "medium",
    "tags": ["tag1", "tag2"]
  }
]

Make questions realistic, varied, and appropriate for the role and level.`;

    const userPrompt = `Generate ${numQuestions} ${category} interview questions for a ${experience}-level ${role} position.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    
    console.log('Generated content:', generatedContent);
    
    // Parse the JSON response
    let questions;
    try {
      questions = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      // Fallback to extract JSON from the response
      const jsonMatch = generatedContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to extract valid JSON from AI response');
      }
    }

    // Validate and sanitize questions
    const validQuestions = questions.map((q: any, index: number) => ({
      id: index + 1,
      type: q.type || category,
      question: q.question || 'Tell me about your experience.',
      expectedDuration: q.expectedDuration || 180,
      difficulty: q.difficulty || 'medium',
      tags: q.tags || []
    }));

    console.log(`Successfully generated ${validQuestions.length} questions`);

    return new Response(JSON.stringify({ 
      success: true,
      questions: validQuestions,
      metadata: {
        category,
        role,
        experience,
        duration,
        focus
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in interview-questions function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});