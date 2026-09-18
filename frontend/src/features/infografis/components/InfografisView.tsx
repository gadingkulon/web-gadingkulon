import { PanelDistribusiCard } from '@/components/charts/PanelDistribusiCard';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import type { PanelDistribusi } from '@/types/statistik';

interface InfografisViewProps {
  isLoading: boolean;
  isError: boolean;
  panels: PanelDistribusi[] | undefined;

  wilayah: string;
}

export function InfografisView({
  isLoading,
  isError,
  panels,
  wilayah: _wilayah,
}: InfografisViewProps) {
  return (
    <div>
      <QueryBoundary
        isLoading={isLoading}
        isError={isError}
        data={panels}
        errorMessage="Gagal memuat data infografis."
      >
        {(daftar) => (
          <div className="grid gap-6 lg:grid-cols-2">
            {daftar.map((panel) => (
              <PanelDistribusiCard key={panel.id} panel={panel} />
            ))}
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
