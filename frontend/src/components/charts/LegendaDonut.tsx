import { useEffect, useState } from 'react';
import type { Distribusi } from '@/types/statistik';
import { cn, formatAngka } from '@/lib/utils';

export function LegendaDonut({
  data,
  warna,
}: {
  data: Distribusi[];
  warna: readonly string[];
}) {
  const [terpasang, setTerpasang] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTerpasang(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [data]);

  const total = data.reduce((n, d) => n + d.value, 0);

  return (
    <ul
      className={cn(
        'mt-5 grid gap-2 sm:gap-2.5',
        data.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2',
      )}
    >
      {data.map((d, i) => {
        const persen = total === 0 ? 0 : Math.round((d.value / total) * 100);

        return (
          <li
            key={d.label}
            className="flex items-center justify-between gap-3 rounded-lg border-1 border-black bg-white px-3 py-2 transition-all duration-300 ease-out motion-reduce:transition-none sm:py-2.5"
            style={{
              opacity: terpasang ? 1 : 0,
              transform: terpasang ? 'translateY(0)' : 'translateY(8px)',
              transitionDelay: `${Math.min(i * 35 + 100, 450)}ms`,
            }}
          >
            {/* Swatch & Label */}
            <div className="flex min-w-0 items-center gap-2.5 pr-1">
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full border-1 border-black"
                style={{ backgroundColor: warna[i % warna.length] }}
                aria-hidden
              />
              <span
                className="truncate text-xs font-semibold text-slate-900 sm:text-sm"
                title={d.label}
              >
                {d.label}
              </span>
            </div>

            {/* Jumlah & Persentase */}
            <div className="flex shrink-0 items-center gap-2">
              <span className="min-w-[1.75rem] text-right text-xs font-bold tabular-nums text-slate-900 sm:text-sm">
                {formatAngka(d.value)}
              </span>
              <span className="inline-flex min-w-[2.85rem] items-center justify-center rounded-md border-1 border-black bg-transparent px-1.5 py-0.5 text-2xs font-extrabold tabular-nums text-slate-900 sm:text-xs">
                {total === 0 ? '—' : `${persen}%`}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
