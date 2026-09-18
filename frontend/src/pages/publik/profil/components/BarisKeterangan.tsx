import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BarisKeteranganProps {
  label: string;
  nilai: string;
  icon?: ReactNode;
  nilaiClass?: string;
  className?: string;
}

export function BarisKeterangan({
  label,
  nilai,
  icon,
  className,
  nilaiClass,
}: BarisKeteranganProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-slate-50/80 sm:px-5 sm:py-3.5',
        className,
      )}
    >
      <dt className="flex min-w-0 items-center gap-2.5 pr-2">
        {icon}
        <span
          className="truncate text-xs font-medium text-slate-700 sm:text-sm"
          title={label}
        >
          {label}
        </span>
      </dt>
      <dd className="shrink-0 text-right">
        <span
          className={cn(
            'text-xs font-bold tabular-nums text-slate-900 sm:text-sm',
            nilaiClass,
          )}
          title={nilai}
        >
          {nilai}
        </span>
      </dd>
    </div>
  );
}
