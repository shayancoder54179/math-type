/**
 * Finds all blank placeholders in the format [blank_N] where N is a number
 */
export function findBlanks(content: string): Array<{ index: number; number: number; fullMatch: string }> {
  if (!content) return [];
  
  const blanks: Array<{ index: number; number: number; fullMatch: string }> = [];
  const regex = /\[blank_(\d+)\]/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    blanks.push({
      index: match.index,
      number: parseInt(match[1], 10),
      fullMatch: match[0],
    });
  }
  
  return blanks;
}

/**
 * Counts the number of blank placeholders [blank_N] in content
 */
export function countBlanks(content: string): number {
  if (!content) return 0;
  return findBlanks(content).length;
}

/**
 * Gets the next blank number to use (highest number + 1, or 1 if none exist)
 */
export function getNextBlankNumber(blocks: Array<{ content: string }>): number {
  let maxNumber = 0;
  blocks.forEach(block => {
    const blanks = findBlanks(block.content);
    blanks.forEach(blank => {
      if (blank.number > maxNumber) {
        maxNumber = blank.number;
      }
    });
  });
  return maxNumber + 1;
}

/**
 * Parses content and splits it into text and blank parts
 * Returns an array of parts: [text, blank, text, blank, ...]
 */
export function parseBlanks(content: string): Array<{ type: 'text' | 'blank'; content: string; blankNumber?: number }> {
  if (!content) return [];
  
  const blanks = findBlanks(content);
  if (blanks.length === 0) {
    return [{ type: 'text', content }];
  }
  
  const parts: Array<{ type: 'text' | 'blank'; content: string; blankNumber?: number }> = [];
  let lastIndex = 0;
  
  blanks.forEach(blank => {
    // Add text before this blank
    if (blank.index > lastIndex) {
      const textBefore = content.substring(lastIndex, blank.index);
      if (textBefore) {
        parts.push({ type: 'text', content: textBefore });
      }
    }
    
    // Add the blank
    parts.push({ 
      type: 'blank', 
      content: '[ ]', 
      blankNumber: blank.number 
    });
    
    lastIndex = blank.index + blank.fullMatch.length;
  });
  
  // Add remaining text after last blank
  if (lastIndex < content.length) {
    const textAfter = content.substring(lastIndex);
    if (textAfter) {
      parts.push({ type: 'text', content: textAfter });
    }
  }
  
  return parts;
}

/**
 * Gets the total number of blanks across all blocks
 */
export function getTotalBlanks(blocks: Array<{ content: string }>): number {
  return blocks.reduce((total, block) => total + countBlanks(block.content), 0);
}

