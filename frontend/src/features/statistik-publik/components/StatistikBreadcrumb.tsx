import { toJalurWilayah } from '../view-model';

interface StatistikBreadcrumbProps {
  rwAktif: string | null;

  rtAktif: string | null;
  onPilih: (rw: string | null, rt?: string | null) => void;
}

export function StatistikBreadcrumb({
  rwAktif,
  rtAktif,
  onPilih,
}: StatistikBreadcrumbProps) {
  const jalur = toJalurWilayah(rwAktif, rtAktif);

  return (
    <nav aria-label="Jalur wilayah">
      <ol className="flex flex-wrap items-center text-sm sm:text-base">
        {jalur.map(({ label, tujuan }, i) => (
          <li key={label} className="flex items-center">
            {i > 0 && (
              <span className="px-1.5 text-slate-900 sm:px-2" aria-hidden>
                /
              </span>
            )}
            {tujuan === null ? (
              <span
                aria-current="page"
                className="font-semibold text-slate-900"
              >
                {label}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onPilih(tujuan.rw, tujuan.rt)}
                className="font-medium text-slate-900 transition-colors hover:text-brand-700"
              >
                {label}
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
