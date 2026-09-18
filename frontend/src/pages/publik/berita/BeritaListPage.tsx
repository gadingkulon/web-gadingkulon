import { useState } from 'react';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { GridBeritaSkeleton } from '@/components/ui/Skeleton';
import { BeritaCard } from '@/features/berita/components/BeritaCard';
import { useBeritaList } from '@/features/berita/hooks/use-berita';
import { WADAH } from '@/components/layout/wadah';

const PER_HALAMAN = 6;

function getDaftarHalaman(
  totalHalaman: number,
  halamanAktif: number,
): (number | string)[] {
  if (totalHalaman <= 7) {
    return Array.from({ length: totalHalaman }, (_, i) => i + 1);
  }

  if (halamanAktif <= 4) {
    return [1, 2, 3, 4, 5, '...', totalHalaman];
  }

  if (halamanAktif >= totalHalaman - 3) {
    return [
      1,
      '...',
      totalHalaman - 4,
      totalHalaman - 3,
      totalHalaman - 2,
      totalHalaman - 1,
      totalHalaman,
    ];
  }

  return [
    1,
    '...',
    halamanAktif - 1,
    halamanAktif,
    halamanAktif + 1,
    '...',
    totalHalaman,
  ];
}

export default function BeritaListPage() {
  const { data, isLoading, isError } = useBeritaList();
  const [halaman, setHalaman] = useState(1);

  return (
    <div className="flex flex-col">
      <section className="bg-brand-950 py-8 text-white sm:py-12 lg:py-14">
        <div className={WADAH}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300 sm:text-sm">
            Berita
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:mt-3 sm:text-3xl lg:text-4xl">
            Kabar & Kegiatan Warga
          </h1>
        </div>
      </section>

      <section className={`${WADAH} py-8 sm:py-12`}>
        <QueryBoundary
          isLoading={isLoading}
          isError={isError}
          data={data}
          loadingFallback={<GridBeritaSkeleton />}
          isEmpty={(d) => d.length === 0}
          loadingLabel="Memuat berita"
          errorMessage="Berita belum bisa ditampilkan."
          emptyTitle="Belum ada berita"
          emptyDescription="Kabar kegiatan padukuhan akan muncul di sini."
        >
          {(daftar) => {
            const totalHalaman = Math.ceil(daftar.length / PER_HALAMAN);
            const halamanAktif = Math.min(halaman, Math.max(1, totalHalaman));
            const awal = (halamanAktif - 1) * PER_HALAMAN;
            const daftarTampil = daftar.slice(awal, awal + PER_HALAMAN);

            return (
              <div className="flex flex-col gap-8">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {daftarTampil.map((b, idx) => (
                    <div
                      key={b.id}
                      data-apple-fade
                      data-apple-delay={Math.min(idx + 1, 4)}
                    >
                      <BeritaCard berita={b} />
                    </div>
                  ))}
                </div>

                {totalHalaman > 1 && (
                  <div className="flex items-center justify-center border-t-1 border-black pt-6">
                    <nav
                      aria-label="Paginasi berita"
                      className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2"
                    >
                      <button
                        type="button"
                        onClick={() => setHalaman((h) => Math.max(1, h - 1))}
                        disabled={halamanAktif === 1}
                        className="h-9 rounded-lg border-1 border-black px-3 text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3.5 sm:text-sm"
                      >
                        Sebelumnya
                      </button>

                      {getDaftarHalaman(totalHalaman, halamanAktif).map(
                        (item, idx) => {
                          if (typeof item === 'string') {
                            return (
                              <span
                                key={`ellipsis-${idx}`}
                                className="select-none px-1.5 text-sm font-bold text-slate-700 sm:px-2"
                              >
                                …
                              </span>
                            );
                          }

                          const aktif = item === halamanAktif;
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => setHalaman(item)}
                              aria-current={aktif ? 'page' : undefined}
                              className={`h-9 min-w-[36px] rounded-lg px-3 text-xs font-semibold transition-colors sm:text-sm ${
                                aktif
                                  ? 'bg-brand-600 font-bold text-white shadow-sm'
                                  : 'border-1 border-black text-slate-900 hover:bg-slate-50'
                              }`}
                            >
                              {item}
                            </button>
                          );
                        },
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setHalaman((h) => Math.min(totalHalaman, h + 1))
                        }
                        disabled={halamanAktif === totalHalaman}
                        className="h-9 rounded-lg border-1 border-black px-3 text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3.5 sm:text-sm"
                      >
                        Selanjutnya
                      </button>
                    </nav>
                  </div>
                )}
              </div>
            );
          }}
        </QueryBoundary>
      </section>
    </div>
  );
}
