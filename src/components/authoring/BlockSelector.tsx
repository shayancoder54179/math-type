import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { BlockType } from '@/types';

interface BlockSelectorProps {
  onSelect: (type: BlockType) => void;
}

export function BlockSelector({ onSelect }: BlockSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-10 w-10">
          <Plus className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => onSelect('text')}>
          Text Box
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect('math')}>
          Math Box
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

