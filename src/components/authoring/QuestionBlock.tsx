import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MathInput, type MathInputHandle } from '@/components/shared/MathInput';
import type { QuestionBlock as QuestionBlockType } from '@/types';
import { getNextBlankNumber, findBlanks } from '@/utils/blanks';

interface QuestionBlockProps {
  block: QuestionBlockType;
  onChange: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  allBlocks?: QuestionBlockType[]; // All blocks to determine next blank number
  questionType?: string; // Only show insert blank for fill-in-the-blank type
}

export function QuestionBlock({ block, onChange, onDelete, allBlocks = [], questionType }: QuestionBlockProps) {
  const textInputRef = useRef<HTMLInputElement>(null);
  const mathInputRef = useRef<MathInputHandle>(null);
  const [showInsertBlank, setShowInsertBlank] = useState(questionType === 'fill-in-the-blank');
  
  useEffect(() => {
    setShowInsertBlank(questionType === 'fill-in-the-blank');
  }, [questionType]);

  const handleInsertBlank = () => {
    const nextNumber = getNextBlankNumber(allBlocks.length > 0 ? allBlocks : [block]);
    const blankPlaceholder = `[blank_${nextNumber}]`;
    
    if (block.type === 'text') {
      // For text input, insert at cursor position or append
      const input = textInputRef.current;
      if (input) {
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const currentValue = block.content || '';
        const newValue = currentValue.substring(0, start) + blankPlaceholder + currentValue.substring(end);
        onChange(block.id, newValue);
        
        // Set cursor position after inserted blank
        setTimeout(() => {
          input.focus();
          const newPosition = start + blankPlaceholder.length;
          input.setSelectionRange(newPosition, newPosition);
        }, 0);
      } else {
        // Fallback: append to end
        onChange(block.id, (block.content || '') + blankPlaceholder);
      }
    } else {
      // For math input, use MathQuill's write method
      if (mathInputRef.current) {
        mathInputRef.current.write(blankPlaceholder);
        mathInputRef.current.focus();
      } else {
        // Fallback: append to end
        onChange(block.id, (block.content || '') + blankPlaceholder);
      }
    }
  };

  return (
    <div className={`flex items-start gap-2 p-2 rounded-md bg-card ${block.type === 'text' ? 'border border-border' : 'border border-border'}`}>
      <div className="flex-1 space-y-2">
        {block.type === 'math' ? (
          <MathInput
            ref={mathInputRef}
            value={block.content}
            onChange={(content) => onChange(block.id, content)}
            placeholder="Enter math expression (e.g., x/3, x^2, sqrt(x))"
            className="w-full"
          />
        ) : (
          <Input
            ref={textInputRef}
            value={block.content}
            onChange={(e) => onChange(block.id, e.target.value)}
            placeholder="Enter text..."
            className="w-full"
          />
        )}
        {showInsertBlank && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleInsertBlank}
            className="h-7 text-xs"
          >
            Insert Blank
          </Button>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(block.id)}
        className="h-8 w-8"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

