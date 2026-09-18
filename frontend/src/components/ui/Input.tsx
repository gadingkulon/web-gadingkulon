import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;

  icon?: ReactNode;

  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, trailing, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}
        <div className={cn((icon || trailing) && 'relative')}>
          {icon && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-slate-600"
            >
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'h-10 w-full rounded-lg border-1 border-black bg-surface px-3 text-base text-slate-900 transition-all duration-150 placeholder:text-slate-400 hover:border-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black sm:text-sm',
              icon && 'pl-10',
              trailing && 'pr-11',
              error &&
                'border-red-500 focus:border-red-600 focus:ring-red-500 focus-visible:ring-red-600',
              className,
            )}
            aria-invalid={Boolean(error)}
            {...props}
          />
          {trailing && (
            <span className="absolute inset-y-0 right-0 flex w-11 items-center justify-center">
              {trailing}
            </span>
          )}
        </div>
        {error ? (
          <p className="mt-1 text-xs text-red-600">{error}</p>
        ) : hint ? (
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';
