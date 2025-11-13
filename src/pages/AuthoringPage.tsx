import { useState } from 'react';
import { QuestionBuilder } from '@/components/authoring/QuestionBuilder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Question, Quiz } from '@/types';
import { saveQuiz, generateId } from '@/utils/storage';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft } from 'lucide-react';

export function AuthoringPage() {
  const navigate = useNavigate();
  const [quizTitle, setQuizTitle] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isEditing, setIsEditing] = useState(false);

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
    setCurrentQuestion(null);
    setIsEditing(false);
  };

  if (currentQuestion || (!currentQuestion && questions.length === 0)) {
    return (
      <div className="h-full bg-background flex flex-col min-h-0">
        <div className="border-b border-border bg-card flex-shrink-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-semibold">Create Question</h1>
            <div className="w-20" />
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 lg:p-6">
            <QuestionBuilder
              question={currentQuestion || undefined}
              onSave={handleSaveQuestion}
              onCancel={handleNewQuestion}
            />
          </div>
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
            <Button onClick={handleNewQuestion} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
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

