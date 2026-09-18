import { PanelDistribusiCard } from '@/components/charts/PanelDistribusiCard';
import ikonKeluarga from '@/assets/icons/keluarga.png';
import ikonLakiLaki from '@/assets/icons/laki-laki.png';
import ikonPenduduk from '@/assets/icons/penduduk.png';
import ikonPerempuan from '@/assets/icons/perempuan.png';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { StatCard } from '@/components/charts/StatCard';
import { useStatistikPublik } from '@/features/statistik-publik/hooks/use-statistik-publik';
import { usePadukuhan } from '@/hooks/use-padukuhan';
import { cn, formatAngka } from '@/lib/utils';
import { toPanelDemografi } from './view-model';
import { WADAH } from '@/components/layout/wadah';

export default function InfografisPublikPage() {
  const padukuhan = usePadukuhan();
  const { data, isLoading, isError } = useStatistikPublik();

  return (
    <div className="flex flex-col">
      <section className="bg-brand-950 py-8 text-white sm:py-12 lg:py-14">
        <div className={WADAH}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300 sm:text-sm">
            Infografis
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:mt-3 sm:text-3xl lg:text-4xl">
            Data {padukuhan.namaLengkap}
          </h1>
        </div>
      </section>

      <section className={`${WADAH} py-8 sm:py-10`}>
        <QueryBoundary
          isLoading={isLoading}
          isError={isError}
          data={data}
          loadingLabel="Memuat infografis"
          errorMessage="Infografis belum bisa ditampilkan."
        >
          {(statistik) => (
            <div className="space-y-6">
              <div
                data-apple-fade
                className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4"
              >
                <StatCard
                  label="Total Penduduk"
                  value={formatAngka(statistik.totalPenduduk)}
                  icon={ikonPenduduk}
                />
                <StatCard
                  label="Jumlah Kartu Keluarga"
                  value={formatAngka(statistik.totalKepalaKeluarga)}
                  icon={ikonKeluarga}
                />
                <StatCard
                  label="Laki-laki"
                  value={formatAngka(statistik.totalLakiLaki)}
                  icon={ikonLakiLaki}
                />
                <StatCard
                  label="Perempuan"
                  value={formatAngka(statistik.totalPerempuan)}
                  icon={ikonPerempuan}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {toPanelDemografi(statistik).map((panel, idx) => (
                  <div
                    key={panel.id}
                    data-apple-fade
                    data-apple-delay={idx + 1}
                    className={cn(
                      'flex h-full flex-col',
                      panel.lebarPenuh && 'lg:col-span-2',
                    )}
                  >
                    <PanelDistribusiCard panel={panel} className="h-full" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </QueryBoundary>
      </section>
    </div>
  );
}
