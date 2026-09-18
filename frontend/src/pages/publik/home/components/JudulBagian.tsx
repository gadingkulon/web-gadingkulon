import type { ReactNode } from 'react';

export function JudulBagian({
  judul,
  deskripsi,
  aksi,
  className,
}: {
  judul: string;
  deskripsi?: string;
  aksi?: ReactNode;
  className?: string;
}) {
  return (
    <div className="mb-4 flex flex-col justify-between gap-3 sm:mb-8 sm:flex-row sm:items-end sm:gap-4">
      <div>
        <h2
          className={`text-xl font-bold text-slate-900 sm:text-2xl lg:text-3xl ${className ?? ''}`}
        >
          {judul}
        </h2>
        {deskripsi && (
          <p className="mt-1 max-w-2xl text-xs text-slate-600 sm:mt-2 sm:text-sm">
            {deskripsi}
          </p>
        )}
      </div>
      {aksi && <div className="w-full shrink-0 sm:w-auto">{aksi}</div>}
    </div>
  );
}
