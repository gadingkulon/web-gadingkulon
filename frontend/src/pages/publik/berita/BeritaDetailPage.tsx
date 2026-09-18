import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, UserRound } from 'lucide-react';
import { buttonClass } from '@/components/ui/button-class';
import { Card, CardHeader } from '@/components/ui/Card';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import {
  BeritaBarisRingkas,
  FotoBerita,
} from '@/features/berita/components/BeritaCard';
import { useBerita, useBeritaList } from '@/features/berita/hooks/use-berita';
import { formatTanggal } from '@/lib/tanggal';
import { paths } from '@/routes/paths';
import { WADAH } from '@/components/layout/wadah';

const JUMLAH_TERKINI = 5;

export default function BeritaDetailPage() {
  const { slug = '' } = useParams();
  const { data, isLoading, isError } = useBerita(slug);
  const daftar = useBeritaList();

  const terkini = (daftar.data ?? [])
    .filter((b) => b.slug !== slug)
    .slice(0, JUMLAH_TERKINI);

  return (
    <div className={`${WADAH} py-6 sm:py-10`}>
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
        <article className="min-w-0">
          <QueryBoundary
            isLoading={isLoading}
            isError={isError}
            data={data}
            loadingLabel="Memuat berita"
            errorMessage="Berita belum bisa ditampilkan."
            emptyTitle="Berita tidak ditemukan"
            emptyDescription="Tautannya mungkin sudah berubah karena judulnya disunting."
          >
            {(berita) => (
              <>
                <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl lg:text-4xl">
                  {berita.judul}
                </h1>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-900 sm:mt-4 sm:gap-x-6 sm:gap-y-2 sm:text-sm">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900 sm:gap-2">
                    <CalendarDays
                      className="h-3.5 w-3.5 text-slate-900 sm:h-4 sm:w-4"
                      aria-hidden
                    />
                    {formatTanggal(berita.tanggalTerbit)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900 sm:gap-2">
                    <UserRound
                      className="h-3.5 w-3.5 text-slate-900 sm:h-4 sm:w-4"
                      aria-hidden
                    />
                    {berita.penulis}
                  </span>
                </div>

                <div data-apple-fade>
                  <FotoBerita
                    berita={berita}
                    className="mt-6 aspect-[16/9] w-full rounded-xl object-cover sm:aspect-auto sm:h-96"
                  />
                </div>

                <div
                  data-apple-fade
                  className="isi-berita mt-8 overflow-hidden break-words text-base text-slate-900"
                  dangerouslySetInnerHTML={{ __html: berita.isi }}
                />
              </>
            )}
          </QueryBoundary>

          <div
            data-apple-fade
            className="mt-10 flex flex-wrap gap-3 border-t-1 border-black pt-6"
          >
            <Link
              to={paths.berita}
              className={buttonClass({ variant: 'outline' })}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Kembali ke Berita
            </Link>
          </div>
        </article>

        {terkini.length > 0 && (
          <aside data-apple-fade className="lg:sticky lg:top-24 lg:h-fit">
            <Card>
              <CardHeader title="Berita Terkini" />
              <div className="space-y-1 p-3">
                {terkini.map((b) => (
                  <BeritaBarisRingkas key={b.id} berita={b} />
                ))}
              </div>
            </Card>
          </aside>
        )}
      </div>
    </div>
  );
}
