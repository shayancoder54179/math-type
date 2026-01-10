import { useState } from 'react';
import { QuestionBuilder } from '@/components/authoring/QuestionBuilder';
import { AIQuestionGenerator } from '@/components/authoring/AIQuestionGenerator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Question, Quiz } from '@/types';
import { saveQuiz, generateId } from '@/utils/storage';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Sparkles, Edit } from 'lucide-react';

type AuthoringMode = 'selection' | 'manual' | 'ai';

export function AuthoringPage() {
  const navigate = useNavigate();
  const [quizTitle, setQuizTitle] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [authoringMode, setAuthoringMode] = useState<AuthoringMode>('selection');

  const handleSaveQuestion = (question: Question) => {
    if (isEditing) {
      setQuestions(questions.map(q => q.id === question.id ? question : q));
      setIsEditing(false);
    } else {
      setQuestions([...questions, question]);
    }
    setCurrentQuestion(null);
  };

  const handleEditQuestion = (question: Question) => {
    setCurrentQuestion(question);
    setIsEditing(true);
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleSaveQuiz = () => {
    if (!quizTitle.trim()) {
      alert('Please enter a quiz title');
      return;
    }
    if (questions.length === 0) {
      alert('Please add at least one question');
      return;
    }

    const quiz: Quiz = {
      id: generateId(),
      title: quizTitle,
      questions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveQuiz(quiz);
    alert('Quiz saved successfully!');
    navigate('/student');
  };

  const handleNewQuestion = () => {
    // If we already have questions, adding a new one usually implies manual mode
    setAuthoringMode('manual');
    setCurrentQuestion(null);
    setIsEditing(false);
  };

  const handleAIGenerated = (newQuestions: Question[]) => {
    setQuestions([...questions, ...newQuestions]);
    // Switch to list view
    setAuthoringMode('manual'); 
    setCurrentQuestion(null);
  };

  // 1. Mode Selection Screen (Only if no questions and mode is selection)
  if (questions.length === 0 && authoringMode === 'selection') {
    return (
      <div className="h-full bg-background flex flex-col min-h-0">
        <div className="border-b border-border bg-card flex-shrink-0 z-40">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-semibold">Create New Exam</h1>
            <div className="w-20" />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
            {/* Manual Mode Card */}
            <div 
              className="group relative bg-card hover:bg-accent/50 border border-border rounded-xl p-8 cursor-pointer transition-all hover:shadow-lg flex flex-col items-center text-center space-y-4"
              onClick={() => setAuthoringMode('manual')}
            >
              <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Edit className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Manual Authoring</h2>
              <p className="text-muted-foreground">
                Create questions from scratch using the block-based builder. Perfect for custom exams.
              </p>
              <Button variant="outline" className="mt-4">Select Manual Mode</Button>
            </div>

            {/* AI Mode Card */}
            <div 
              className="group relative bg-card hover:bg-accent/50 border border-border rounded-xl p-8 cursor-pointer transition-all hover:shadow-lg flex flex-col items-center text-center space-y-4"
              onClick={() => setAuthoringMode('ai')}
            >
              <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">AI-Generated Mode</h2>
              <p className="text-muted-foreground">
                Automatically generate curriculum-aligned questions based on topic and difficulty.
              </p>
              <Button variant="outline" className="mt-4">Select AI Mode</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. AI Generator Screen
  if (authoringMode === 'ai') {
    return (
      <div className="h-full bg-background flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto">
          <AIQuestionGenerator 
            onGenerate={handleAIGenerated}
            onCancel={() => setAuthoringMode('selection')}
          />
        </div>
      </div>
    );
  }

  // 3. Manual Question Builder (Editing or Creating new in manual mode)
  // Show builder if:
  // - We are editing a question (currentQuestion is set)
  // - OR we are in manual mode and have no questions yet (forced first question)
  // - OR we explicitly clicked "Add Question" (which sets currentQuestion=null but implies manual addition)
  // 
  // Wait, if questions.length > 0, we show the list unless currentQuestion is set.
  // If questions.length === 0 and mode is manual, we show builder.
  if (currentQuestion || (questions.length === 0 && authoringMode === 'manual')) {
    return (
      <div className="h-full bg-background flex flex-col min-h-0">
        <div className="border-b border-border bg-card flex-shrink-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Button variant="ghost" onClick={() => {
              if (questions.length === 0) {
                setAuthoringMode('selection');
              } else {
                setCurrentQuestion(null);
              }
            }}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-semibold">
              {currentQuestion ? 'Edit Question' : 'Create Question'}
            </h1>
            <div className="w-20" />
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 lg:p-6">
            <QuestionBuilder
              question={currentQuestion || undefined}
              onSave={handleSaveQuestion}
              onCancel={() => {
                if (questions.length === 0) {
                  setAuthoringMode('selection');
                } else {
                  setCurrentQuestion(null);
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // 4. Quiz Overview / List View (Default when questions exist)
  return (
    <div className="h-full bg-background flex flex-col min-h-0">
      <div className="border-b border-border bg-card flex-shrink-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-semibold">Author Quiz</h1>
          <div className="w-20" />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Quiz Title</label>
          <Input
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            placeholder="Enter quiz title..."
            className="w-full"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Questions ({questions.length})</h2>
            <div className="flex gap-2">
               {/* Add option to add more AI questions? Maybe later. For now just manual add. */}
              <Button onClick={handleNewQuestion} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className="border border-border rounded-md p-4 bg-card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">Question {index + 1}</h3>
                    <p className="text-sm text-muted-foreground">{question.instruction}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditQuestion(question)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {question.blocks.length} block(s), {question.answerBoxes?.length || 0} answer box(es)
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSaveQuiz} size="lg">
            Save Quiz
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
}
