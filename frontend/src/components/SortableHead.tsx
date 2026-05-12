import { FC } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TableHead } from '@/components/ui/table';
import { SortDir } from '../hooks/useSortFilter';

interface SortableHeadProps {
  sortKey: string;
  currentSortKey: string | null;
  currentSortDir: SortDir;
  onToggle: (key: string) => void;
  children: React.ReactNode;
  className?: string;
}

const SortableHead: FC<SortableHeadProps> = ({
  sortKey,
  currentSortKey,
  currentSortDir,
  onToggle,
  children,
  className,
}) => {
  const active = currentSortKey === sortKey;
  return (
    <TableHead
      className={cn('cursor-pointer select-none whitespace-nowrap', className)}
      onClick={() => onToggle(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {active ? (
          currentSortDir === 'asc' ? (
            <ArrowUp size={12} />
          ) : (
            <ArrowDown size={12} />
          )
        ) : (
          <ArrowUpDown size={12} className="text-muted-foreground/50" />
        )}
      </span>
    </TableHead>
  );
};

export default SortableHead;
