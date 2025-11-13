import { useState, useEffect } from 'react';
import { X, Type, FunctionSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MathInput } from '@/components/shared/MathInput';
import type { AnswerBox as AnswerBoxType } from '@/types';

interface AnswerBoxProps {
  answerBox: AnswerBoxType;
  onChange: (id: string, label: string, answer: string, labelIsMath?: boolean) => void;
  onDelete?: (id: string) => void;
}

export function AnswerBox({ answerBox, onChange, onDelete }: AnswerBoxProps) {
  const [labelIsMath, setLabelIsMath] = useState(answerBox.labelIsMath || false);

  // Sync state when answerBox prop changes
  useEffect(() => {
    setLabelIsMath(answerBox.labelIsMath || false);
  }, [answerBox.labelIsMath]);

  return (
    <div className="flex items-start gap-2 p-2 border border-border rounded-md bg-card">
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-[200px]">
            {labelIsMath ? (
              <MathInput
                value={answerBox.label}
                onChange={(value) => onChange(answerBox.id, value, answerBox.answer, true)}
                placeholder="Label (e.g., x)"
                className="w-full"
              />
            ) : (
              <Input
                value={answerBox.label}
                onChange={(e) => onChange(answerBox.id, e.target.value, answerBox.answer, false)}
                placeholder="Label (e.g., x)"
                className="w-full pr-10"
              />
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                const newLabelIsMath = !labelIsMath;
                setLabelIsMath(newLabelIsMath);
                onChange(answerBox.id, answerBox.label, answerBox.answer, newLabelIsMath);
              }}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              title={labelIsMath ? 'Switch to text' : 'Switch to math'}
            >
              {labelIsMath ? (
                <Type className="h-3 w-3" />
              ) : (
                <FunctionSquare className="h-3 w-3" />
              )}
            </Button>
          </div>
          <span className="text-muted-foreground">=</span>
        </div>
        <div className="space-y-2">
          <MathInput
            value={answerBox.answer}
            onChange={(value) => onChange(answerBox.id, answerBox.label, value, answerBox.labelIsMath)}
            placeholder="Enter answer..."
            className="w-full"
          />
        </div>
      </div>
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(answerBox.id)}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

