import { useStatistikPublik } from '../hooks/use-statistik-publik';
import { toRingkasanStatistik } from '../view-model';
import { StatistikPanelView } from './StatistikPanelView';

export function StatistikPanel({
  onPilihRw,
  periode,
}: {
  onPilihRw: (rw: string) => void;

  periode: string;
}) {
  const { data, isLoading, isError } = useStatistikPublik(periode);

  return (
    <StatistikPanelView
      isLoading={isLoading}
      isError={isError}
      ringkasan={data && toRingkasanStatistik(data)}
      onPilihRw={onPilihRw}
    />
  );
}
