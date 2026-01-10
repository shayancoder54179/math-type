import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QuestionBlock } from './QuestionBlock';
import { AnswerBox } from './AnswerBox';
import { MCQOptionEditor } from './MCQOptionEditor';
import { QuestionDisplay } from '@/components/student/QuestionDisplay';
import { SegmentedMathEditor } from './SegmentedMathEditor';
import { Plus } from 'lucide-react';
import type { Question, QuestionBlock as QuestionBlockType, AnswerBox as AnswerBoxType, MCQOption, QuestionType, BlockType, SegmentedElement } from '@/types';
import { generateId } from '@/utils/storage';
import { findBlanks } from '@/utils/blanks';

interface QuestionBuilderProps {
  question?: Question;
  onSave: (question: Question) => void;
  onCancel?: () => void;
}

export function QuestionBuilder({ question, onSave, onCancel }: QuestionBuilderProps) {
  // Determine default question type based on existing data
  const getDefaultQuestionType = (): QuestionType => {
    if (question?.questionType) return question.questionType;
    if (question?.mcqOptions && question.mcqOptions.length > 0) return 'mcq';
    return 'open-ended';
  };

  const [instruction, setInstruction] = useState(question?.instruction || '');
  const [questionType, setQuestionType] = useState<QuestionType>(getDefaultQuestionType());
  const [blocks, setBlocks] = useState<QuestionBlockType[]>(question?.blocks || []);
  const [answerBoxes, setAnswerBoxes] = useState<AnswerBoxType[]>(question?.answerBoxes || []);
  const [mcqOptions, setMcqOptions] = useState<MCQOption[]>(question?.mcqOptions || []);
  const [marks, setMarks] = useState<number>(question?.marks || 1);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, string>>({});
  const getInitialSegmentedElements = (): SegmentedElement[] => {
    if (question?.segmentedElements && question.segmentedElements.length > 0) {
      return question.segmentedElements;
    }
    if (questionType === 'fill-in-the-blank') {
      return [{ type: 'math', value: '', id: generateId() }];
    }
    return [];
  };

  const [segmentedElements, setSegmentedElements] = useState<SegmentedElement[]>(getInitialSegmentedElements());

  // Initialize MCQ with 4 options when type is set to MCQ
  useEffect(() => {
    if (questionType === 'mcq' && mcqOptions.length === 0) {
      const defaultOptions: MCQOption[] = Array.from({ length: 4 }, (_, i) => ({
        id: generateId(),
        label: '',
        isCorrect: i === 0, // First option is correct by default
      }));
      setMcqOptions(defaultOptions);
    }
  }, [questionType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize segmented elements for fill-in-the-blank when question type changes
  useEffect(() => {
    if (questionType === 'fill-in-the-blank') {
      // Only initialize if we don't have elements yet
      if (segmentedElements.length === 0) {
        setSegmentedElements([{ type: 'math', value: '', id: generateId() }]);
      }
    }
  }, [questionType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Create answer boxes from segmented blanks
  const handleBlanksChange = (blankIds: number[]) => {
    if (questionType === 'fill-in-the-blank') {
      const newAnswerBoxes: AnswerBoxType[] = [];
      blankIds.forEach(blankId => {
        const existingIndex = answerBoxes.findIndex(box => box.label === `Blank #${blankId}`);
        if (existingIndex >= 0) {
          newAnswerBoxes.push(answerBoxes[existingIndex]);
        } else {
          newAnswerBoxes.push({
            id: generateId(),
            label: `Blank #${blankId}`,
            answer: '',
            labelIsMath: false,
          });
        }
      });
      setAnswerBoxes(newAnswerBoxes);
    }
  };

  const handleAddBlock = (type: BlockType) => {
    const newBlock: QuestionBlockType = {
      id: generateId(),
      type,
      content: '',
    };
    setBlocks([...blocks, newBlock]);
  };

  const handleBlockChange = (id: string, content: string) => {
    const updatedBlocks = blocks.map(block => 
      block.id === id ? { ...block, content } : block
    );
    setBlocks(updatedBlocks);
    
    // Auto-create answer boxes for blanks when in fill-in-the-blank mode
    if (questionType === 'fill-in-the-blank') {
      // Get all blank numbers and sort them
      const blankNumbers: number[] = [];
      updatedBlocks.forEach(block => {
        const blanks = findBlanks(block.content);
        blanks.forEach(blank => {
          if (!blankNumbers.includes(blank.number)) {
            blankNumbers.push(blank.number);
          }
        });
      });
      blankNumbers.sort((a, b) => a - b);
      
      if (blankNumbers.length > 0) {
        // Create answer boxes for each blank number
        const newAnswerBoxes: AnswerBoxType[] = [];
        blankNumbers.forEach((blankNum) => {
          const existingIndex = answerBoxes.findIndex(box => box.label === `Blank #${blankNum}`);
          if (existingIndex >= 0) {
            // Keep existing answer box
            newAnswerBoxes.push(answerBoxes[existingIndex]);
          } else {
            // Create new answer box
            newAnswerBoxes.push({
              id: generateId(),
              label: `Blank #${blankNum}`,
              answer: '',
              labelIsMath: false,
            });
          }
        });
        setAnswerBoxes(newAnswerBoxes);
      } else {
        // Remove all answer boxes if no blanks
        setAnswerBoxes([]);
      }
    } else if (questionType === 'open-ended') {
      // For open-ended, keep the old behavior (manual answer boxes)
      // No automatic blank detection
    }
  };

  const handleBlockDelete = (id: string) => {
    const updatedBlocks = blocks.filter(block => block.id !== id);
    setBlocks(updatedBlocks);
    
    // Recalculate answer boxes for blanks
    if (questionType === 'fill-in-the-blank') {
      // Get all blank numbers and sort them
      const blankNumbers: number[] = [];
      updatedBlocks.forEach(block => {
        const blanks = findBlanks(block.content);
        blanks.forEach(blank => {
          if (!blankNumbers.includes(blank.number)) {
            blankNumbers.push(blank.number);
          }
        });
      });
      blankNumbers.sort((a, b) => a - b);
      
      if (blankNumbers.length > 0) {
        // Keep only answer boxes for existing blanks
        const newAnswerBoxes = answerBoxes.filter(box => {
          const match = box.label.match(/Blank #(\d+)/);
          if (match) {
            const num = parseInt(match[1], 10);
            return blankNumbers.includes(num);
          }
          return false;
        });
        setAnswerBoxes(newAnswerBoxes);
      } else {
        setAnswerBoxes([]);
      }
    }
  };

  const handleAddAnswerBox = () => {
    const newAnswerBox: AnswerBoxType = {
      id: generateId(),
      label: '', // Empty by default for simple questions like "Expand"
      answer: '',
      labelIsMath: false,
    };
    setAnswerBoxes([...answerBoxes, newAnswerBox]);
  };

  const handleAnswerBoxChange = (id: string, label: string, answer: string, labelIsMath?: boolean) => {
    setAnswerBoxes(answerBoxes.map(box =>
      box.id === id ? { ...box, label, answer, labelIsMath } : box
    ));
  };

  const handleAnswerBoxDelete = (id: string) => {
    setAnswerBoxes(answerBoxes.filter(box => box.id !== id));
  };

  const handleAddMCQOption = () => {
    const newOption: MCQOption = {
      id: generateId(),
      label: '',
      isCorrect: false,
    };
    setMcqOptions([...mcqOptions, newOption]);
  };

  const handleMCQOptionChange = (id: string, label: string, isCorrect: boolean) => {
    // If setting this option as correct, unset all others
    const updatedOptions = mcqOptions.map(opt =>
      opt.id === id ? { ...opt, label, isCorrect } : { ...opt, isCorrect: isCorrect ? false : opt.isCorrect }
    );
    setMcqOptions(updatedOptions);
  };

  const handleMCQOptionDelete = (id: string) => {
    if (mcqOptions.length > 2) {
      setMcqOptions(mcqOptions.filter(opt => opt.id !== id));
    }
  };

  const handleSave = () => {
    const questionData: Question = {
      id: question?.id || generateId(),
      instruction,
      questionType,
      blocks: questionType === 'fill-in-the-blank' ? [] : blocks,
      ...((questionType === 'open-ended' || questionType === 'fill-in-the-blank') && { answerBoxes }),
      ...(questionType === 'mcq' && { mcqOptions }),
      ...(questionType === 'fill-in-the-blank' && { segmentedElements }),
      marks: marks > 0 ? marks : 1, // Ensure marks is at least 1
    };
    onSave(questionData);
  };

  // Create preview question object
  const previewQuestion: Question = {
    id: question?.id || 'preview',
    instruction: instruction || 'Instruction',
    questionType,
    marks: marks,
    blocks: questionType === 'fill-in-the-blank' ? [] : (blocks.length > 0 ? blocks : []),
    ...((questionType === 'open-ended' || questionType === 'fill-in-the-blank') && { answerBoxes: answerBoxes.length > 0 ? answerBoxes : undefined }),
    ...(questionType === 'mcq' && { mcqOptions: mcqOptions.length > 0 ? mcqOptions : undefined }),
    ...(questionType === 'fill-in-the-blank' && { segmentedElements }),
  };

  const handlePreviewAnswerChange = (answerBoxId: string, answer: string) => {
    setPreviewAnswers(prev => ({
      ...prev,
      [answerBoxId]: answer,
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left side: Builder */}
      <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Instruction</label>
        <Input
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="e.g., Expand"
          className="w-full"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Marks</label>
        <Input
          type="number"
          min="1"
          value={marks}
          onChange={(e) => setMarks(Math.max(1, parseInt(e.target.value) || 1))}
          placeholder="e.g., 5"
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">Total marks allocated for this question</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Question Type</label>
        <div className="flex gap-4 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="questionType"
              value="open-ended"
              checked={questionType === 'open-ended'}
              onChange={(e) => setQuestionType(e.target.value as QuestionType)}
              className="h-4 w-4"
            />
            <span className="text-sm">Open-ended</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="questionType"
              value="fill-in-the-blank"
              checked={questionType === 'fill-in-the-blank'}
              onChange={(e) => setQuestionType(e.target.value as QuestionType)}
              className="h-4 w-4"
            />
            <span className="text-sm">Fill in the Blank</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="questionType"
              value="mcq"
              checked={questionType === 'mcq'}
              onChange={(e) => setQuestionType(e.target.value as QuestionType)}
              className="h-4 w-4"
            />
            <span className="text-sm">Multiple Choice</span>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Question Content</h3>
        {questionType === 'fill-in-the-blank' ? (
          <div className="p-4 border border-border rounded-md bg-card">
            <SegmentedMathEditor
              elements={segmentedElements}
              onChange={setSegmentedElements}
              onBlanksChange={handleBlanksChange}
            />
          </div>
        ) : (
          <div className="min-h-[150px] border border-input rounded-md bg-background p-4 flex flex-wrap items-center gap-x-2 gap-y-1.5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all">
            {blocks.length === 0 && (
              <div className="text-muted-foreground text-sm italic p-2 text-center opacity-50">
                Start typing your question...
              </div>
            )}
            
            {blocks.map(block => (
              <div 
                key={block.id} 
                className={block.type === 'newline' ? "w-full flex items-center gap-2 py-2" : "inline-block"}
              >
                <QuestionBlock
                  block={block}
                  onChange={handleBlockChange}
                  onDelete={handleBlockDelete}
                  allBlocks={blocks}
                  questionType={questionType}
                />
              </div>
            ))}
            
            <div className="flex items-center gap-2 pt-2 mt-2 border-t border-dashed w-full">
               <Button variant="ghost" size="sm" onClick={() => handleAddBlock('text')} className="h-7 text-xs text-muted-foreground hover:text-foreground">
                 + Add Text
               </Button>
               <Button variant="ghost" size="sm" onClick={() => handleAddBlock('math')} className="h-7 text-xs text-muted-foreground hover:text-foreground">
                 + Add Math
               </Button>
               <Button variant="ghost" size="sm" onClick={() => handleAddBlock('newline')} className="h-7 text-xs text-muted-foreground hover:text-foreground">
                 + Add New Line
               </Button>
            </div>
          </div>
        )}
      </div>

      {(questionType === 'open-ended' || questionType === 'fill-in-the-blank') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Answer Boxes</h3>
            {questionType === 'open-ended' && (
              <Button onClick={handleAddAnswerBox} variant="outline" size="sm" className="h-8">
                <Plus className="h-3 w-3 mr-1.5" />
                <span className="text-xs">Add</span>
              </Button>
            )}
          </div>
          {questionType === 'fill-in-the-blank' && segmentedElements.filter(el => el.type === 'blank').length === 0 && (
            <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
              💡 Tip: Click "Insert Blank" button in the editor to add blanks. Answer boxes will be created automatically.
            </p>
          )}
          {questionType === 'fill-in-the-blank' && segmentedElements.filter(el => el.type === 'blank').length > 0 && (
            <p className="text-xs text-muted-foreground">
              Answer boxes created automatically for each blank
            </p>
          )}
          <div className="space-y-2">
            {answerBoxes
              .slice()
              .sort((a, b) => {
                // Sort by blank number if they're blank answers
                const aMatch = a.label.match(/Blank #(\d+)/);
                const bMatch = b.label.match(/Blank #(\d+)/);
                if (aMatch && bMatch) {
                  return parseInt(aMatch[1], 10) - parseInt(bMatch[1], 10);
                }
                return 0;
              })
              .map((box) => {
                const isFromBlank = questionType === 'fill-in-the-blank' && box.label.startsWith('Blank #');
                return (
                  <AnswerBox
                    key={box.id}
                    answerBox={box}
                    onChange={handleAnswerBoxChange}
                    onDelete={isFromBlank ? undefined : handleAnswerBoxDelete}
                  />
                );
              })}
          </div>
        </div>
      )}


      {questionType === 'mcq' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Multiple Choice Options</h3>
            <Button onClick={handleAddMCQOption} variant="outline" size="sm" className="h-8">
              <Plus className="h-3 w-3 mr-1.5" />
              <span className="text-xs">Add Option</span>
            </Button>
          </div>
          <div className="space-y-2">
            {mcqOptions.map(option => (
              <MCQOptionEditor
                key={option.id}
                option={option}
                radioGroupName={`mcq-${question?.id || 'new'}`}
                onChange={handleMCQOptionChange}
                onDelete={handleMCQOptionDelete}
              />
            ))}
            {mcqOptions.length < 2 && (
              <div className="text-center text-muted-foreground text-xs py-3 border border-dashed rounded-md">
                Add at least 2 options
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-end pt-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSave}>
          Save Question
        </Button>
      </div>
      </div>

      {/* Right side: Preview */}
      <div className="lg:sticky lg:top-4 h-fit">
        <div className="space-y-2 mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Preview</h3>
          <p className="text-xs text-muted-foreground">How students will see this question</p>
        </div>
        {instruction || blocks.length > 0 || answerBoxes.length > 0 || mcqOptions.length > 0 ? (
          <QuestionDisplay
            question={previewQuestion}
            answers={previewAnswers}
            onAnswerChange={handlePreviewAnswerChange}
          />
        ) : (
          <div className="border border-dashed border-border rounded-lg p-8 text-center text-muted-foreground text-sm">
            Start building your question to see the preview
          </div>
        )}
      </div>
    </div>
  );
}
