import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface KreditKknProps {
  className?: string;
  kiri?: ReactNode;
  kanan?: ReactNode;
}

export function KreditKkn({ className, kiri, kanan }: KreditKknProps) {
  return (
    <footer
      className={cn(
        'sticky bottom-0 z-30 flex w-full flex-col items-center justify-center border-t-1 border-black bg-surface px-4 py-3.5 text-slate-600 [transform:translate3d(0,0,0)] sm:flex-row sm:justify-between sm:gap-3 sm:py-2',
        className,
      )}
    >
      <div className="hidden sm:flex sm:w-auto sm:items-center sm:justify-start">
        {kiri}
      </div>
      <p className="text-center text-xs font-medium text-slate-600 sm:flex-1 sm:text-sm">
        Dikembangkan oleh{' '}
        <span className="font-bold text-slate-900">Tim KKNM-29228 UNY</span> ·{' '}
        {new Date().getFullYear()}
      </p>
      <div className="hidden sm:flex sm:items-center sm:gap-2.5">{kanan}</div>
    </footer>
  );
}
