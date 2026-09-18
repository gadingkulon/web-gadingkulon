import { useMemo } from 'react';
import { toStatWarga } from '@/lib/stat-warga';
import { useInfografis } from '../hooks/use-infografis';
import { AdminDashboardView } from './AdminDashboardView';

interface AdminDashboardProps {
  namaPengurus: string;
}

export function AdminDashboard({ namaPengurus }: AdminDashboardProps) {
  const { data, isLoading, isError } = useInfografis();

  const stats = useMemo(() => (data ? toStatWarga(data) : undefined), [data]);

  return (
    <AdminDashboardView
      namaPengurus={namaPengurus}
      isLoading={isLoading}
      isError={isError}
      stats={stats}
      distribusiUsia={data?.perKelompokUmur}
    />
  );
}
