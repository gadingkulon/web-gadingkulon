import { Link } from 'react-router-dom';
import { WADAH } from '@/components/layout/wadah';
import { buttonClass } from '@/components/ui/button-class';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { BeritaCard } from '@/features/berita/components/BeritaCard';
import { useBeritaList } from '@/features/berita/hooks/use-berita';
import { paths } from '@/routes/paths';
import { JudulBagian } from './JudulBagian';

const CACAH_TAMPIL = 3;

export function BeritaTerkini() {
  const berita = useBeritaList();

  return (
    <section className="border-t-1 border-black bg-surface py-10 sm:py-16">
      <div className={WADAH}>
        <div data-apple-fade>
          <JudulBagian
            judul="BERITA TERKINI"
            className="uppercase"
            aksi={
              <Link
                to={paths.berita}
                className={buttonClass({
                  variant: 'primary',
                  className: 'hidden sm:inline-flex',
                })}
              >
                Lihat Semua Berita
              </Link>
            }
          />
        </div>

        <QueryBoundary
          isLoading={berita.isLoading}
          isError={berita.isError}
          data={berita.data}
          isEmpty={(d) => d.length === 0}
          loadingLabel="Memuat berita"
          errorMessage="Berita belum bisa ditampilkan."
          emptyTitle="Belum ada berita"
          emptyDescription="Kabar kegiatan padukuhan akan muncul di sini."
        >
          {(daftar) => (
            <>
              <div className="grid gap-6 md:grid-cols-3">
                {daftar.slice(0, CACAH_TAMPIL).map((b, idx) => (
                  <div
                    key={b.id}
                    data-apple-fade
                    data-apple-delay={idx + 1}
                    className="flex h-full flex-col"
                  >
                    <BeritaCard berita={b} />
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex justify-end sm:hidden">
                <Link
                  to={paths.berita}
                  className={buttonClass({ variant: 'primary' })}
                >
                  Lihat Semua Berita
                </Link>
              </div>
            </>
          )}
        </QueryBoundary>
      </div>
    </section>
  );
}
