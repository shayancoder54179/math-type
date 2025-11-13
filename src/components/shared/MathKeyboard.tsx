import { useState } from 'react';
import { ArrowLeft, ArrowRight, Delete, CornerDownLeft, ChevronUp, ChevronDown } from 'lucide-react';

interface MathKeyboardProps {
  onInsert: (text: string) => void;
  className?: string;
}

type KeyboardMode = 'Main' | 'ABC' | 'Funcs' | 'Symbs';

export function MathKeyboard({ onInsert, className }: MathKeyboardProps) {
  const [mode, setMode] = useState<KeyboardMode>('Main');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleClick = (text: string) => {
    // Replace # with empty string (placeholder for cursor position)
    const processedText = text.replace(/#/g, '');
    onInsert(processedText);
  };

  const handleBackspace = () => {
    // Dispatch backspace event for any input that might be listening
    window.dispatchEvent(new CustomEvent('math-keyboard-action', { detail: { action: 'backspace' } }));
  };

  const handleArrow = (direction: 'left' | 'right') => {
    const action = direction === 'left' ? 'arrowLeft' : 'arrowRight';
    window.dispatchEvent(new CustomEvent('math-keyboard-action', { detail: { action } }));
  };

  const handleEnter = () => {
    window.dispatchEvent(new CustomEvent('math-keyboard-action', { detail: { action: 'enter' } }));
  };

  // Main mode buttons (8 columns x 4 rows)
  const mainButtons = [
    // Row 1
    [{ label: 'x', latex: 'x' }, { label: 'y', latex: 'y' }, { label: 'e', latex: 'e' }, { label: 'π', latex: '\\pi' }, { label: '7', latex: '7' }, { label: '8', latex: '8' }, { label: '9', latex: '9' }, { label: '□/□', latex: '\\frac{#}{#}' }],
    // Row 2
    [{ label: '√□', latex: '\\sqrt{#}' }, { label: 'ⁿ√□', latex: '\\sqrt[#]{#}' }, { label: 'a²', latex: '^{2}' }, { label: 'a^□', latex: '^{#}' }, { label: '4', latex: '4' }, { label: '5', latex: '5' }, { label: '6', latex: '6' }, { label: '×', latex: '\\times' }],
    // Row 3
    [{ label: '<', latex: '<' }, { label: '>', latex: '>' }, { label: '≤', latex: '\\leq' }, { label: '≥', latex: '\\geq' }, { label: '1', latex: '1' }, { label: '2', latex: '2' }, { label: '3', latex: '3' }, { label: '−', latex: '-' }],
    // Row 4
    [{ label: '(', latex: '(' }, { label: ')', latex: ')' }, { label: '!', latex: '!' }, { label: 'θ', latex: '\\theta' }, { label: '0', latex: '0' }, { label: '.', latex: '.' }, { label: '=', latex: '=' }, { label: '+', latex: '+' }],
  ];

  // ABC mode buttons (alphabetical keyboard)
  const abcButtons = [
    // Row 1
    [{ label: 'a', latex: 'a' }, { label: 'b', latex: 'b' }, { label: 'c', latex: 'c' }, { label: 'd', latex: 'd' }, { label: 'e', latex: 'e' }, { label: 'f', latex: 'f' }, { label: 'g', latex: 'g' }, { label: 'h', latex: 'h' }],
    // Row 2
    [{ label: 'i', latex: 'i' }, { label: 'j', latex: 'j' }, { label: 'k', latex: 'k' }, { label: 'l', latex: 'l' }, { label: 'm', latex: 'm' }, { label: 'n', latex: 'n' }, { label: 'o', latex: 'o' }, { label: 'p', latex: 'p' }],
    // Row 3
    [{ label: 'q', latex: 'q' }, { label: 'r', latex: 'r' }, { label: 's', latex: 's' }, { label: 't', latex: 't' }, { label: 'u', latex: 'u' }, { label: 'v', latex: 'v' }, { label: 'w', latex: 'w' }, { label: 'x', latex: 'x' }],
    // Row 4
    [{ label: 'y', latex: 'y' }, { label: 'z', latex: 'z' }, { label: 'A', latex: 'A' }, { label: 'B', latex: 'B' }, { label: 'C', latex: 'C' }, { label: 'D', latex: 'D' }, { label: 'E', latex: 'E' }, { label: 'F', latex: 'F' }],
  ];

  // Funcs mode buttons (mathematical functions)
  const funcsButtons = [
    // Row 1
    [{ label: 'sin', latex: '\\sin' }, { label: 'cos', latex: '\\cos' }, { label: 'tan', latex: '\\tan' }, { label: 'cot', latex: '\\cot' }, { label: 'sec', latex: '\\sec' }, { label: 'csc', latex: '\\csc' }, { label: 'log', latex: '\\log' }, { label: 'ln', latex: '\\ln' }],
    // Row 2
    [{ label: 'sin⁻¹', latex: '\\arcsin' }, { label: 'cos⁻¹', latex: '\\arccos' }, { label: 'tan⁻¹', latex: '\\arctan' }, { label: 'exp', latex: '\\exp' }, { label: 'min', latex: '\\min' }, { label: 'max', latex: '\\max' }, { label: 'gcd', latex: '\\gcd' }, { label: 'lcm', latex: '\\text{lcm}' }],
    // Row 3
    [{ label: 'lim', latex: '\\lim' }, { label: '∑', latex: '\\sum' }, { label: '∏', latex: '\\prod' }, { label: '∫', latex: '\\int' }, { label: '∮', latex: '\\oint' }, { label: '∂', latex: '\\partial' }, { label: '∇', latex: '\\nabla' }, { label: '∞', latex: '\\infty' }],
    // Row 4
    [{ label: 'det', latex: '\\det' }, { label: 'dim', latex: '\\dim' }, { label: 'ker', latex: '\\ker' }, { label: 'rank', latex: '\\text{rank}' }, { label: 'tr', latex: '\\text{tr}' }, { label: 'span', latex: '\\text{span}' }, { label: 'mod', latex: '\\bmod' }, { label: 'gcd', latex: '\\gcd' }],
  ];

  // Symbs mode buttons (mathematical symbols)
  const symbsButtons = [
    // Row 1
    [{ label: 'α', latex: '\\alpha' }, { label: 'β', latex: '\\beta' }, { label: 'γ', latex: '\\gamma' }, { label: 'δ', latex: '\\delta' }, { label: 'ε', latex: '\\epsilon' }, { label: 'ζ', latex: '\\zeta' }, { label: 'η', latex: '\\eta' }, { label: 'θ', latex: '\\theta' }],
    // Row 2
    [{ label: 'ι', latex: '\\iota' }, { label: 'κ', latex: '\\kappa' }, { label: 'λ', latex: '\\lambda' }, { label: 'μ', latex: '\\mu' }, { label: 'ν', latex: '\\nu' }, { label: 'ξ', latex: '\\xi' }, { label: 'ο', latex: 'o' }, { label: 'π', latex: '\\pi' }],
    // Row 3
    [{ label: 'ρ', latex: '\\rho' }, { label: 'σ', latex: '\\sigma' }, { label: 'τ', latex: '\\tau' }, { label: 'υ', latex: '\\upsilon' }, { label: 'φ', latex: '\\phi' }, { label: 'χ', latex: '\\chi' }, { label: 'ψ', latex: '\\psi' }, { label: 'ω', latex: '\\omega' }],
    // Row 4
    [{ label: 'Γ', latex: '\\Gamma' }, { label: 'Δ', latex: '\\Delta' }, { label: 'Θ', latex: '\\Theta' }, { label: 'Λ', latex: '\\Lambda' }, { label: 'Ξ', latex: '\\Xi' }, { label: 'Π', latex: '\\Pi' }, { label: 'Σ', latex: '\\Sigma' }, { label: 'Ω', latex: '\\Omega' }],
  ];

  // Get buttons based on current mode
  const getCurrentButtons = () => {
    switch (mode) {
      case 'ABC':
        return abcButtons;
      case 'Funcs':
        return funcsButtons;
      case 'Symbs':
        return symbsButtons;
      default:
        return mainButtons;
    }
  };

  const currentButtons = getCurrentButtons();

  const modeButtons = [
    { label: 'Main', mode: 'Main' as KeyboardMode },
    { label: 'ABC', mode: 'ABC' as KeyboardMode },
    { label: 'Funcs', mode: 'Funcs' as KeyboardMode },
    { label: 'Symbs', mode: 'Symbs' as KeyboardMode },
  ];

  return (
    <div className="relative">
      {/* Floating toggle button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -top-10 right-4 z-50 bg-primary text-primary-foreground rounded-t-lg px-3 py-1 shadow-lg hover:bg-primary/90 transition-colors flex items-center gap-1 text-sm"
      >
        {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        <span>{isCollapsed ? 'Show' : 'Hide'} Keyboard</span>
      </button>

      <div 
        className={`flex-shrink-0 z-50 transition-all duration-300 ${className || ''} ${
          isCollapsed ? 'max-h-0 overflow-hidden' : 'max-h-screen'
        }`}
        style={{
          background: '#4a4a4a',
          backgroundImage: `
            radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px),
            radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px',
          padding: '8px',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.3)',
        }}
      >
      <div className="max-w-5xl mx-auto">
        <div className="flex gap-2">
          {/* Main mathematical input area - 8 columns */}
          <div className="flex-1 grid grid-cols-8 gap-1">
            {currentButtons.map((row, rowIndex) =>
              row.map((btn, colIndex) => (
                <button
                  key={`${mode}-${rowIndex}-${colIndex}`}
                  onClick={() => handleClick(btn.latex)}
                  className="bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-900 rounded-lg font-medium text-xs transition-colors duration-100 min-h-[32px] flex items-center justify-center shadow-md border border-gray-300"
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}
                >
                  {btn.label}
                </button>
              ))
            )}
          </div>

          {/* Navigation and mode selection area - 2 columns */}
          <div className="w-20 grid grid-cols-2 gap-1">
            {/* Column 1: Action buttons */}
            <div className="flex flex-col gap-1">
              <button
                onClick={handleBackspace}
                className="bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-900 rounded-lg font-medium transition-colors duration-100 min-h-[32px] flex items-center justify-center shadow-md border border-gray-300"
              >
                <Delete className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleArrow('left')}
                className="bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-900 rounded-lg font-medium transition-colors duration-100 min-h-[32px] flex items-center justify-center shadow-md border border-gray-300"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleArrow('right')}
                className="bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-900 rounded-lg font-medium transition-colors duration-100 min-h-[32px] flex items-center justify-center shadow-md border border-gray-300"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={handleEnter}
                className="bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-900 rounded-lg font-medium transition-colors duration-100 min-h-[32px] flex items-center justify-center shadow-md border border-gray-300"
              >
                <CornerDownLeft className="h-4 w-4" />
              </button>
            </div>

            {/* Column 2: Mode buttons */}
            <div className="flex flex-col gap-1">
              {modeButtons.map((btn) => (
                <button
                  key={btn.mode}
                  onClick={() => setMode(btn.mode)}
                  className={`rounded-lg font-medium transition-colors duration-100 min-h-[32px] flex items-center justify-center shadow-md border border-gray-300 text-xs ${
                    mode === btn.mode
                      ? 'bg-gray-300 text-gray-900'
                      : 'bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-900'
                  }`}
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
