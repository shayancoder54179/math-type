import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { addStyles, EditableMathField } from 'react-mathquill';
import { cn } from '@/lib/utils';

// Add MathQuill styles
addStyles();

interface MathInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onFocus?: () => void;
}

export interface MathInputHandle {
  write: (text: string) => void;
  focus: () => void;
  getCursorPosition: () => number | null;
  getLatex: () => string;
  setLatex: (latex: string) => void;
}

// Convert simple math syntax to LaTeX
function convertToLatex(input: string): string {
  if (!input.trim()) return '';
  
  // If it already looks like LaTeX (contains backslashes), return as-is
  if (input.includes('\\')) {
    return input;
  }

  let latex = input;

  // Convert sqrt: sqrt(x) -> \sqrt{x} (do this before fractions to avoid conflicts)
  latex = latex.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');

  // Convert fractions: a/b -> \frac{a}{b}
  // Handle simple fractions like x/3, (a+b)/c, etc.
  latex = latex.replace(/([a-zA-Z0-9()+\-*\s]+)\s*\/\s*([a-zA-Z0-9()+\-*\s]+)/g, (match, num, den) => {
    // Skip if already contains LaTeX commands
    if (num.includes('\\') || den.includes('\\')) {
      return match;
    }
    const numerator = num.trim();
    const denominator = den.trim();
    // Only convert if both parts are non-empty
    if (numerator && denominator) {
      return `\\frac{${numerator}}{${denominator}}`;
    }
    return match;
  });

  // Convert exponents: x^2 -> x^{2}, x^n -> x^{n}
  latex = latex.replace(/([a-zA-Z0-9)\}]+)\^([a-zA-Z0-9()+\-*]+)/g, '$1^{$2}');

  // Convert common functions
  latex = latex.replace(/\bsin\(/g, '\\sin(');
  latex = latex.replace(/\bcos\(/g, '\\cos(');
  latex = latex.replace(/\btan\(/g, '\\tan(');
  latex = latex.replace(/\blog\(/g, '\\log(');
  latex = latex.replace(/\bln\(/g, '\\ln(');
  latex = latex.replace(/\bexp\(/g, '\\exp(');

  // Convert Greek letters and common symbols
  latex = latex.replace(/\bpi\b/g, '\\pi');
  latex = latex.replace(/\btheta\b/g, '\\theta');
  latex = latex.replace(/\balpha\b/g, '\\alpha');
  latex = latex.replace(/\bbeta\b/g, '\\beta');
  latex = latex.replace(/\bgamma\b/g, '\\gamma');
  latex = latex.replace(/\bdelta\b/g, '\\delta');
  latex = latex.replace(/\binfinity\b/g, '\\infty');
  latex = latex.replace(/\binfty\b/g, '\\infty');

  // Convert multiplication: * -> \times
  latex = latex.replace(/([a-zA-Z0-9)\}])\s*\*\s*([a-zA-Z0-9(])/g, '$1 \\times $2');

  return latex;
}

export const MathInput = forwardRef<MathInputHandle, MathInputProps>(
  ({ value, onChange, placeholder: _placeholder, className, onFocus }, ref) => {
    const mathFieldRef = useRef<any>(null);
    const isUpdatingRef = useRef(false);
    const conversionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      write: (text: string) => {
        if (mathFieldRef.current) {
          mathFieldRef.current.write(text);
        }
      },
      focus: () => {
        if (mathFieldRef.current) {
          mathFieldRef.current.focus();
        }
      },
      getCursorPosition: () => {
        if (mathFieldRef.current) {
          try {
            // MathQuill cursor API - get the cursor node
            const cursor = mathFieldRef.current.cursor();
            if (cursor) {
              // Try to get the latex before cursor
              // This is approximate - MathQuill doesn't expose exact character position
              const latex = mathFieldRef.current.latex();
              // Return the full latex for now - we'll split it differently
              return latex.length; // Approximate: return length as position
            }
          } catch (e) {
            // Fallback
          }
        }
        return null;
      },
      getLatex: () => {
        if (mathFieldRef.current) {
          return mathFieldRef.current.latex();
        }
        return '';
      },
      setLatex: (latex: string) => {
        if (mathFieldRef.current) {
          isUpdatingRef.current = true;
          mathFieldRef.current.latex(latex);
          isUpdatingRef.current = false;
        }
      },
    }));

    // Convert value to LaTeX format
    const latexValue = value ? convertToLatex(value) : '';

    // Handle changes from MathQuill
    const handleChange = (mathField: any) => {
      if (isUpdatingRef.current) return;
      
      const latex = mathField.latex();
      onChange(latex);

      // Convert simple syntax to LaTeX after a short delay
      if (conversionTimeoutRef.current) {
        clearTimeout(conversionTimeoutRef.current);
      }
      
      conversionTimeoutRef.current = setTimeout(() => {
        if (mathFieldRef.current && !isUpdatingRef.current) {
          const currentLatex = mathFieldRef.current.latex();
          const converted = convertToLatex(currentLatex);
          if (converted !== currentLatex && converted) {
            isUpdatingRef.current = true;
            mathFieldRef.current.latex(converted);
            isUpdatingRef.current = false;
          }
        }
      }, 300);
    };

    // Update MathQuill when value changes externally
    useEffect(() => {
      if (mathFieldRef.current && !isUpdatingRef.current) {
        const currentLatex = mathFieldRef.current.latex();
        const newLatex = latexValue;
        
        // Only update if different to avoid infinite loops
        if (currentLatex !== newLatex) {
          isUpdatingRef.current = true;
          mathFieldRef.current.latex(newLatex);
          isUpdatingRef.current = false;
        }
      }
    }, [latexValue]);

    // Listen to virtual keyboard events
    useEffect(() => {
      const handleKeyboardInsert = (event: CustomEvent) => {
        if (mathFieldRef.current) {
          const text = event.detail.text || '';
          // Insert LaTeX into MathQuill
          mathFieldRef.current.write(text);
          mathFieldRef.current.focus();
        }
      };

      const handleKeyboardAction = (event: CustomEvent) => {
        if (mathFieldRef.current) {
          const action = event.detail.action;
          
          switch (action) {
            case 'backspace':
              mathFieldRef.current.keystroke('Backspace');
              break;
            case 'arrowLeft':
              mathFieldRef.current.keystroke('Left');
              break;
            case 'arrowRight':
              mathFieldRef.current.keystroke('Right');
              break;
            case 'enter':
              mathFieldRef.current.blur();
              break;
          }
        }
      };

      window.addEventListener('math-keyboard-insert', handleKeyboardInsert as EventListener);
      window.addEventListener('math-keyboard-action', handleKeyboardAction as EventListener);

      return () => {
        window.removeEventListener('math-keyboard-insert', handleKeyboardInsert as EventListener);
        window.removeEventListener('math-keyboard-action', handleKeyboardAction as EventListener);
        if (conversionTimeoutRef.current) {
          clearTimeout(conversionTimeoutRef.current);
        }
      };
    }, []);

    // Check if className includes inline styling (for fill-in-the-blank)
    const isInline = className?.includes('inline') || className?.includes('w-[');
    const containerClass = isInline 
      ? cn('inline-block', className, 'overflow-hidden') 
      : cn('w-full', className);
    const inputClass = isInline 
      ? "min-h-[40px] border border-input bg-background rounded-md px-2 py-1 text-sm focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
      : "w-full min-h-[40px] border border-input bg-background rounded-md px-3 py-2 text-sm focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2";

    return (
      <div className={containerClass} style={isInline ? { maxWidth: '100%' } : undefined}>
        <EditableMathField
          latex={latexValue}
          onChange={handleChange}
          mathquillDidMount={(mathField: any) => {
            mathFieldRef.current = mathField;
            // Add focus handler if provided
            if (onFocus) {
              const el = mathField.el();
              if (el) {
                el.addEventListener('focus', onFocus);
              }
            }
          }}
          config={{
            spaceBehavesLikeTab: true,
            leftRightIntoCmdGoes: 'up',
            restrictMismatchedBrackets: true,
            sumStartsWithNEquals: true,
            supSubsRequireOperand: true,
            charsThatBreakOutOfSupSub: '+-=<>',
            autoSubscriptNumerals: true,
            autoCommands: 'pi theta sqrt sum prod alpha beta gamma delta',
            autoOperatorNames: 'sin cos tan sec csc cot sinh cosh tanh log ln',
          }}
          className={inputClass}
          style={{
            fontFamily: 'inherit',
            textAlign: isInline ? 'center' : 'left',
            width: isInline ? '100%' : undefined,
            maxWidth: isInline ? '100%' : undefined
          }}
        />
      </div>
    );
  }
);
