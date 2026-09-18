import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { WADAH } from '@/components/layout/wadah';
import ikonKeluarga from '@/assets/icons/keluarga.png';
import ikonLakiLaki from '@/assets/icons/laki-laki.png';
import ikonPenduduk from '@/assets/icons/penduduk.png';
import ikonPerempuan from '@/assets/icons/perempuan.png';
import { ProporsiGenderBar } from '@/components/charts/ProporsiGenderBar';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { GridStatSkeleton } from '@/components/ui/Skeleton';
import { StatCard } from '@/components/charts/StatCard';
import { useStatistikPublik } from '@/features/statistik-publik/hooks/use-statistik-publik';
import petaSatelit from '@/assets/BG-padding/Bg-padding.jpg';
import { formatAngka } from '@/lib/utils';
import { paths } from '@/routes/paths';
import { JudulBagian } from './JudulBagian';

export function RingkasanPenduduk() {
  const statistik = useStatistikPublik();

  return (
    <section className="border-y-1 border-black bg-surface py-10 sm:py-16">
      <div className={WADAH}>
        <div data-apple-fade>
          <JudulBagian judul="ADMINISTRASI PENDUDUK" className="uppercase" />
        </div>

        <QueryBoundary
          isLoading={statistik.isLoading}
          isError={statistik.isError}
          data={statistik.data}
          loadingFallback={<GridStatSkeleton />}
          loadingLabel="Memuat ringkasan penduduk"
          errorMessage="Ringkasan penduduk belum bisa ditampilkan."
        >
          {(data) => (
            <>
              <div
                data-apple-fade
                className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4"
              >
                <StatCard
                  label="Total Penduduk"
                  value={formatAngka(data.totalPenduduk)}
                  icon={ikonPenduduk}
                />
                <StatCard
                  label="Jumlah Kartu Keluarga"
                  value={formatAngka(data.totalKepalaKeluarga)}
                  icon={ikonKeluarga}
                />
                <StatCard
                  label="Laki-laki"
                  value={formatAngka(data.totalLakiLaki)}
                  icon={ikonLakiLaki}
                />
                <StatCard
                  label="Perempuan"
                  value={formatAngka(data.totalPerempuan)}
                  icon={ikonPerempuan}
                />
              </div>

              {/* Bilah Proporsi Gender Visual */}
              <div data-apple-fade className="mt-2.5 sm:mt-4">
                <ProporsiGenderBar
                  totalLakiLaki={data.totalLakiLaki}
                  totalPerempuan={data.totalPerempuan}
                  totalPenduduk={data.totalPenduduk}
                />
              </div>

              <div data-apple-fade className="mt-8">
                <div className="group relative overflow-hidden rounded-xl border-1 border-black bg-gradient-to-br from-[#2E1065] via-[#3B1280] to-[#1E0A45] p-5 text-white shadow-xl shadow-purple-950/20 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-950/40 motion-reduce:hover:translate-y-0 sm:p-8 lg:p-10">
                  {/* Latar peta satelit monokrom halus */}
                  <img
                    src={petaSatelit}
                    alt=""
                    aria-hidden="true"
                    width={900}
                    height={443}
                    loading="lazy"
                    decoding="async"
                    className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-luminosity transition-transform duration-500 ease-out group-hover:scale-105"
                  />

                  {/* Ambient glow accent */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl transition-all duration-500 group-hover:scale-125 group-hover:bg-brand-500/30"
                  />

                  <div className="relative z-10 flex flex-col items-center gap-6 lg:flex-row lg:justify-between">
                    <div className="max-w-lg text-center lg:text-left">
                      <h3 className="text-xl font-bold leading-snug tracking-tight sm:text-2xl lg:text-3xl">
                        Eksplorasi Data Kependudukan
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-purple-200/90 sm:text-sm">
                        Visualisasi data demografi terpadu hingga tingkat RT
                        secara transparan, terbuka, dan akurat.
                      </p>
                    </div>

                    <Link
                      to={paths.statistik}
                      className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#FACC15] px-6 py-3 text-center text-sm font-bold text-[#4C1D95] shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-yellow-400 hover:shadow-xl active:scale-[0.98] sm:w-auto"
                    >
                      <span>Jelajahi Statistik</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </QueryBoundary>
      </div>
    </section>
  );
}
