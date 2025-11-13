import { StaticMathField } from 'react-mathquill';
import { cn } from '@/lib/utils';

interface MathDisplayProps {
  latex: string;
  className?: string;
}

export function MathDisplay({ latex, className }: MathDisplayProps) {
  if (!latex) return null;
  
  return (
    <span className={cn('inline-block', className)}>
      <StaticMathField>{latex}</StaticMathField>
    </span>
  );
}

