import { cn } from '@/lib/utils';
import type { PanelDistribusi } from '@/types/statistik';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { DistribusiBarChart } from './DistribusiBarChart';
import { DistribusiPieChart } from './DistribusiPieChart';
import { DistribusiVerticalBarChart } from './DistribusiVerticalBarChart';

export function PanelDistribusiCard({
  panel,
  className,
}: {
  panel: PanelDistribusi;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        'flex h-full flex-col transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-black hover:shadow-md motion-reduce:hover:translate-y-0',
        panel.lebarPenuh && 'lg:col-span-2',
        className,
      )}
    >
      <CardHeader title={panel.judul} description={panel.deskripsi} />
      <CardContent className="flex flex-1 flex-col justify-center">
        {panel.jenis === 'pie' ? (
          <DistribusiPieChart data={panel.data} />
        ) : panel.jenis === 'bar-vertical' ? (
          <DistribusiVerticalBarChart data={panel.data} />
        ) : (
          <DistribusiBarChart data={panel.data} />
        )}
      </CardContent>
    </Card>
  );
}
