import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MathInput } from '@/components/shared/MathInput';
import type { MCQOption } from '@/types';

interface MCQOptionEditorProps {
  option: MCQOption;
  radioGroupName: string;
  onChange: (id: string, label: string, isCorrect: boolean) => void;
  onDelete: (id: string) => void;
}

export function MCQOptionEditor({ option, radioGroupName, onChange, onDelete }: MCQOptionEditorProps) {
  return (
    <div className="flex items-center gap-2 p-2 border border-border rounded-md bg-card">
      <div className="flex items-center gap-2 flex-1">
        <input
          type="radio"
          name={radioGroupName}
          checked={option.isCorrect}
          onChange={() => onChange(option.id, option.label, true)}
          className="h-4 w-4"
        />
        <div className="flex-1">
          <MathInput
            value={option.label}
            onChange={(value) => onChange(option.id, value, option.isCorrect)}
            placeholder="Enter option (math)..."
            className="w-full"
          />
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(option.id)}
        className="h-8 w-8"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

