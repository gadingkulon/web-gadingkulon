import { useEffect, useMemo, useState } from 'react';
import { CHART_KATEGORI_COLORS } from '@/lib/colors';
import { formatAngka } from '@/lib/utils';
import { useCountUp } from '@/hooks/use-count-up';
import type { Distribusi } from '@/types/statistik';

function BarItemCount({ value }: { value: number }) {
  const { textRef } = useCountUp(value);
  return <span ref={textRef} />;
}

export function DistribusiVerticalBarChart({
  data,
  totalLabel = 'Total Penerima',
  unitLabel = 'Orang',
}: {
  data: Distribusi[];
  totalLabel?: string;
  unitLabel?: string;
}) {
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
    <div className="flex flex-1 flex-col justify-between pt-2">
      {/* Area Batang Grafik Vertikal */}
      <div className="relative h-48 w-full px-4 sm:h-56 sm:px-8">
        {/* Garis grid pandu horizontal halus */}
        <div
          className="pointer-events-none absolute inset-0 flex flex-col justify-between"
          aria-hidden
        >
          <div className="border-b border-dashed border-slate-200" />
          <div className="border-b border-dashed border-slate-200" />
          <div className="border-b border-dashed border-slate-200" />
          <div />
        </div>

        {/* Kolom-kolom batang vertikal */}
        <div className="relative z-10 flex h-full items-end justify-around gap-4 sm:gap-8">
          {data.map((d, i) => {
            const persen = total > 0 ? Math.round((d.value / total) * 100) : 0;
            const warna =
              CHART_KATEGORI_COLORS[i % CHART_KATEGORI_COLORS.length];
            const tinggi = maks > 0 ? Math.max((d.value / maks) * 100, 10) : 0;

            return (
              <div
                key={d.label}
                className="group flex h-full max-w-[140px] flex-1 flex-col items-center justify-end"
              >
                {/* Nilai & Badge Persentase di Atas Batang */}
                <div
                  className="mb-2 flex flex-col items-center gap-1 transition-all duration-500 ease-out motion-reduce:transition-none"
                  style={{
                    opacity: terpasang ? 1 : 0,
                    transform: terpasang ? 'translateY(0)' : 'translateY(8px)',
                    transitionDelay: `${Math.min(i * 90 + 80, 400)}ms`,
                  }}
                >
                  <span className="text-base font-extrabold tabular-nums text-slate-900 sm:text-lg">
                    <BarItemCount value={d.value} />
                  </span>
                  <span className="shadow-2xs inline-flex min-w-[2.75rem] items-center justify-center rounded-md border-1 border-black bg-white px-1.5 py-0.5 text-2xs font-extrabold tabular-nums text-slate-900 sm:text-xs">
                    {total === 0 ? '—' : `${persen}%`}
                  </span>
                </div>

                {/* Batang Vertikal */}
                <div
                  className="duration-750 w-full max-w-[72px] rounded-t transition-all ease-out group-hover:brightness-105 motion-reduce:transition-none sm:max-w-[96px]"
                  style={{
                    height: terpasang ? `${tinggi}%` : '0%',
                    transitionDelay: `${Math.min(i * 90, 300)}ms`,
                    backgroundColor: warna,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Garis Sumbu X Tebal */}
      <div className="border-b-1 border-black" />

      {/* Label Kategori di Bawah Garis Sumbu */}
      <div className="flex items-center justify-around gap-4 px-4 pt-3 sm:gap-8 sm:px-8">
        {data.map((d, i) => {
          const warna = CHART_KATEGORI_COLORS[i % CHART_KATEGORI_COLORS.length];
          return (
            <div
              key={d.label}
              className="flex max-w-[140px] flex-1 items-center justify-center gap-1.5 sm:gap-2"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full border-1 border-black"
                style={{ backgroundColor: warna }}
                aria-hidden
              />
              <span className="truncate text-xs font-bold text-slate-900 sm:text-sm">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Ringkasan Akumulasi Bawah */}
      <div className="mt-3.5 flex items-center gap-1.5 text-xs text-slate-900 sm:text-sm">
        <span className="font-bold text-slate-900">{totalLabel}:</span>
        <span className="font-extrabold tabular-nums text-slate-900">
          {formatAngka(total)} {unitLabel}
        </span>
      </div>
    </div>
  );
}
