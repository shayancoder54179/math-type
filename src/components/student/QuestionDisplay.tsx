import { useState, useEffect } from 'react';
import { MathInput } from '@/components/shared/MathInput';
import { MathDisplay } from '@/components/shared/MathDisplay';
import { addStyles } from 'react-mathquill';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import type { Question } from '@/types';
import { parseBlanks } from '@/utils/blanks';

// Ensure MathQuill styles are loaded
addStyles();

interface QuestionDisplayProps {
  question: Question;
  answers: Record<string, string>;
  onAnswerChange: (answerBoxId: string, answer: string) => void;
}

export function QuestionDisplay({ question, answers, onAnswerChange }: QuestionDisplayProps) {
  // Working area state for open-ended questions
  const WORKING_STEPS_KEY = `working-steps-${question.id}`;
  
  // Get working steps from answers or initialize empty
  const getWorkingSteps = (): string[] => {
    const stepsData = answers[WORKING_STEPS_KEY];
    if (stepsData) {
      try {
        const parsed = JSON.parse(stepsData);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const [workingSteps, setWorkingSteps] = useState<string[]>(getWorkingSteps());

  // Sync working steps with answers when answers change externally
  useEffect(() => {
    const steps = getWorkingSteps();
    if (JSON.stringify(steps) !== JSON.stringify(workingSteps)) {
      setWorkingSteps(steps);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers[WORKING_STEPS_KEY]]);

  const handleWorkingStepChange = (index: number, value: string) => {
    const newSteps = [...workingSteps];
    newSteps[index] = value;
    setWorkingSteps(newSteps);
    onAnswerChange(WORKING_STEPS_KEY, JSON.stringify(newSteps));
  };

  const handleAddStep = () => {
    const newSteps = [...workingSteps, ''];
    setWorkingSteps(newSteps);
    onAnswerChange(WORKING_STEPS_KEY, JSON.stringify(newSteps));
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = workingSteps.filter((_, i) => i !== index);
    setWorkingSteps(newSteps);
    onAnswerChange(WORKING_STEPS_KEY, JSON.stringify(newSteps));
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Add new step after current one
      const newSteps = [...workingSteps];
      newSteps.splice(index + 1, 0, '');
      setWorkingSteps(newSteps);
      onAnswerChange(WORKING_STEPS_KEY, JSON.stringify(newSteps));
    } else if (e.key === 'Backspace' && workingSteps[index] === '' && workingSteps.length > 1) {
      e.preventDefault();
      handleRemoveStep(index);
    }
  };

  // Render segmented elements for fill-in-the-blank questions
  const renderSegmentedElements = () => {
    if (!question.segmentedElements || question.segmentedElements.length === 0) {
      return null;
    }

    // Create a map of blank IDs to answer boxes
    const blankToAnswerBox = new Map<number, NonNullable<typeof question.answerBoxes>[0]>();
    if (question.answerBoxes) {
      question.answerBoxes.forEach(box => {
        const match = box.label.match(/Blank #(\d+)/);
        if (match) {
          const blankNum = parseInt(match[1], 10);
          blankToAnswerBox.set(blankNum, box);
        }
      });
    }

    return (
      <div className="flex flex-wrap items-center gap-1">
        {question.segmentedElements.map((element) => {
          if (element.type === 'math') {
            return (
              <MathDisplay key={element.id} latex={element.value} className="text-base inline" />
            );
          } else {
            // Find the corresponding answer box for this blank
            const answerBox = blankToAnswerBox.get(element.id);
            if (answerBox) {
              return (
                <span key={`blank-${element.id}`} className="inline-flex items-center">
                  <MathInput
                    value={answers[answerBox.id] || ''}
                    onChange={(value) => onAnswerChange(answerBox.id, value)}
                    placeholder="?"
                    className="blank-input inline-block w-[70px] min-w-[60px] max-w-[80px]"
                  />
                </span>
              );
            } else {
              // Fallback if no answer box found
              return (
                <div
                  key={`blank-${element.id}`}
                  className="blank-student inline-block min-w-[60px] max-w-[80px] w-[70px] h-[40px] border-2 border-dashed border-primary rounded bg-background"
                />
              );
            }
          }
        })}
      </div>
    );
  };

  const renderBlock = (block: typeof question.blocks[0]) => {
    if (block.type === 'newline') {
      return null;
    }
    if (block.type === 'math') {
      // For math blocks, check if there are blanks
      const parts = parseBlanks(block.content);
      if (parts.some(p => p.type === 'blank')) {
        // Has blanks - render with blank placeholders
        return (
          <span className="text-base">
            {parts.map((part, idx) => {
              if (part.type === 'blank') {
                return (
                  <span key={idx} className="inline-block mx-1 px-2 py-1 border-2 border-dashed border-primary rounded min-w-[40px] text-center font-semibold bg-muted/30">
                    [ ]
                  </span>
                );
              } else {
                return <MathDisplay key={idx} latex={part.content} className="text-base inline" />;
              }
            })}
          </span>
        );
      }
      // No blanks - render normally
      return <MathDisplay latex={block.content} className="text-base" />;
    } else {
      // For text blocks, check if there are blanks
      const parts = parseBlanks(block.content);
      if (parts.some(p => p.type === 'blank')) {
        // Has blanks - render with blank placeholders
        return (
          <span className="text-base">
            {parts.map((part, idx) => {
              if (part.type === 'blank') {
                return (
                  <span key={idx} className="inline-block mx-1 px-2 py-1 border-2 border-dashed border-primary rounded min-w-[40px] text-center font-semibold bg-muted/30">
                    [ ]
                  </span>
                );
              } else {
                return <span key={idx}>{part.content}</span>;
              }
            })}
          </span>
        );
      }
      // No blanks - render normally
      return <span className="text-base">{block.content}</span>;
    }
  };

  return (
    <div className="space-y-6 p-6 border border-border rounded-lg bg-card">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{question.instruction}</h3>
          {question.marks && (
            <span className="text-sm font-medium text-muted-foreground">
              [{question.marks} mark{question.marks !== 1 ? 's' : ''}]
            </span>
          )}
        </div>
        {question.questionType === 'fill-in-the-blank' && question.segmentedElements ? (
          <div className="space-y-3">
            {renderSegmentedElements()}
          </div>
        ) : (
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1.5">
            {question.blocks.map(block => (
              <div 
                key={block.id} 
                className={block.type === 'newline' ? "w-full h-0" : "inline-block"}
              >
                {renderBlock(block)}
              </div>
            ))}
          </div>
        )}
      </div>

      {(question.questionType === 'mcq' || (!question.questionType && question.mcqOptions)) && question.mcqOptions && (
        <div className="space-y-4 pt-4 border-t border-border">
          <h4 className="font-medium">Select your answer:</h4>
          <div className="space-y-3">
            {question.mcqOptions.map(option => (
              <label
                key={option.id}
                className="flex items-center gap-3 p-3 border border-border rounded-md cursor-pointer hover:bg-accent transition-colors"
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option.id}
                  checked={answers[question.id] === option.id}
                  onChange={() => onAnswerChange(question.id, option.id)}
                  className="h-4 w-4"
                />
                <div className="flex-1">
                  <MathDisplay latex={option.label} className="text-base" />
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Working Area - show for open-ended questions */}
      {question.questionType === 'open-ended' && (
        <div className="space-y-6 pt-4 border-t border-border">
          {/* Working Area */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-medium">Your Answer</h4>
                <p className="text-xs text-muted-foreground">
                  Type your solution below. Press Enter to add a new line.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddStep}
                className="h-8"
              >
                <Plus className="h-3 w-3 mr-1.5" />
                Add Line
              </Button>
            </div>
            
            <div className="space-y-3">
              {workingSteps.map((step, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1">
                    <div onKeyDown={(e) => handleKeyDown(e, index)}>
                      <MathInput
                        value={step}
                        onChange={(value) => handleWorkingStepChange(index, value)}
                        placeholder="Type math or text..."
                        className="w-full"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveStep(index)}
                    disabled={workingSteps.length <= 1}
                    className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
                    title="Remove line"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
