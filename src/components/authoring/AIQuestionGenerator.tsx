import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { generateQuestionsWithOpenAI } from '@/utils/supabase-edge';
import { Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import type { Question } from '@/types';

interface AIQuestionGeneratorProps {
  onGenerate: (questions: Question[]) => void;
  onCancel: () => void;
}

export function AIQuestionGenerator({ onGenerate, onCancel }: AIQuestionGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    qualification: '',
    board: '',
    topic: '',
    subtopic: '',
    count: '3',
    difficulty: 'Medium',
    totalMarks: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const count = parseInt(formData.count);
      if (isNaN(count) || count < 1 || count > 20) {
        throw new Error('Number of questions must be between 1 and 20');
      }

      if (!formData.qualification || !formData.board || !formData.topic) {
        throw new Error('Please fill in all required fields');
      }

      const questions = await generateQuestionsWithOpenAI({
        qualification: formData.qualification,
        board: formData.board,
        topic: formData.topic,
        subtopic: formData.subtopic || undefined,
        count,
        difficulty: formData.difficulty,
        totalMarks: formData.totalMarks ? parseInt(formData.totalMarks) : undefined,
      });

      if (!questions) {
        throw new Error('Failed to generate questions. Please try again.');
      }

      onGenerate(questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Question Generator
          </h1>
          <p className="text-muted-foreground">
            Automatically generate curriculum-aligned math questions
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 border border-border rounded-lg p-6 bg-card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Qualification *</label>
            <Select
              value={formData.qualification}
              onValueChange={(val) => setFormData({ ...formData, qualification: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Qualification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GCSE">GCSE</SelectItem>
                <SelectItem value="IGCSE">IGCSE</SelectItem>
                <SelectItem value="A-Level">A-Level</SelectItem>
                <SelectItem value="IB">IB</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Exam Board *</label>
            <Select
              value={formData.board}
              onValueChange={(val) => setFormData({ ...formData, board: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Board" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cambridge">Cambridge</SelectItem>
                <SelectItem value="Edexcel">Edexcel</SelectItem>
                <SelectItem value="AQA">AQA</SelectItem>
                <SelectItem value="OCR">OCR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Subject</label>
          <Input value="Mathematics" disabled className="bg-muted" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Topic *</label>
            <Input
              placeholder="e.g., Quadratic Equations"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Subtopic (Optional)</label>
            <Input
              placeholder="e.g., Solving by factorization"
              value={formData.subtopic}
              onChange={(e) => setFormData({ ...formData, subtopic: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Number of Questions</label>
            <Input
              type="number"
              min="1"
              max="20"
              value={formData.count}
              onChange={(e) => setFormData({ ...formData, count: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Difficulty</label>
            <Select
              value={formData.difficulty}
              onValueChange={(val) => setFormData({ ...formData, difficulty: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Total Marks (Optional)</label>
             <Input
              type="number"
              min="1"
              placeholder="Auto"
              value={formData.totalMarks}
              onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
            />
          </div>
        </div>

        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

        <div className="pt-4">
          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Questions...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Questions
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
