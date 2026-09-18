import { useEffect, useMemo, useState } from 'react';
import { CHART_KATEGORI_COLORS } from '@/lib/colors';
import { useCountUp } from '@/hooks/use-count-up';
import type { Distribusi } from '@/types/statistik';

const LEBAR_BAR_MINIMUM_PERSEN = 2;

function lebarBar(nilai: number, maks: number): string {
  if (nilai <= 0) return '0%';
  return `${Math.max((nilai / maks) * 100, LEBAR_BAR_MINIMUM_PERSEN)}%`;
}

function BarItemCount({ value }: { value: number }) {
  const { textRef } = useCountUp(value);
  return <span ref={textRef} />;
}

export function DistribusiBarChart({ data }: { data: Distribusi[] }) {
  const [terpasang, setTerpasang] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTerpasang(true);
    }, 60);
    return () => clearTimeout(timer);
  }, [data]);

  const total = useMemo(
    () => data.reduce((acc, d) => acc + d.value, 0),
    [data],
  );
  const maks = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);

  if (data.length === 0) {
    return <p className="text-sm text-slate-500">Belum ada data.</p>;
  }

  return (
    <dl className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2.5 sm:gap-x-4 sm:gap-y-3">
      {data.map((d, i) => {
        const persen = total > 0 ? Math.round((d.value / total) * 100) : 0;
        const warna = CHART_KATEGORI_COLORS[i % CHART_KATEGORI_COLORS.length];

        return (
          <div key={d.label} className="group contents">
            <dt
              className="max-w-[130px] truncate text-xs font-semibold text-slate-800 transition-colors group-hover:text-slate-950 sm:max-w-none sm:whitespace-normal sm:text-sm"
              title={d.label}
            >
              {d.label}
            </dt>
            <dd
              className="h-3 overflow-hidden rounded bg-slate-100/90 transition-colors group-hover:bg-slate-200/80 sm:h-3.5"
              aria-hidden
            >
              <div
                className="duration-750 h-full rounded transition-all ease-out group-hover:brightness-105 motion-reduce:transition-none"
                style={{
                  width: terpasang ? lebarBar(d.value, maks) : '0%',
                  transitionDelay: `${Math.min(i * 45, 360)}ms`,
                  backgroundColor: warna,
                }}
              />
            </dd>
            <dd
              className="flex items-center justify-end gap-2 text-right text-xs font-bold tabular-nums text-slate-900 transition-opacity duration-500 ease-out motion-reduce:transition-none sm:text-sm"
              style={{
                opacity: terpasang ? 1 : 0,
                transitionDelay: `${Math.min(i * 45 + 60, 420)}ms`,
              }}
            >
              <span className="min-w-[1.75rem] text-right">
                <BarItemCount value={d.value} />
              </span>
              <span className="inline-flex min-w-[2.85rem] items-center justify-center rounded-md border-1 border-black bg-transparent px-1.5 py-0.5 text-2xs font-extrabold tabular-nums text-slate-900 sm:text-xs">
                {total === 0 ? '—' : `${persen}%`}
              </span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
