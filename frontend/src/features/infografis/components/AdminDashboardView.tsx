import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, History, PieChart, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { DistribusiBarChart } from '@/components/charts/DistribusiBarChart';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { StatCard } from '@/components/charts/StatCard';
import { STAT_WARGA } from '@/lib/stat-warga';
import type { StatWarga } from '@/lib/stat-warga';
import { paths } from '@/routes/paths';
import type { Distribusi } from '@/types/statistik';

interface AdminDashboardViewProps {
  namaPengurus: string;
  isLoading: boolean;
  isError: boolean;
  stats: StatWarga[] | undefined;
  distribusiUsia: Distribusi[] | undefined;
}

export function AdminDashboardView({
  namaPengurus: _namaPengurus,
  isLoading,
  isError,
  stats,
  distribusiUsia,
}: AdminDashboardViewProps) {
  return (
    <div>
      <QueryBoundary
        isLoading={isLoading}
        isError={isError}
        data={stats}
        errorMessage="Gagal memuat ringkasan data."
      >
        {(daftarStat) => (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
              {daftarStat.map((stat) => (
                <StatCard
                  key={stat.id}
                  value={stat.value}
                  {...STAT_WARGA[stat.id]}
                />
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="flex flex-col transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-black hover:shadow-md motion-reduce:hover:translate-y-0 lg:col-span-2">
                <CardHeader
                  title="Distribusi Usia"
                  action={
                    <Link to={paths.admin.infografis}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-2 text-xs sm:px-3 sm:text-sm"
                      >
                        Lihat semua{' '}
                        <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </Link>
                  }
                />
                <CardContent className="flex flex-1 flex-col justify-center p-4 sm:p-6">
                  <DistribusiBarChart data={distribusiUsia ?? []} />
                </CardContent>
              </Card>

              <Card className="flex flex-col transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-black hover:shadow-md motion-reduce:hover:translate-y-0">
                <CardHeader title="Akses Cepat" />
                <CardContent className="flex flex-1 flex-col justify-between gap-2.5 p-4 sm:p-5">
                  <Link to={paths.admin.penduduk} className="group block">
                    <div className="flex items-center justify-between rounded-lg border-1 border-black bg-white p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 shrink-0 text-purple-700" />
                        <p className="text-xs font-bold text-slate-900 sm:text-sm">
                          Penduduk
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-purple-700" />
                    </div>
                  </Link>

                  <Link to={paths.admin.infografis} className="group block">
                    <div className="flex items-center justify-between rounded-lg border-1 border-black bg-white p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm">
                      <div className="flex items-center gap-3">
                        <PieChart className="h-5 w-5 shrink-0 text-blue-700" />
                        <p className="text-xs font-bold text-slate-900 sm:text-sm">
                          Infografis
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-700" />
                    </div>
                  </Link>

                  <Link to={paths.statistik} className="group block">
                    <div className="flex items-center justify-between rounded-lg border-1 border-black bg-white p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="h-5 w-5 shrink-0 text-emerald-700" />
                        <p className="text-xs font-bold text-slate-900 sm:text-sm">
                          Statistik
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-emerald-700" />
                    </div>
                  </Link>

                  <Link to={paths.admin.riwayat} className="group block">
                    <div className="flex items-center justify-between rounded-lg border-1 border-black bg-white p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm">
                      <div className="flex items-center gap-3">
                        <History className="h-5 w-5 shrink-0 text-amber-700" />
                        <p className="text-xs font-bold text-slate-900 sm:text-sm">
                          Riwayat
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-amber-700" />
                    </div>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
