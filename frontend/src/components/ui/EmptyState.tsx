import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 px-4 py-12 text-center">
      <div className="shadow-xs flex h-12 w-12 items-center justify-center rounded-full border-1 border-slate-300 bg-slate-100">
        <Icon className="h-6 w-6 text-slate-800" strokeWidth={2.25} />
      </div>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      {description && (
        <p className="max-w-sm text-xs font-medium text-slate-600 sm:text-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
