import { cn } from '@/lib/utils';

export type Variant =
  'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'cta';
export type Size = 'sm' | 'md' | 'lg';

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white shadow-sm hover:bg-brand-700 hover:shadow-md hover:-translate-y-0.5 active:bg-brand-800 active:shadow-sm active:translate-y-0 active:scale-[0.98]',
  secondary:
    'bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-200 hover:shadow hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
  outline:
    'border-1 border-black bg-surface text-slate-700 shadow-sm hover:bg-slate-50 hover:shadow hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
  ghost:
    'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-95',
  danger:
    'bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md hover:-translate-y-0.5 active:bg-red-800 active:shadow-sm active:translate-y-0 active:scale-[0.98]',
  cta: 'bg-[#FACC15] text-[#4C1D95] font-bold shadow-sm hover:bg-yellow-400 hover:shadow-md hover:-translate-y-0.5 active:bg-yellow-500 active:shadow-sm active:translate-y-0 active:scale-[0.98]',
};

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export function buttonClass({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}): string {
  return cn(
    'focus-ring inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 ease-out motion-reduce:transition-none motion-reduce:hover:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:active:scale-100',
    variantStyles[variant],
    sizeStyles[size],
    className,
  );
}
