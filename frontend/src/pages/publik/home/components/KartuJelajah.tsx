import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

export function KartuJelajah({
  ke,
  judul,
  deskripsi,
  ikon,
  className,
}: {
  ke: string;
  judul: string;
  deskripsi: string;
  ikon: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={ke}
      className={cn(
        'focus-ring group flex h-full w-full flex-row items-center gap-3.5 rounded-xl border-1 border-black bg-surface p-3 shadow-sm transition-all hover:border-black hover:shadow-md sm:flex-col sm:items-start sm:gap-0 sm:p-6 sm:hover:-translate-y-1 sm:hover:border-black sm:hover:shadow-lg',
        className,
      )}
    >
      <div className="shrink-0">{ikon}</div>
      <div className="min-w-0 flex-1 sm:mt-4 sm:flex sm:w-full sm:flex-col">
        <h3 className="text-sm font-bold text-slate-900 sm:text-lg">{judul}</h3>
        <p className="mt-0.5 text-xs text-slate-600 sm:mt-2 sm:text-sm">
          {deskripsi}
        </p>
      </div>
      <div className="shrink-0 text-slate-700 transition-transform group-hover:translate-x-0.5 sm:hidden">
        <ChevronRight className="h-4 w-4" />
      </div>
      <span className="mt-4 hidden items-center gap-1 text-sm font-semibold text-brand-700 sm:mt-auto sm:inline-flex sm:pt-4">
        Buka halaman
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
