import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MathInput, type MathInputHandle } from '@/components/shared/MathInput';
import type { SegmentedElement } from '@/types';
import { generateId } from '@/utils/storage';

interface SegmentedMathEditorProps {
  elements: SegmentedElement[];
  onChange: (elements: SegmentedElement[]) => void;
  onBlanksChange?: (blankIds: number[]) => void;
}

export function SegmentedMathEditor({ elements, onChange, onBlanksChange }: SegmentedMathEditorProps) {
  const mathInputRefs = useRef<Map<string, MathInputHandle>>(new Map());
  const [activeMathIndex, setActiveMathIndex] = useState<number | null>(null);

  // Extract blank IDs for answer box creation
  useEffect(() => {
    const blankIds = elements
      .filter((el): el is Extract<SegmentedElement, { type: 'blank' }> => el.type === 'blank')
      .map(el => el.id)
      .sort((a, b) => a - b);
    onBlanksChange?.(blankIds);
  }, [elements, onBlanksChange]);

  // Don't auto-initialize here - let parent handle it
  // This was causing issues with controlled component

  const handleMathChange = (id: string, value: string) => {
    const updated = elements.map(el => 
      el.type === 'math' && el.id === id ? { ...el, value } : el
    );
    onChange(updated);
  };

  const handleMathFocus = (mathIndex: number) => {
    setActiveMathIndex(mathIndex);
  };

  const handleInsertBlank = () => {
    // Use the active math index, or find the first math segment if none is active
    let mathIndex = activeMathIndex;
    if (mathIndex === null) {
      mathIndex = elements.findIndex(el => el.type === 'math');
      if (mathIndex === -1) return;
    }

    const mathElement = elements[mathIndex];
    if (mathElement.type !== 'math') return;

    const mathInput = mathInputRefs.current.get(mathElement.id);
    if (!mathInput) return;

    // Get current latex value
    const currentLatex = mathInput.getLatex();
    
    // For now, we'll split at the end of the current segment
    // In a full implementation, we'd get cursor position from MathQuill
    // and split at that position
    
    // Find the next blank number
    const existingBlanks = elements
      .filter((el): el is Extract<SegmentedElement, { type: 'blank' }> => el.type === 'blank')
      .map(el => el.id);
    const nextBlankId = existingBlanks.length > 0 ? Math.max(...existingBlanks) + 1 : 1;

    // Split: keep current value in current segment, add blank, add new empty math segment
    const newElements: SegmentedElement[] = [
      ...elements.slice(0, mathIndex),
      { type: 'math', value: currentLatex, id: mathElement.id },
      { type: 'blank', id: nextBlankId },
      { type: 'math', value: '', id: generateId() },
      ...elements.slice(mathIndex + 1),
    ];

    onChange(newElements);

    // Focus the new math segment
    setTimeout(() => {
      const newMathIndex = mathIndex + 2; // After current math and blank
      const newMathElement = newElements[newMathIndex];
      if (newMathElement && newMathElement.type === 'math') {
        const newInput = mathInputRefs.current.get(newMathElement.id);
        newInput?.focus();
        setActiveMathIndex(newMathIndex);
      }
    }, 100);
  };

  const registerMathInput = (id: string, ref: MathInputHandle | null) => {
    if (ref) {
      mathInputRefs.current.set(id, ref);
    } else {
      mathInputRefs.current.delete(id);
    }
  };

  return (
    <div className="space-y-2">
      {/* Single Insert Blank button above the row */}
      <div className="flex justify-start">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleInsertBlank}
          className="h-8 px-3 text-xs"
          title="Insert Blank at cursor position"
        >
          Insert Blank
        </Button>
      </div>
      
      {/* Inline row of math segments and blanks */}
      {elements.length === 0 ? (
        <div className="text-sm text-muted-foreground p-4 border border-dashed rounded">
          No segments yet. Initializing...
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {elements.map((element, index) => {
            if (element.type === 'math') {
              return (
                <MathInput
                  key={element.id}
                  ref={(ref) => registerMathInput(element.id, ref)}
                  value={element.value}
                  onChange={(value) => handleMathChange(element.id, value)}
                  onFocus={() => handleMathFocus(index)}
                  className="w-auto min-w-[150px]"
                />
              );
            } else {
              return (
                <div
                  key={`blank-${element.id}`}
                  className="inline-flex items-center justify-center px-3 py-2 border-2 border-dashed border-primary rounded min-w-[60px] bg-muted/30 font-semibold"
                >
                  Blank #{element.id}
                </div>
              );
            }
          })}
        </div>
      )}
    </div>
  );
}

