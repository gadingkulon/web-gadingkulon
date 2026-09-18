import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'info' | 'success' | 'error';

const config: Record<Tone, { icon: typeof Info; className: string }> = {
  info: {
    icon: Info,
    className: 'bg-brand-600/10 text-brand-800 border-brand-600/20',
  },
  success: {
    icon: CheckCircle2,
    className: 'bg-green-600/10 text-green-800 border-green-600/20',
  },
  error: {
    icon: AlertCircle,
    className: 'bg-red-600/10 text-red-800 border-red-600/20',
  },
};

export function Alert({
  tone = 'info',
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  const { icon: Icon, className } = config[tone];
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg border-1 px-3.5 py-2.5 text-sm',
        className,
      )}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1 break-words">{children}</div>
    </div>
  );
}
