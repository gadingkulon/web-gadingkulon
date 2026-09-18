import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-slate-200/80', className)}
      {...props}
    />
  );
}

function StatCardSkeleton() {
  return (
    <div className="flex h-full items-center gap-3 rounded-xl border-1 border-black bg-surface p-3 shadow-sm sm:gap-4 sm:p-4">
      <Skeleton className="h-9 w-9 shrink-0 rounded-lg sm:h-12 sm:w-12" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-24 sm:w-28" />
        <Skeleton className="h-6 w-16 sm:w-20" />
      </div>
    </div>
  );
}

export function GridStatSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

function BeritaCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border-1 border-black bg-surface shadow-sm">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="space-y-3 p-4 sm:p-5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function GridBeritaSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <BeritaCardSkeleton key={i} />
      ))}
    </div>
  );
}
