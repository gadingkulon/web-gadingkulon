import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Table({
  className,
  ...props
}: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto [webkit-overflow-scrolling:touch]">
      <table
        className={cn('w-full border-collapse text-sm', className)}
        {...props}
      />
    </div>
  );
}

export function Th({
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'whitespace-nowrap border-b-1 border-black bg-slate-100 px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-slate-700 sm:px-4 sm:py-3',
        className,
      )}
      {...props}
    />
  );
}

export function Td({
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        'whitespace-nowrap border-b-1 border-black px-3 py-2.5 text-sm text-slate-800 sm:px-4 sm:py-3',
        className,
      )}
      {...props}
    />
  );
}
