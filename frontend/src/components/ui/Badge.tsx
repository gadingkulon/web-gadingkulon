import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'brand' | 'green' | 'amber' | 'slate' | 'red';

const tones: Record<Tone, string> = {
  brand: 'bg-brand-600/20',
  green: 'bg-green-600/20',
  amber: 'bg-amber-500/20',
  slate: 'bg-slate-500/20',
  red: 'bg-red-600/20',
};

export function Badge({
  tone = 'slate',
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
