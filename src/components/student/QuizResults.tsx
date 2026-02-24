import { MathDisplay } from '@/components/shared/MathDisplay';
import { CheckCircle2, XCircle, Lightbulb, AlertCircle } from 'lucide-react';
import type { QuizEvaluation, Quiz, Question } from '@/types';

import { parseBlanks } from '@/utils/blanks';
import { compareMathExpressions } from '@/utils/evaluation';

interface QuizResultsProps {
  quiz: Quiz;
  evaluation: QuizEvaluation;
}

export function QuizResults({ quiz, evaluation }: QuizResultsProps) {
  const { results, totalScore, maxScore, totalMarksAwarded, totalMaxMarks, percentage } = evaluation;

  // Parse step string to separate text and math parts
  const parseStepContent = (step: string): Array<{ type: 'text' | 'math'; content: string }> => {
    if (!step) return [];

    // Remove (M1), (A1), (M1 A1) etc from the display text
    const cleanStep = step.replace(/\s*\([MA]\d+(?:\s+[MA]\d+)*\)/g, '');
    
    // 1. If it has $ delimiters, use them (this is the preferred format)
    if (cleanStep.includes('$')) {
      const parts: Array<{ type: 'text' | 'math'; content: string }> = [];
      const splitContent = cleanStep.split('$');
      splitContent.forEach((part, index) => {
        if (index % 2 === 1) {
          // Odd indices are math
          if (part) parts.push({ type: 'math', content: part });
        } else {
          // Even indices are text
          if (part) parts.push({ type: 'text', content: part });
        }
      });
      return parts;
    }

    // 2. If it has a colon but no $, treat everything after the colon as math
    const colonMatch = cleanStep.match(/^([^:]+):\s*(.+)$/);
    if (colonMatch) {
      return [
        { type: 'text', content: colonMatch[1].trim() + ': ' },
        { type: 'math', content: colonMatch[2].trim() }
      ];
    }

    // 3. Heuristic for pure math or mixed content without delimiters
    // Check if the step contains common math operators or LaTeX-like syntax
    const hasMathOperators = /[\\^_{}]|[+\-*/=<>]|\([^)]*\)/.test(cleanStep);
    
    // If it's mostly math or has no letters, treat as math
    const hasLetters = /[a-zA-Z]/.test(cleanStep);
    
    if (hasMathOperators && (!hasLetters || cleanStep.length < 10)) {
       // Normalize math (handle 'or'/'and')
       const normalizedMath = cleanStep
         .replace(/([0-9a-zA-Z)\]}])(or|and)([0-9a-zA-Z([{])/gi, '$1 \\quad \\text{$2} \\quad $3')
         .replace(/\s+(or|and)\s+/gi, ' \\quad \\text{$1} \\quad ');
         
       return [{ type: 'math', content: normalizedMath }];
    }
    
    // Default to text
    return [{ type: 'text', content: cleanStep }];
  };

  const renderStepParts = (parts: Array<{ type: 'text' | 'math'; content: string }>) => (
    <div className="flex-1 block leading-relaxed">
      {parts.map((part, pIdx) => (
        part.type === 'text' ? (
          <span key={pIdx} className="text-foreground/90 font-medium whitespace-pre-wrap">{part.content}</span>
        ) : (
          <MathDisplay key={pIdx} latex={part.content} className="inline-block align-baseline" />
        )
      ))}
    </div>
  );

  const renderOpenEndedResult = (_question: Question, result: any) => {
    // Check if we have AI feedback (new structure) or fallback to old structure
    const aiFeedback = result.aiFeedback;
    const studentAnswer = Array.isArray(result.studentAnswer) ? result.studentAnswer : [result.studentAnswer];

    return (
      <div className="space-y-6">
        {/* User's Answer Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Your Answer</h4>
          <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-2">
            {studentAnswer && studentAnswer.length > 0 ? (
              studentAnswer.map((step: string, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-1 overflow-x-auto">
                    <MathDisplay latex={step || ''} className="text-foreground" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground italic">No answer provided</p>
            )}
          </div>
        </div>

        {/* AI Evaluation Section */}
        {aiFeedback ? (
          <div className="space-y-6">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              AI Feedback
            </h3>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Model Answer */}
              <div className="md:col-span-2 space-y-3">
                <h4 className="font-medium flex items-center gap-2 text-primary">
                  Model Answer
                </h4>
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 space-y-3">
                  {aiFeedback.modelAnswer.map((step: string, idx: number) => (
                    <div key={idx} className="flex gap-3 items-start">
                      <span className="text-primary/60 font-mono text-sm shrink-0 mt-1">{idx + 1}.</span>
                      {renderStepParts(parseStepContent(step))}
                    </div>
                  ))}
                </div>
              </div>

              {/* What you got correct */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  What you got correct
                </h4>
                <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border border-green-200 dark:border-green-900 space-y-2">
                  {aiFeedback.correctPoints.length > 0 ? (
                    <div className="space-y-3">
                      {aiFeedback.correctPoints.map((point: string, idx: number) => (
                        <div key={idx} className="flex gap-3 items-start">
                          <span className="text-green-600/60 shrink-0 mt-1">•</span>
                          {renderStepParts(parseStepContent(point))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No specific correct points identified.</p>
                  )}
                </div>
              </div>

              {/* How to improve */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                  <AlertCircle className="h-4 w-4" />
                  How to improve
                </h4>
                <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-4 border border-yellow-200 dark:border-yellow-900 space-y-2">
                  {aiFeedback.improvementPoints.length > 0 ? (
                    <div className="space-y-3">
                      {aiFeedback.improvementPoints.map((point: string, idx: number) => (
                        <div key={idx} className="flex gap-3 items-start">
                          <span className="text-yellow-600/60 shrink-0 mt-1">•</span>
                          {renderStepParts(parseStepContent(point))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No specific improvements suggested.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Fallback for old evaluation style or if AI fails */
          <div className="space-y-3">
             <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 p-3 rounded-md">
               <AlertCircle className="h-5 w-5" />
               <p className="text-sm">Detailed AI feedback is unavailable for this response.</p>
             </div>
             {result.correctSolutionSteps && (
                <div className="space-y-2">
                  <h4 className="font-medium text-muted-foreground">Correct Solution:</h4>
                  <div className="bg-muted p-4 rounded-md space-y-2">
                    {result.correctSolutionSteps.map((step: string, idx: number) => (
                      <div key={idx}><MathDisplay latex={step} /></div>
                    ))}
                  </div>
                </div>
             )}
          </div>
        )}
      </div>
    );
  };

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
        {question.segmentedElements.map((element) => {
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
                result.status === 'correct' 
                  ? 'border-green-500 bg-green-50/10' 
                  : result.status === 'partially_correct'
                    ? 'border-yellow-500 bg-yellow-50/10'
                    : 'border-red-500 bg-red-50/10'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {result.status === 'correct' ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : result.status === 'partially_correct' ? (
                    <AlertCircle className="h-6 w-6 text-yellow-600" />
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
                        result.status === 'correct' 
                          ? 'text-green-600' 
                          : result.status === 'partially_correct'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}>
                        {result.status === 'correct' 
                          ? 'Correct' 
                          : result.status === 'partially_correct'
                            ? 'Partially Correct'
                            : 'Incorrect'}
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

                  {/* Open-Ended Specific Result View */}
                  {question.questionType === 'open-ended' ? (
                    renderOpenEndedResult(question, result)
                  ) : (
                    /* Existing Logic for MCQ and Fill-in-the-blank */
                    <>
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
                                    const optionIndex = question.mcqOptions!.indexOf(selectedOption);
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
                                    const optionIndex = question.mcqOptions!.indexOf(correctOption);
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
                          // Other question types: side-by-side comparison
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
                    </>
                  )}

                  {/* General Feedback */}
                  {result.feedback && (
                    <div className={`text-sm pt-2 border-t border-border ${
                      result.status === 'correct' 
                        ? 'text-green-700' 
                        : result.status === 'partially_correct'
                          ? 'text-yellow-700'
                          : 'text-red-700'
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

