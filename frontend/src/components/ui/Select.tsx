import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;

  pilihan?: Record<string, string>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, pilihan, id, children, ...props }, ref) => {
    const selectId = id ?? props.name;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'h-10 w-full rounded-lg border-1 border-black bg-surface px-3 text-base text-slate-900 transition-all duration-150 hover:border-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black disabled:bg-slate-100 disabled:text-slate-500 sm:text-sm',
            error &&
              'border-red-500 focus:border-red-600 focus:ring-red-500 focus-visible:ring-red-600',
            className,
          )}
          aria-invalid={Boolean(error)}
          {...props}
        >
          {pilihan
            ? Object.entries(pilihan).map(([nilai, teks]) => (
                <option
                  key={nilai}
                  value={nilai}
                  className="bg-surface text-slate-900"
                >
                  {teks}
                </option>
              ))
            : children}
        </select>
        {error ? (
          <p className="mt-1 text-xs text-red-600">{error}</p>
        ) : hint ? (
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        ) : null}
      </div>
    );
  },
);
Select.displayName = 'Select';
