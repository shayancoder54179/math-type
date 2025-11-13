import { MathDisplay } from '@/components/shared/MathDisplay';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import type { QuizEvaluation, Quiz, Question } from '@/types';
import { parseBlanks } from '@/utils/blanks';
import { compareMathExpressions } from '@/utils/evaluation';

interface QuizResultsProps {
  quiz: Quiz;
  evaluation: QuizEvaluation;
}

export function QuizResults({ quiz, evaluation }: QuizResultsProps) {
  const { results, totalScore, maxScore, totalMarksAwarded, totalMaxMarks, percentage } = evaluation;

  // Render question blocks (for open-ended and MCQ)
  const renderQuestionBlocks = (question: Question) => {
    return (
      <div className="space-y-2">
        {question.blocks.map(block => {
          if (block.type === 'math') {
            // Check if there are blanks in the math content
            const parts = parseBlanks(block.content);
            if (parts.some(p => p.type === 'blank')) {
              return (
                <span key={block.id} className="text-base">
                  {parts.map((part, idx) => {
                    if (part.type === 'blank') {
                      return (
                        <span key={idx} className="inline-block mx-1 px-2 py-1 border-2 border-dashed border-primary rounded min-w-[40px] text-center font-semibold bg-muted/30">
                          &nbsp;
                        </span>
                      );
                    } else {
                      return <MathDisplay key={idx} latex={part.content} className="text-base inline" />;
                    }
                  })}
                </span>
              );
            }
            return <MathDisplay key={block.id} latex={block.content} className="text-base" />;
          } else {
            // Text block with potential blanks
            const parts = parseBlanks(block.content);
            if (parts.some(p => p.type === 'blank')) {
              return (
                <span key={block.id} className="text-base">
                  {parts.map((part, idx) => {
                    if (part.type === 'blank') {
                      return (
                        <span key={idx} className="inline-block mx-1 px-2 py-1 border-2 border-dashed border-primary rounded min-w-[40px] text-center font-semibold bg-muted/30">
                          &nbsp;
                        </span>
                      );
                    } else {
                      return <span key={idx}>{part.content}</span>;
                    }
                  })}
                </span>
              );
            }
            return <span key={block.id} className="text-base">{block.content}</span>;
          }
        })}
      </div>
    );
  };

  // Render fill-in-the-blank question with segmented elements
  const renderFillInTheBlankQuestion = (question: Question) => {
    if (!question.segmentedElements || question.segmentedElements.length === 0) {
      return renderQuestionBlocks(question);
    }

    return (
      <div className="flex flex-wrap items-center gap-1 text-base">
        {question.segmentedElements.map((element, index) => {
          if (element.type === 'math') {
            return (
              <MathDisplay key={element.id} latex={element.value} className="text-base inline" />
            );
          } else {
            // Render blank placeholder
            return (
              <span
                key={`blank-${element.id}`}
                className="inline-block mx-1 px-2 py-1 border-2 border-dashed border-primary rounded min-w-[40px] text-center font-semibold bg-muted/30"
              >
                &nbsp;
              </span>
            );
          }
        })}
      </div>
    );
  };

  // Render MCQ options
  const renderMCQOptions = (question: Question) => {
    if (!question.mcqOptions || question.mcqOptions.length === 0) {
      return null;
    }

    return (
      <div className="space-y-2 mt-2">
        {question.mcqOptions.map((option, idx) => (
          <div
            key={option.id}
            className={`flex items-center gap-2 p-2 rounded border ${
              option.isCorrect ? 'border-green-500 bg-green-50/10' : 'border-border'
            }`}
          >
            <span className="text-sm font-medium">{String.fromCharCode(65 + idx)}.</span>
            <MathDisplay latex={option.label} className="text-sm" />
            {option.isCorrect && (
              <span className="text-xs text-green-600 font-medium ml-auto">(Correct)</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render the full question based on type
  const renderQuestionContent = (question: Question) => {
    if (question.questionType === 'fill-in-the-blank') {
      return renderFillInTheBlankQuestion(question);
    } else if (question.questionType === 'mcq' || question.mcqOptions) {
      return (
        <div>
          {renderQuestionBlocks(question)}
          {renderMCQOptions(question)}
        </div>
      );
    } else {
      // Open-ended
      return renderQuestionBlocks(question);
    }
  };

  // Helper function to compare answers for fill-in-the-blank
  const compareAnswers = (student: string, correct: string): boolean => {
    if (!student || !correct) return false;
    // Use the same math comparison logic as evaluation
    return compareMathExpressions(student, correct);
  };

  // Normalize math expression by adding spaces around operators and keywords
  const normalizeMathSpacing = (math: string): string => {
    if (!math) return math;
    
    // Add spaces around common math operators and keywords
    let normalized = math;
    
    // Add spaces around "or" and "and" when they appear between math expressions
    normalized = normalized.replace(/([0-9a-zA-Z\)\]\}])or([0-9a-zA-Z\(\[\{])/gi, '$1 or $2');
    normalized = normalized.replace(/([0-9a-zA-Z\)\]\}])and([0-9a-zA-Z\(\[\{])/gi, '$1 and $2');
    
    // Add spaces around equals signs if missing
    normalized = normalized.replace(/([0-9a-zA-Z\)\]\}])=([0-9a-zA-Z\(\[\{])/g, '$1 = $2');
    
    // Add spaces around operators if they're missing spaces
    normalized = normalized.replace(/([0-9a-zA-Z\)\]\}])\+([0-9a-zA-Z\(\[\{])/g, '$1 + $2');
    normalized = normalized.replace(/([0-9a-zA-Z\)\]\}])-([0-9a-zA-Z\(\[\{])/g, '$1 - $2');
    normalized = normalized.replace(/([0-9a-zA-Z\)\]\}])\*([0-9a-zA-Z\(\[\{])/g, '$1 * $2');
    normalized = normalized.replace(/([0-9a-zA-Z\)\]\}])\/([0-9a-zA-Z\(\[\{])/g, '$1 / $2');
    
    // Clean up multiple spaces
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    return normalized;
  };

  // Parse step string to separate text and math parts
  const parseStepContent = (step: string): Array<{ type: 'text' | 'math'; content: string }> => {
    if (!step) return [];
    
    // Check if the step contains LaTeX (has backslashes) or math symbols
    const hasMath = /[\\^_{}]|[\+\-\*\/=<>]|\([^)]*\)/.test(step);
    
    // If no math detected, return as text
    if (!hasMath) {
      return [{ type: 'text', content: step }];
    }
    
    // Try to split on common patterns: "Text: math" or "Text math"
    // Look for colon followed by math, or math expressions
    const colonMatch = step.match(/^([^:]+):\s*(.+)$/);
    if (colonMatch) {
      const textPart = colonMatch[1].trim();
      let mathPart = colonMatch[2].trim();
      
      // Normalize spacing in math part first
      mathPart = normalizeMathSpacing(mathPart);
      
      const parts: Array<{ type: 'text' | 'math'; content: string }> = [];
      
      if (textPart) {
        parts.push({ type: 'text', content: textPart });
      }
      
      // Split math part on "or" and "and" keywords
      if (mathPart) {
        // Use regex to find "or" and "and" with their positions
        const separatorRegex = /\s+(or|and)\s+/gi;
        const matches = [...mathPart.matchAll(separatorRegex)];
        
        if (matches.length > 0) {
          // We have separators - split and include them
          let lastIndex = 0;
          
          for (const match of matches) {
            // Add math before separator
            if (match.index! > lastIndex) {
              const mathBefore = mathPart.substring(lastIndex, match.index!).trim();
              if (mathBefore) {
                parts.push({ type: 'math', content: mathBefore });
              }
            }
            
            // Add separator as text
            parts.push({ type: 'text', content: match[1].toLowerCase() });
            
            lastIndex = match.index! + match[0].length;
          }
          
          // Add remaining math after last separator
          if (lastIndex < mathPart.length) {
            const mathAfter = mathPart.substring(lastIndex).trim();
            if (mathAfter) {
              parts.push({ type: 'math', content: mathAfter });
            }
          }
        } else {
          // No separators, just add as math
          parts.push({ type: 'math', content: mathPart });
        }
      }
      
      return parts;
    }
    
    // If it looks like pure math (starts with math symbols or contains LaTeX), treat as math
    if (/^[\\\^_\(]|[\+\-\*\/=<>]/.test(step.trim()) || step.includes('\\')) {
      const normalized = normalizeMathSpacing(step);
      // Check if it has "or" or "and" to split
      const separatorRegex = /\s+(or|and)\s+/gi;
      const matches = [...normalized.matchAll(separatorRegex)];
      
      if (matches.length > 0) {
        const parts: Array<{ type: 'text' | 'math'; content: string }> = [];
        let lastIndex = 0;
        
        for (const match of matches) {
          // Add math before separator
          if (match.index! > lastIndex) {
            const mathBefore = normalized.substring(lastIndex, match.index!).trim();
            if (mathBefore) {
              parts.push({ type: 'math', content: mathBefore });
            }
          }
          
          // Add separator as text
          parts.push({ type: 'text', content: match[1].toLowerCase() });
          
          lastIndex = match.index! + match[0].length;
        }
        
        // Add remaining math after last separator
        if (lastIndex < normalized.length) {
          const mathAfter = normalized.substring(lastIndex).trim();
          if (mathAfter) {
            parts.push({ type: 'math', content: mathAfter });
          }
        }
        
        return parts;
      }
      
      return [{ type: 'math', content: normalized }];
    }
    
    // Default: treat as text
    return [{ type: 'text', content: step }];
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Overall Score */}
      <div className="border border-border rounded-lg p-6 bg-card">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold">Quiz Results</h2>
          <div className="flex items-center justify-center gap-6">
            <div className="text-4xl font-bold">
              {totalMarksAwarded} / {totalMaxMarks}
            </div>
            <div className="text-2xl text-muted-foreground">
              ({percentage}%)
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Questions: {totalScore} / {maxScore} correct
          </div>
          <div className={`text-lg font-semibold ${
            percentage >= 70 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {percentage >= 70 ? 'Excellent!' : percentage >= 50 ? 'Good effort!' : 'Keep practicing!'}
          </div>
        </div>
      </div>

      {/* Per-Question Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Question Breakdown</h3>
        {results.map((result, index) => {
          const question = quiz.questions.find(q => q.id === result.questionId);
          if (!question) return null;

          return (
            <div
              key={result.questionId}
              className={`border rounded-lg p-6 ${
                result.isCorrect ? 'border-green-500 bg-green-50/10' : 'border-red-500 bg-red-50/10'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {result.isCorrect ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  {/* Question Status */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">Question {index + 1}</span>
                      <span className={`text-sm font-medium ${
                        result.isCorrect ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {result.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                      <span className="text-sm text-muted-foreground ml-auto">
                        Marks: {result.marksAwarded} / {result.maxMarks}
                      </span>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="text-xs font-medium text-muted-foreground mb-2">Question:</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {question.instruction}
                    </div>
                    <div className="p-3 bg-muted/30 rounded border border-border">
                      {renderQuestionContent(question)}
                    </div>
                  </div>

                  {/* Final Answer Comparison */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="font-medium text-sm">Final Answer:</div>
                    {question.questionType === 'fill-in-the-blank' && Array.isArray(result.studentAnswer) && Array.isArray(result.correctAnswer) ? (
                      // Fill-in-the-blank: show per-blank mapping
                      <div className="space-y-2">
                        {result.studentAnswer.map((studentAns, i) => {
                          const blankNum = i + 1;
                          const isCorrect = compareAnswers(studentAns, result.correctAnswer[i]);
                          return (
                            <div
                              key={i}
                              className={`p-2 rounded border ${
                                isCorrect ? 'border-green-500 bg-green-50/10' : 'border-red-500 bg-red-50/10'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <span className="text-xs font-medium min-w-[60px]">Blank {blankNum}:</span>
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-1">Your Answer:</div>
                                    {studentAns ? (
                                      <MathDisplay latex={studentAns} className="text-sm" />
                                    ) : (
                                      <span className="text-sm text-muted-foreground italic">(no answer)</span>
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-1">Correct Answer:</div>
                                    <MathDisplay latex={result.correctAnswer[i]} className="text-sm" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (question.questionType === 'mcq' || question.mcqOptions) ? (
                      // MCQ: show option labels instead of IDs
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Your Answer:</div>
                          <div className="p-2 bg-muted rounded">
                            {(() => {
                              const selectedOption = question.mcqOptions?.find(opt => opt.id === result.studentAnswer);
                              if (selectedOption) {
                                const optionIndex = question.mcqOptions.indexOf(selectedOption);
                                const optionLetter = String.fromCharCode(65 + optionIndex);
                                return (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{optionLetter}.</span>
                                    <MathDisplay latex={selectedOption.label} className="text-sm" />
                                  </div>
                                );
                              }
                              return <span className="text-sm text-muted-foreground">(no answer)</span>;
                            })()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Correct Answer:</div>
                          <div className="p-2 bg-muted rounded">
                            {(() => {
                              const correctOption = question.mcqOptions?.find(opt => opt.id === result.correctAnswer);
                              if (correctOption) {
                                const optionIndex = question.mcqOptions.indexOf(correctOption);
                                const optionLetter = String.fromCharCode(65 + optionIndex);
                                return (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{optionLetter}.</span>
                                    <MathDisplay latex={correctOption.label} className="text-sm" />
                                  </div>
                                );
                              }
                              return <span className="text-sm text-muted-foreground">(no answer)</span>;
                            })()}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Other question types (open-ended): side-by-side comparison
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Your Answer:</div>
                          <div className="p-2 bg-muted rounded">
                            {Array.isArray(result.studentAnswer) ? (
                              result.studentAnswer.map((ans, i) => (
                                <div key={i} className="mb-1">
                                  <MathDisplay latex={ans || '(no answer)'} className="text-sm" />
                                </div>
                              ))
                            ) : (
                              <MathDisplay latex={result.studentAnswer || '(no answer)'} className="text-sm" />
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Correct Answer:</div>
                          <div className="p-2 bg-muted rounded">
                            {Array.isArray(result.correctAnswer) ? (
                              result.correctAnswer.map((ans, i) => (
                                <div key={i} className="mb-1">
                                  <MathDisplay latex={ans} className="text-sm" />
                                </div>
                              ))
                            ) : (
                              <MathDisplay latex={result.correctAnswer} className="text-sm" />
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Working Steps Evaluation */}
                  {result.workingSteps && result.workingSteps.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <div className="font-medium text-sm">Your Working Steps:</div>
                      <div className="space-y-2">
                        {result.workingSteps.map((step, stepIndex) => (
                          <div
                            key={stepIndex}
                            className={`p-3 rounded border ${
                              step.isCorrect
                                ? 'border-green-500 bg-green-50/10'
                                : 'border-red-500 bg-red-50/10'
                            }`}
                          >
                            <div className="flex items-start gap-2 mb-1">
                              {step.isCorrect ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <div className="text-xs font-medium mb-1">
                                  Step {step.stepIndex + 1}:
                                </div>
                                <div className="mb-1">
                                  <MathDisplay latex={step.stepContent} className="text-sm" />
                                </div>
                                {step.feedback && (
                                  <div className={`text-xs ${
                                    step.isCorrect ? 'text-green-700' : 'text-red-700'
                                  }`}>
                                    {step.feedback}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Correct Solution Steps */}
                  {result.correctSolutionSteps && result.correctSolutionSteps.length > 0 && !result.finalAnswerCorrect && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <div className="font-medium text-sm text-blue-600">Correct Solution:</div>
                      <div className="space-y-2">
                        {result.correctSolutionSteps.map((step, stepIndex) => {
                          const stepParts = parseStepContent(step);
                          return (
                            <div
                              key={stepIndex}
                              className="p-3 rounded border border-blue-500 bg-blue-50/10"
                            >
                              <div className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                  <div className="text-xs font-medium mb-1">
                                    Step {stepIndex + 1}:
                                  </div>
                                  {/* Group parts: if we have math-text-math pattern, show horizontally */}
                                  {(() => {
                                    // Check if we have a pattern like: text, math, text (or/and), math
                                    const hasConnectorPattern = stepParts.length >= 3 && 
                                      stepParts.some((p, i) => i > 0 && i < stepParts.length - 1 && p.type === 'text' && /^(or|and)$/i.test(p.content));
                                    
                                    if (hasConnectorPattern) {
                                      // Group into sections: description text, then horizontal math+connector+math
                                      const descriptionParts = stepParts.filter((p, i) => {
                                        // Get all text parts that are NOT "or"/"and"
                                        return p.type === 'text' && !/^(or|and)$/i.test(p.content);
                                      });
                                      
                                      const mathConnectorParts = stepParts.filter((p) => {
                                        // Get math parts and "or"/"and" connectors
                                        return p.type === 'math' || /^(or|and)$/i.test(p.content);
                                      });
                                      
                                      return (
                                        <>
                                          {/* Description text boxes */}
                                          {descriptionParts.map((part, idx) => (
                                            <div key={`desc-${idx}`}>
                                              <div className="text-sm text-foreground font-medium p-2 bg-blue-100/30 rounded border border-blue-300/50">
                                                {part.content}
                                              </div>
                                            </div>
                                          ))}
                                          
                                          {/* Math + connector boxes in one line */}
                                          {mathConnectorParts.length > 0 && (
                                            <div className="flex items-center gap-2 flex-wrap">
                                              {mathConnectorParts.map((part, idx) => (
                                                <div key={`math-conn-${idx}`}>
                                                  {part.type === 'math' ? (
                                                    <div className="p-2 bg-muted/50 rounded border border-border">
                                                      <MathDisplay latex={part.content} className="text-sm" />
                                                    </div>
                                                  ) : (
                                                    <div className="text-sm text-foreground font-medium p-2 bg-blue-100/30 rounded border border-blue-300/50">
                                                      {part.content}
                                                    </div>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </>
                                      );
                                    } else {
                                      // Default: show vertically
                                      return stepParts.map((part, partIndex) => (
                                        <div key={partIndex} className={part.type === 'text' ? '' : 'mt-2'}>
                                          {part.type === 'text' ? (
                                            <div className="text-sm text-foreground font-medium p-2 bg-blue-100/30 rounded border border-blue-300/50">
                                              {part.content}
                                            </div>
                                          ) : (
                                            <div className="p-2 bg-muted/50 rounded border border-border">
                                              <MathDisplay latex={part.content} className="text-sm" />
                                            </div>
                                          )}
                                        </div>
                                      ));
                                    }
                                  })()}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* General Feedback */}
                  {result.feedback && (
                    <div className={`text-sm pt-2 border-t border-border ${
                      result.isCorrect ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {result.feedback}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

