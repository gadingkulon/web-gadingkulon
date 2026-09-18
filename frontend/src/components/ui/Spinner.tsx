import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

function Spinner({ className }: { className?: string }) {
  return (
    <Loader2 className={cn('h-5 w-5 animate-spin text-brand-500', className)} />
  );
}

export function LoadingBlock({ label = 'Memuat…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-500">
      <Spinner />
      <span className="text-sm">{label}</span>
    </div>
  );
}
