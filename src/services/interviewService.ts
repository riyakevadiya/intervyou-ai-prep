import { supabase } from '@/integrations/supabase/client';

export interface InterviewQuestion {
  id: number;
  type: string;
  question: string;
  expectedDuration: number;
  difficulty: string;
  tags: string[];
}

export interface GenerateQuestionsParams {
  category: string;
  role: string;
  experience: string;
  duration: number;
  focus?: string[];
}

export interface GenerateQuestionsResponse {
  success: boolean;
  questions: InterviewQuestion[];
  metadata?: {
    category: string;
    role: string;
    experience: string;
    duration: number;
    focus: string[];
  };
  error?: string;
}

export const generateInterviewQuestions = async (
  params: GenerateQuestionsParams
): Promise<GenerateQuestionsResponse> => {
  try {
    const searchParams = new URLSearchParams({
      category: params.category,
      role: params.role,
      experience: params.experience,
      duration: params.duration.toString(),
    });

    if (params.focus && params.focus.length > 0) {
      searchParams.set('focus', params.focus.join(','));
    }

    const { data, error } = await supabase.functions.invoke('interview-questions', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(error.message || 'Failed to generate questions');
    }

    // Make direct HTTP request as fallback since we're using GET with params
    const response = await fetch(
      `https://raveukhbbrkxwgawenvk.supabase.co/functions/v1/interview-questions?${searchParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhdmV1a2hiYnJreHdnYXdlbnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE7NTYwMjYxMjMsImV4cCI6MjA3MTYwMjEyM30.qekyXwQuSydVCo0sSn936EB4GwRg_UmAMzMEdLivG8U`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhdmV1a2hiYnJreHdnYXdlbnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMjYxMjMsImV4cCI6MjA3MTYwMjEyM30.qekyXwQuSydVCo0sSn936EB4GwRg_UmAMzMEdLivG8U',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to generate questions');
    }

    return result;
  } catch (error) {
    console.error('Error generating interview questions:', error);
    return {
      success: false,
      questions: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};