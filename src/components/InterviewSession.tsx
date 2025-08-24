import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, MicOff, Video, VideoOff, Phone, Clock, Brain, 
  MessageSquare, RotateCcw, CheckCircle, AlertCircle, Loader2 
} from 'lucide-react';
import { generateInterviewQuestions, InterviewQuestion } from '@/services/interviewService';

interface InterviewSessionProps {
  config: any;
  onEndInterview: (results: InterviewResults) => void;
}

interface InterviewResults {
  score: number;
  feedback: Array<{
    question: string;
    answer: string;
    score: number;
    feedback: string;
  }>;
  duration: number;
  strengths: string[];
  improvements: string[];
}

const InterviewSession = ({ config, onEndInterview }: InterviewSessionProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  // Load AI-generated questions on component mount
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setIsLoadingQuestions(true);
        setQuestionsError(null);
        
        const result = await generateInterviewQuestions({
          category: config.type || 'technical',
          role: config.role || 'Software Engineer',
          experience: config.experience || 'mid',
          duration: parseInt(config.duration) || 30,
          focus: config.focus || []
        });

        if (result.success) {
          setQuestions(result.questions);
        } else {
          throw new Error(result.error || 'Failed to generate questions');
        }
      } catch (error) {
        console.error('Error loading questions:', error);
        setQuestionsError(error instanceof Error ? error.message : 'Failed to load questions');
        
        // Fallback to default questions
        setQuestions([
          {
            id: 1,
            type: 'opening',
            question: "Hello! I'm your AI interviewer. Can you start by telling me about yourself and what brings you here today?",
            expectedDuration: 180,
            difficulty: 'easy',
            tags: ['introduction']
          },
          {
            id: 2,
            type: 'behavioral',
            question: "Tell me about a time when you had to overcome a significant challenge at work. How did you approach it?",
            expectedDuration: 240,
            difficulty: 'medium',
            tags: ['problem-solving']
          },
          {
            id: 3,
            type: 'technical',
            question: "How would you explain your technical skills and experience relevant to this role?",
            expectedDuration: 300,
            difficulty: 'medium',
            tags: ['technical']
          }
        ]);
      } finally {
        setIsLoadingQuestions(false);
      }
    };

    loadQuestions();
  }, [config]);

  const totalQuestions = questions.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setCurrentAnswer('');
      setIsAnswering(false);
    } else {
      // End interview
      const mockResults: InterviewResults = {
        score: 85,
        feedback: questions.map(q => ({
          question: q.question,
          answer: "Mock answer provided by user",
          score: Math.floor(Math.random() * 30) + 70,
          feedback: "Good structure and clear communication. Consider providing more specific examples."
        })),
        duration: timeElapsed,
        strengths: ["Clear communication", "Good examples", "Professional demeanor"],
        improvements: ["More specific metrics", "Deeper technical details", "Ask follow-up questions"]
      };
      onEndInterview(mockResults);
    }
  };

  const handleEndInterview = () => {
    const mockResults: InterviewResults = {
      score: 78,
      feedback: questions.slice(0, currentQuestion + 1).map(q => ({
        question: q.question,
        answer: "Mock answer provided by user",
        score: Math.floor(Math.random() * 30) + 60,
        feedback: "Interview ended early. Consider completing all questions for comprehensive feedback."
      })),
      duration: timeElapsed,
      strengths: ["Professional start", "Good engagement"],
      improvements: ["Complete the full interview", "Provide more detailed responses"]
    };
    onEndInterview(mockResults);
  };

  if (isLoadingQuestions) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <h2 className="text-xl font-semibold">Generating AI Interview Questions</h2>
          <p className="text-muted-foreground">Creating personalized questions for your {config.type} interview...</p>
        </div>
      </div>
    );
  }

  if (questionsError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold">Question Generation Error</h2>
          <p className="text-muted-foreground">{questionsError}</p>
          <p className="text-sm text-muted-foreground">Using fallback questions for your interview.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
                <span className="text-sm font-medium">Recording</span>
              </div>
              <Badge variant="outline">{config.type} Interview</Badge>
              {questionsError && (
                <Badge variant="destructive" className="text-xs">Fallback Questions</Badge>
              )}
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                {formatTime(timeElapsed)}
              </div>
              <Progress value={progress} className="w-32" />
              <span className="text-sm text-muted-foreground">
                {currentQuestion + 1} of {totalQuestions}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Interviewer */}
            <Card>
              <CardContent className="p-6">
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-4 mx-auto">
                      <Brain className="h-10 w-10 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">AI Interviewer</h3>
                    <p className="text-sm text-muted-foreground">Sarah - Senior Interviewer</p>
                  </div>
                </div>
                
                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant={isMuted ? "destructive" : "secondary"}
                    size="icon"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant={!isVideoOn ? "destructive" : "secondary"}
                    size="icon"
                    onClick={() => setIsVideoOn(!isVideoOn)}
                  >
                    {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </Button>
                  <Button variant="destructive" size="icon" onClick={handleEndInterview}>
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Your Video */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Response</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center">
                    {isVideoOn ? (
                      <div className="text-muted-foreground">
                        <Video className="h-12 w-12 mx-auto mb-2" />
                        <p>Your video feed</p>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        <VideoOff className="h-12 w-12 mx-auto mb-2" />
                        <p>Video disabled</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isRecording && (
                      <>
                        <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                        <span className="text-sm">Recording your response...</span>
                      </>
                    )}
                  </div>
                  <Button 
                    variant={isRecording ? "destructive" : "default"}
                    onClick={() => setIsRecording(!isRecording)}
                  >
                    {isRecording ? "Stop Recording" : "Start Recording"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question & Info Panel */}
          <div className="space-y-6">
            {/* Current Question */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Question {currentQuestion + 1}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-foreground leading-relaxed">
                    {questions[currentQuestion]?.question}
                  </p>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Suggested: {Math.floor(questions[currentQuestion]?.expectedDuration / 60)}m {questions[currentQuestion]?.expectedDuration % 60}s
                  </div>

                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full gap-2"
                      onClick={() => setIsAnswering(!isAnswering)}
                    >
                      <MessageSquare className="h-4 w-4" />
                      {isAnswering ? "I'm Done" : "Start Answer"}
                    </Button>
                    
                    {currentQuestion < questions.length - 1 ? (
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="w-full"
                        onClick={handleNextQuestion}
                      >
                        Next Question
                      </Button>
                    ) : (
                      <Button 
                        variant="success" 
                        size="sm" 
                        className="w-full gap-2"
                        onClick={handleNextQuestion}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Complete Interview
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interview Info */}
            <Card>
              <CardHeader>
                <CardTitle>Interview Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant="outline" className="capitalize">{config.type}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Role:</span>
                  <span className="font-medium">{config.role}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{config.duration} min</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress:</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Quick Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Look directly at the camera</li>
                  <li>• Speak clearly and at a steady pace</li>
                  <li>• Use the STAR method for behavioral questions</li>
                  <li>• Take a moment to think before responding</li>
                  <li>• Ask clarifying questions if needed</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSession;