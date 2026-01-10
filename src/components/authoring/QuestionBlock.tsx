import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MathInput, type MathInputHandle } from '@/components/shared/MathInput';
import type { QuestionBlock as QuestionBlockType } from '@/types';
import { getNextBlankNumber } from '@/utils/blanks';

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
    <div className="group relative flex items-center gap-1 p-0.5 hover:bg-muted/50 rounded transition-colors">
      <div className="flex-1 min-w-0">
        {block.type === 'math' ? (
          <MathInput
            ref={mathInputRef}
            value={block.content}
            onChange={(content) => onChange(block.id, content)}
            placeholder="Enter math..."
            className="w-auto min-w-[30px]"
            variant="ghost"
          />
        ) : (
          <Input
            ref={textInputRef}
            value={block.content}
            onChange={(e) => onChange(block.id, e.target.value)}
            placeholder="Enter text..."
            className="w-auto min-w-[60px] border-none shadow-none focus-visible:ring-0 px-1 min-h-0 h-auto py-0.5 bg-transparent"
            style={{ width: `${Math.max(block.content.length + 1, 4)}ch` }}
          />
        )}
        {showInsertBlank && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleInsertBlank}
            className="h-6 text-[10px] mt-1"
          >
            Insert Blank
          </Button>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(block.id)}
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute right-1 top-1 text-muted-foreground hover:text-destructive"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
