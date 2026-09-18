import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import ikonLakiLaki from '@/assets/icons/laki-laki.png';
import ikonPerempuan from '@/assets/icons/perempuan.png';
import { cn } from '@/lib/utils';

interface ProporsiGenderBarProps {
  totalLakiLaki: number;
  totalPerempuan: number;
  totalPenduduk?: number;
  className?: string;
}

function IkonMars({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="10" cy="14" r="5" />
      <path d="M19 5l-5.4 5.4" />
      <path d="M19 5h-5" />
      <path d="M19 5v5" />
    </svg>
  );
}

function IkonVenus({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="9" r="5" />
      <path d="M12 14v7" />
      <path d="M9 18h6" />
    </svg>
  );
}

export function ProporsiGenderBar({
  totalLakiLaki,
  totalPerempuan,
  className = '',
}: ProporsiGenderBarProps) {
  const { persenLaki, persenPerempuan, rasioJenisKelamin } = useMemo(() => {
    const total = totalLakiLaki + totalPerempuan;
    if (!total || total <= 0) {
      return { persenLaki: 0, persenPerempuan: 0, rasioJenisKelamin: '-' };
    }
    const pLaki = Math.round((totalLakiLaki / total) * 100);
    const pPerempuan = 100 - pLaki;
    const rasio =
      totalPerempuan > 0
        ? ((totalLakiLaki / totalPerempuan) * 100).toFixed(1)
        : '-';

    return {
      persenLaki: pLaki,
      persenPerempuan: pPerempuan,
      rasioJenisKelamin: rasio,
    };
  }, [totalLakiLaki, totalPerempuan]);

  return (
    <Card
      className={cn(
        'p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-black hover:shadow-md motion-reduce:hover:translate-y-0 sm:p-5',
        className,
      )}
    >
      <div className="flex flex-col gap-3.5">
        {/* Baris Keterangan Atas dengan Ikon (Hanya Label) */}
        <div className="flex items-center justify-between gap-4">
          {/* Sisi Laki-laki */}
          <div className="flex items-center gap-2">
            <img
              src={ikonLakiLaki}
              alt=""
              width={28}
              height={28}
              className="h-6 w-6 shrink-0 object-contain sm:h-7 sm:w-7"
            />
            <span className="text-xs font-bold text-slate-800 sm:text-sm">
              Laki-laki
            </span>
          </div>

          {/* Sisi Perempuan */}
          <div className="flex items-center justify-end gap-2 text-right">
            <span className="text-xs font-bold text-slate-800 sm:text-sm">
              Perempuan
            </span>
            <img
              src={ikonPerempuan}
              alt=""
              width={28}
              height={28}
              className="h-6 w-6 shrink-0 object-contain sm:h-7 sm:w-7"
            />
          </div>
        </div>

        {/* Stacked Horizontal Bar Tegas Kotak dengan sudut rounded-md di tiap sisi */}
        <div className="flex h-9 w-full overflow-hidden rounded-md border-1 border-black bg-slate-100 sm:h-10">
          {persenLaki > 0 && (
            <div
              style={{ width: `${persenLaki}%` }}
              className={cn(
                'flex h-full min-w-0 items-center justify-between overflow-hidden bg-brand-600 px-2.5 text-white transition-all duration-700 ease-out sm:px-3.5',
                persenPerempuan > 0 && 'border-r-2 border-white',
              )}
              title={`Laki-laki: ${persenLaki}%`}
            >
              <div className="flex min-w-0 items-center gap-1.5">
                <IkonMars className="h-4 w-4 shrink-0" />
                <span className="hidden truncate text-xs font-bold sm:inline">
                  Laki-laki
                </span>
              </div>
              <span className="shrink-0 text-xs font-extrabold tabular-nums sm:text-sm">
                {persenLaki}%
              </span>
            </div>
          )}
          {persenPerempuan > 0 && (
            <div
              style={{ width: `${persenPerempuan}%` }}
              className="flex h-full min-w-0 items-center justify-between overflow-hidden bg-rose-600 px-2.5 text-white transition-all duration-700 ease-out sm:px-3.5"
              title={`Perempuan: ${persenPerempuan}%`}
            >
              <span className="shrink-0 text-xs font-extrabold tabular-nums sm:text-sm">
                {persenPerempuan}%
              </span>
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="hidden truncate text-xs font-bold sm:inline">
                  Perempuan
                </span>
                <IkonVenus className="h-4 w-4 shrink-0" />
              </div>
            </div>
          )}
        </div>

        {/* Indikator Rasio Jenis Kelamin (Pindah ke Sisi Kiri, Total Jiwa Dihapus) */}
        <div className="flex items-center border-t-1 border-black pt-2.5 text-xs font-semibold text-slate-700">
          <span title="Perbandingan jumlah laki-laki per 100 perempuan">
            Rasio Jenis Kelamin:{' '}
            <span className="font-bold text-slate-900">
              {rasioJenisKelamin}
            </span>
          </span>
        </div>
      </div>
    </Card>
  );
}
