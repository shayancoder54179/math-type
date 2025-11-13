import { useState, useEffect } from 'react';
import { QuizViewer } from '@/components/student/QuizViewer';
import { QuizResults } from '@/components/student/QuizResults';
import { Button } from '@/components/ui/button';
import { getAllQuizzes, deleteQuiz } from '@/utils/storage';
import type { Quiz, QuizEvaluation } from '@/types';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Trash2 } from 'lucide-react';

export function StudentPage() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [evaluation, setEvaluation] = useState<QuizEvaluation | null>(null);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = () => {
    const allQuizzes = getAllQuizzes();
    setQuizzes(allQuizzes);
  };

  const handleStartQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
  };

  const handleDeleteQuiz = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this quiz?')) {
      deleteQuiz(id);
      loadQuizzes();
      if (selectedQuiz?.id === id) {
        setSelectedQuiz(null);
      }
    }
  };

  const handleComplete = (answers: Record<string, Record<string, string>>, evaluationResult: QuizEvaluation) => {
    console.log('Quiz answers:', answers);
    console.log('Evaluation:', evaluationResult);
    setEvaluation(evaluationResult);
  };

  const handleBackToQuizzes = () => {
    setSelectedQuiz(null);
    setEvaluation(null);
  };

  if (selectedQuiz) {
    // Show results if evaluation is complete
    if (evaluation) {
      return (
        <div className="h-full bg-background flex flex-col min-h-0">
          <div className="border-b border-border bg-card flex-shrink-0 z-40">
            <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
              <Button variant="ghost" onClick={handleBackToQuizzes}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Quizzes
              </Button>
              <h1 className="text-xl font-semibold">Quiz Results</h1>
              <div className="w-20" />
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <QuizResults quiz={selectedQuiz} evaluation={evaluation} />
          </div>
        </div>
      );
    }

    // Show quiz viewer
    return (
      <div className="h-full bg-background flex flex-col min-h-0">
        <div className="border-b border-border bg-card flex-shrink-0 z-40">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Button variant="ghost" onClick={handleBackToQuizzes}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quizzes
            </Button>
            <h1 className="text-xl font-semibold">Take Quiz</h1>
            <div className="w-20" />
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <QuizViewer quiz={selectedQuiz} onComplete={handleComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background flex flex-col min-h-0">
      <div className="border-b border-border bg-card flex-shrink-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-semibold">Available Quizzes</h1>
          <div className="w-20" />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
        {quizzes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No quizzes available</p>
            <Button onClick={() => navigate('/authoring')}>
              Create Your First Quiz
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {quizzes.map(quiz => (
              <div
                key={quiz.id}
                className="border border-border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{quiz.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {quiz.questions.length} question(s)
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created: {new Date(quiz.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleStartQuiz(quiz)}
                      variant="default"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Quiz
                    </Button>
                    <Button
                      onClick={(e) => handleDeleteQuiz(quiz.id, e)}
                      variant="destructive"
                      size="icon"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

