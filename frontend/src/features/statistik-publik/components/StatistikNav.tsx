import { useState } from 'react';
import { CalendarDays, ChevronRight } from 'lucide-react';
import ikonDashboard from '@/assets/icons/dashboard.png';
import ikonRw from '@/assets/icons/rw-icon.png';
import { cn } from '@/lib/utils';
import { daftarPeriode, labelPeriode } from '@/lib/tanggal';
import { useStatistikPublik } from '../hooks/use-statistik-publik';

interface StatistikNavProps {
  rwAktif: string | null;

  rtAktif: string | null;
  onPilih: (rw: string | null, rt?: string | null) => void;

  periode: string;
  onPilihPeriode: (periode: string) => void;
}

function itemClass(aktif: boolean) {
  return cn(
    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-base transition-colors',
    aktif
      ? 'font-bold text-brand-600'
      : 'font-medium text-slate-900 hover:bg-slate-100 hover:text-brand-600',
  );
}

export function StatistikNav({
  rwAktif,
  rtAktif,
  onPilih,
  periode,
  onPilihPeriode,
}: StatistikNavProps) {
  const { data, isError } = useStatistikPublik(periode);
  const [terbukaRw, setTerbukaRw] = useState<Record<string, boolean>>({});

  const toggleRw = (label: string) => {
    setTerbukaRw((prev) => {
      const isCurrentlyOpen = prev[label] ?? rwAktif === label;
      return { ...prev, [label]: !isCurrentlyOpen };
    });
  };

  return (
    <nav aria-label="Bagian statistik" className="space-y-7">
      <button
        type="button"
        onClick={() => onPilih(null)}
        aria-current={rwAktif === null ? 'page' : undefined}
        className={itemClass(rwAktif === null)}
      >
        <img src={ikonDashboard} alt="" className="h-5 w-5 shrink-0" />
        Dashboard
      </button>

      <div>
        <p className="px-3 text-sm font-semibold uppercase tracking-widest text-slate-900">
          Periode
        </p>
        <div className="mt-2 flex items-center gap-3 px-3">
          <CalendarDays
            className="h-5 w-5 shrink-0 text-brand-600"
            aria-hidden
          />
          <select
            value={periode}
            onChange={(e) => onPilihPeriode(e.target.value)}
            aria-label="Periode data"
            className="w-full cursor-pointer rounded-lg border-1 border-black bg-surface px-3 py-2 text-base font-medium text-slate-900 outline-none transition-colors hover:border-black focus:border-black focus:ring-0"
          >
            {daftarPeriode(data?.periodeTerawal ?? periode, periode).map(
              (p) => (
                <option key={p} value={p} className="bg-surface text-slate-900">
                  {labelPeriode(p)}
                </option>
              ),
            )}
          </select>
        </div>
      </div>

      <div>
        <p className="px-3 text-sm font-semibold uppercase tracking-widest text-slate-900">
          Statistik
        </p>

        {data ? (
          <ul className="mt-2 space-y-1">
            {data.perRw.map((rw) => {
              const isRwAktif = rwAktif === rw.label;
              const isOnlyRwAktif = isRwAktif && rtAktif === null;
              const hasRt = rw.perRt.length > 0;
              const isExpanded = hasRt && (terbukaRw[rw.label] ?? isRwAktif);

              return (
                <li key={rw.label}>
                  <div
                    className={cn(
                      'group flex w-full items-center rounded-lg transition-colors',
                      isOnlyRwAktif
                        ? 'font-bold text-brand-600'
                        : isRwAktif
                          ? 'font-bold text-brand-600 hover:bg-slate-100'
                          : 'font-medium text-slate-900 hover:bg-slate-100 hover:text-brand-600',
                    )}
                  >
                    {hasRt ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRw(rw.label);
                        }}
                        aria-label={
                          isExpanded
                            ? `Tutup daftar ${rw.label}`
                            : `Buka daftar ${rw.label}`
                        }
                        className="hover:scale-115 flex h-10 w-7 shrink-0 items-center justify-center pl-2 transition-transform focus-visible:outline-none active:scale-95"
                      >
                        <ChevronRight
                          strokeWidth={3}
                          className={cn(
                            'h-5 w-5 shrink-0 transition-all duration-200 ease-out',
                            isRwAktif
                              ? 'text-brand-600'
                              : 'text-slate-700 group-hover:text-brand-600',
                            isExpanded && 'rotate-90',
                          )}
                          aria-hidden="true"
                        />
                      </button>
                    ) : (
                      <span className="w-7 shrink-0" />
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onPilih(rw.label);
                        if (!isExpanded) {
                          setTerbukaRw((prev) => ({
                            ...prev,
                            [rw.label]: true,
                          }));
                        }
                      }}
                      aria-current={isOnlyRwAktif ? 'page' : undefined}
                      className={cn(
                        'flex flex-1 items-center gap-2.5 py-2.5 pr-3 text-left text-base text-inherit transition-colors',
                        !hasRt && 'pl-3',
                      )}
                    >
                      <img src={ikonRw} alt="" className="h-5 w-5 shrink-0" />
                      <span className="flex-1 text-left">{rw.label}</span>
                    </button>
                  </div>

                  {hasRt && isExpanded && (
                    <ul className="ml-8 mt-1 space-y-1">
                      {rw.perRt.map((rt) => {
                        const aktif =
                          rwAktif === rw.label && rtAktif === rt.label;
                        return (
                          <li key={rt.label}>
                            <button
                              type="button"
                              onClick={() => onPilih(rw.label, rt.label)}
                              aria-current={aktif ? 'page' : undefined}
                              className={cn(itemClass(aktif), 'py-2 text-sm')}
                            >
                              <span
                                aria-hidden
                                className="ml-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-50"
                              />
                              <span className="flex-1 text-left">
                                {rt.label}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 rounded-lg border-1 border-dashed border-black px-3 py-3 text-xs leading-relaxed text-slate-400">
            {isError
              ? 'Rincian per RW belum bisa dimuat.'
              : 'Memuat rincian per RW…'}
          </p>
        )}
      </div>
    </nav>
  );
}
