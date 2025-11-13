import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Edit, Sparkles } from 'lucide-react';
import { createGCSEQuiz } from '@/utils/createSampleQuiz';

export function HomePage() {
  const navigate = useNavigate();

  console.log('HomePage rendering');

  const handleCreateGCSEQuiz = () => {
    const quiz = createGCSEQuiz();
    alert(`✅ Successfully created GCSE Math quiz!\n\nQuiz: ${quiz.title}\nQuestions: ${quiz.questions.length}\n\nYou can now view it in Student Mode!`);
    navigate('/student');
  };

  return (
    <div className="h-full bg-background flex items-center justify-center min-h-0">
      <div className="max-w-2xl mx-auto p-6 text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">Math Quiz App</h1>
          <p className="text-muted-foreground text-lg">
            Create and take math quizzes with LaTeX support
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={handleCreateGCSEQuiz} 
            className="w-full md:w-auto mx-auto"
            variant="default"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Create Sample GCSE Quiz (3 Questions)
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="border border-border rounded-lg p-6 bg-card space-y-4">
            <Edit className="h-12 w-12 mx-auto text-primary" />
            <h2 className="text-xl font-semibold">Author Mode</h2>
            <p className="text-muted-foreground">
              Create math questions with text and LaTeX support. Add answer boxes for students to fill in.
            </p>
            <Button onClick={() => navigate('/authoring')} className="w-full">
              Create Quiz
            </Button>
          </div>

          <div className="border border-border rounded-lg p-6 bg-card space-y-4">
            <BookOpen className="h-12 w-12 mx-auto text-primary" />
            <h2 className="text-xl font-semibold">Student Mode</h2>
            <p className="text-muted-foreground">
              Take quizzes and answer math questions using the built-in math keyboard.
            </p>
            <Button onClick={() => navigate('/student')} variant="outline" className="w-full">
              Take Quiz
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

