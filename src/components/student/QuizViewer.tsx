import { useState } from 'react';
import { QuestionDisplay } from './QuestionDisplay';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { Quiz, QuizEvaluation } from '@/types';
import { evaluateQuiz } from '@/utils/evaluation';

interface QuizViewerProps {
  quiz: Quiz;
  onComplete?: (answers: Record<string, Record<string, string>>, evaluation: QuizEvaluation) => void;
}

export function QuizViewer({ quiz, onComplete }: QuizViewerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({});
  const [isEvaluating, setIsEvaluating] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const questionAnswers = answers[currentQuestion.id] || {};

  const handleAnswerChange = (answerBoxId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        [answerBoxId]: answer,
      },
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setIsEvaluating(true);
    try {
      const evaluation = await evaluateQuiz(quiz, answers);
      if (onComplete) {
        onComplete(answers, evaluation);
      } else {
        alert(`Quiz completed! Score: ${evaluation.totalScore}/${evaluation.maxScore} (${evaluation.percentage}%)`);
      }
    } catch (error) {
      console.error('Error evaluating quiz:', error);
      alert('Error evaluating quiz. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{quiz.title}</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </div>
          <div className="text-sm font-medium">
            Total Marks: {quiz.questions.reduce((sum, q) => sum + (q.marks || 1), 0)}
          </div>
        </div>
      </div>

      {currentQuestion && (
        <QuestionDisplay
          question={currentQuestion}
          answers={questionAnswers}
          onAnswerChange={handleAnswerChange}
        />
      )}

      <div className="flex justify-between items-center pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>
        {currentQuestionIndex === quiz.questions.length - 1 ? (
          <Button onClick={handleSubmit} disabled={isEvaluating}>
            {isEvaluating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Evaluating...
              </>
            ) : (
              'Submit Quiz'
            )}
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}

