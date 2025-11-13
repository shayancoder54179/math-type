import { useState, useEffect } from 'react';
import { MathInput } from '@/components/shared/MathInput';
import { MathDisplay } from '@/components/shared/MathDisplay';
import { StaticMathField, addStyles } from 'react-mathquill';
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
  const FINAL_ANSWER_KEY = `final-answer-${question.id}`;
  
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

  const handleFinalAnswerChange = (value: string) => {
    onAnswerChange(FINAL_ANSWER_KEY, value);
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
        {question.segmentedElements.map((element, index) => {
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
          <div className="space-y-3">
            {question.blocks.map(block => (
              <div key={block.id}>{renderBlock(block)}</div>
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

      {/* Working Area and Final Answer - show for open-ended questions */}
      {question.questionType === 'open-ended' && (
        <div className="space-y-6 pt-4 border-t border-border">
          {/* Working Area */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-medium">Working Area</h4>
                <p className="text-xs text-muted-foreground">
                  Use the working area to show your steps.
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
                Add Step
              </Button>
            </div>
            
            {workingSteps.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-md text-center">
                Click "Add Step" to show your working
              </div>
            ) : (
              <div className="space-y-3">
                {workingSteps.map((step, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex items-center gap-2 min-w-[60px]">
                      <span className="text-sm font-medium text-muted-foreground">
                        Step {index + 1}:
                      </span>
                    </div>
                    <div className="flex-1">
                      <MathInput
                        value={step}
                        onChange={(value) => handleWorkingStepChange(index, value)}
                        placeholder={`Enter step ${index + 1}...`}
                        className="w-full"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveStep(index)}
                      className="h-8 w-8 flex-shrink-0"
                      title="Remove step"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Final Answer */}
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">Final Answer</h4>
              <span className="text-xs text-muted-foreground">(Required)</span>
            </div>
            
            {question.answerBoxes && question.answerBoxes.length > 0 ? (
              // Show final answer inputs with labels from answerBoxes
              <div className="space-y-3">
                {question.answerBoxes.map((answerBox) => {
                  const finalAnswerKey = `${FINAL_ANSWER_KEY}-${answerBox.id}`;
                  
                  // Determine the label LaTeX to display
                  let labelLatex = answerBox.label.trim();
                  if (!labelLatex.endsWith('=')) {
                    labelLatex += ' =';
                  }
                  
                  // Convert simple variable names to LaTeX if needed
                  // If it's not already LaTeX (contains backslashes), treat as plain text variable
                  if (!labelLatex.includes('\\') && !answerBox.labelIsMath) {
                    // Keep as is - StaticMathField can handle simple text like "x ="
                    // But we might want to ensure proper spacing
                    labelLatex = labelLatex.replace(/\s*=\s*/, ' = ');
                  }
                  
                  return (
                    <div key={answerBox.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium flex items-center">
                          <StaticMathField>{labelLatex}</StaticMathField>
                        </span>
                        <div className="w-[125px]">
                          <MathInput
                            value={answers[finalAnswerKey] || ''}
                            onChange={(value) => onAnswerChange(finalAnswerKey, value)}
                            placeholder="Enter value..."
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {question.answerBoxes.every(box => !answers[`${FINAL_ANSWER_KEY}-${box.id}`]) && (
                  <p className="text-xs text-muted-foreground">
                    Please provide a final answer before submitting.
                  </p>
                )}
              </div>
            ) : (
              // Fallback: single final answer input without label
              <div className="space-y-2">
                <div className="w-[125px]">
                  <MathInput
                    value={answers[FINAL_ANSWER_KEY] || ''}
                    onChange={handleFinalAnswerChange}
                    placeholder="Enter your final answer..."
                    className="w-full"
                  />
                </div>
                {!answers[FINAL_ANSWER_KEY] && (
                  <p className="text-xs text-muted-foreground">
                    Please provide a final answer before submitting.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
