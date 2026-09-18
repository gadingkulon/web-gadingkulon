import { PanelDistribusiCard } from '@/components/charts/PanelDistribusiCard';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { StatCard } from '@/components/charts/StatCard';
import { useStatistikPublik } from '@/features/statistik-publik/hooks/use-statistik-publik';
import { STAT_WARGA } from '@/lib/stat-warga';
import { cn } from '@/lib/utils';
import { toRincianRw } from './view-model';

export function RincianRwPanel({
  rw,
  rt,
  periode,
}: {
  rw: string;

  rt: string | null;

  periode: string;
}) {
  const { data, isLoading, isError } = useStatistikPublik(periode);
  const cocokWil = (target: string, query: string) => {
    if (target.toLowerCase() === query.toLowerCase()) return true;
    const tNum = target.replace(/\D+/g, '').replace(/^0+/, '');
    const qNum = query.replace(/\D+/g, '').replace(/^0+/, '');
    return Boolean(tNum && tNum === qNum);
  };
  const indukRw = data?.perRw.find((r) => cocokWil(r.label, rw));
  const rincian =
    rt === null ? indukRw : indukRw?.perRt.find((r) => cocokWil(r.label, rt));

  return (
    <div className="w-full">
      <QueryBoundary
        isLoading={isLoading}
        isError={isError}

        data={data ? (rincian ? toRincianRw(rincian) : null) : undefined}
        loadingLabel="Memuat statistik"
        errorMessage="Statistik belum bisa ditampilkan. Anda tetap bisa masuk."
        emptyTitle={`${rt ?? rw} tidak ditemukan`}
        emptyDescription="Kembali ke daftar semua RW."
      >
        {(vm) => (
          <div className="space-y-6">
            <div
              data-apple-fade
              className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4"
            >
              {vm.stat.map((stat) => (
                <StatCard
                  key={stat.id}
                  value={stat.value}
                  {...STAT_WARGA[stat.id]}
                />
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              {vm.panels.map((panel, idx) => (
                <div
                  key={panel.id}
                  data-apple-fade
                  data-apple-delay={idx + 2}
                  className={cn('h-full', panel.lebarPenuh && 'xl:col-span-2')}
                >
                  <PanelDistribusiCard panel={panel} />
                </div>
              ))}
            </div>
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
