import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { DistribusiPieChart } from '@/components/charts/DistribusiPieChart';
import { DistribusiVerticalBarChart } from '@/components/charts/DistribusiVerticalBarChart';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { StatCard } from '@/components/charts/StatCard';
import { CHART_KATEGORI_COLORS } from '@/lib/colors';
import { STAT_WARGA } from '@/lib/stat-warga';
import { formatAngka } from '@/lib/utils';
import type { RingkasanStatistik } from '../view-model';
import { CountUp } from './CountUp';

interface StatistikPanelViewProps {
  isLoading: boolean;
  isError: boolean;
  ringkasan: RingkasanStatistik | undefined;
  onPilihRw: (rw: string) => void;
}

function RwVerticalBarChart({
  data,
  onPilihRw,
}: {
  data: RingkasanStatistik;
  onPilihRw: (rw: string) => void;
}) {
  const [terpasang, setTerpasang] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTerpasang(true);
    }, 60);
    return () => clearTimeout(timer);
  }, [data]);

  const maks = useMemo(
    () => Math.max(...data.distribusi.map((d) => d.value), 1),
    [data.distribusi],
  );

  return (
    <div className="flex flex-1 flex-col justify-center px-2 py-4">
      {/* Area Batang Grafik */}
      <div className="relative h-52 w-full border-b-1 border-black px-4 sm:h-60">
        {/* Garis grid pandu horizontal halus */}
        <div
          className="pointer-events-none absolute inset-0 flex flex-col justify-between"
          aria-hidden
        >
          <div className="border-b border-dashed border-slate-200" />
          <div className="border-b border-dashed border-slate-200" />
          <div className="border-b border-dashed border-slate-200" />
          <div />
        </div>

        <div className="relative z-10 grid h-full grid-cols-3 items-end">
          {data.distribusi.map((item, i) => {
            const warna =
              CHART_KATEGORI_COLORS[i % CHART_KATEGORI_COLORS.length];
            const tinggi =
              maks > 0 ? Math.max((item.value / maks) * 100, 6) : 0;

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => onPilihRw(item.label)}
                className="group flex h-full cursor-pointer flex-col items-center justify-end"
                title={`${item.label}: ${formatAngka(item.value)} jiwa`}
              >
                {/* Nilai di atas batang */}
                <span className="mb-2 text-xs font-bold tabular-nums text-slate-900 transition-transform duration-200 group-hover:-translate-y-0.5 sm:text-sm">
                  {formatAngka(item.value)}
                </span>

                {/* Batang grafik berdiri langsung di atas garis sumbu tanpa fill padding */}
                <div
                  className="duration-750 w-10 rounded-t-md transition-all ease-out group-hover:brightness-110 motion-reduce:transition-none sm:w-14"
                  style={{
                    height: terpasang ? `${tinggi}%` : '0%',
                    transitionDelay: `${Math.min(i * 90, 300)}ms`,
                    backgroundColor: warna,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Label Sumbu X (Nama RW) di bawah garis sumbu */}
      <div className="grid w-full grid-cols-3 px-4 pt-3.5">
        {data.distribusi.map((item, i) => {
          const warna = CHART_KATEGORI_COLORS[i % CHART_KATEGORI_COLORS.length];
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onPilihRw(item.label)}
              className="group flex cursor-pointer items-center justify-center gap-1.5 text-xs font-bold text-slate-700 transition-colors hover:text-slate-950 sm:text-sm"
              title={`Pilih ${item.label}`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: warna }}
                aria-hidden
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function StatistikPanelView({
  isLoading,
  isError,
  ringkasan,
  onPilihRw,
}: StatistikPanelViewProps) {
  return (
    <QueryBoundary
      isLoading={isLoading}
      isError={isError}
      data={ringkasan}
      loadingLabel="Memuat statistik"
      errorMessage="Statistik belum bisa ditampilkan. Anda tetap bisa masuk."
    >
      {(data) => (
        <div className="space-y-6">
          <div className="grid items-stretch gap-6 lg:grid-cols-2">
            <div data-apple-fade className="h-full">
              <Card className="flex h-full flex-col transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-black hover:shadow-md motion-reduce:hover:translate-y-0">
                <CardHeader title="Sebaran Warga per RW" />
                <div className="flex-1 p-4">
                  <DistribusiPieChart
                    data={data.distribusi}
                    height={420}
                    showLegend={false}
                    warna={CHART_KATEGORI_COLORS}
                    labelIrisan={(i) => {
                      const baris = data.baris[i];
                      return baris ? [baris.label, baris.persenTeks] : [];
                    }}
                    center={
                      <>
                        {/* Teks total warga di tengah donat */}
                        <CountUp
                          value={data.total}
                          className="text-4xl font-bold tabular-nums leading-none text-slate-900 sm:text-5xl lg:text-6xl"
                        />
                        <span className="mt-2 text-xs font-medium uppercase tracking-widest text-slate-400">
                          jiwa
                        </span>
                      </>
                    }
                  />
                </div>
              </Card>
            </div>

            {/* Kolom kanan: kartu ringkas + daftar RW */}
            <div
              data-apple-fade
              data-apple-delay="1"
              className="flex flex-col gap-4"
            >
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                {data.stat.map((stat) => (
                  <StatCard
                    key={stat.id}
                    value={stat.value}
                    {...STAT_WARGA[stat.id]}
                  />
                ))}
              </div>

              <Card className="flex flex-1 flex-col transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-black hover:shadow-md motion-reduce:hover:translate-y-0">
                <CardHeader title="Statistik Warga" />
                <CardContent className="flex flex-1 flex-col justify-center p-4 sm:p-5">
                  <RwVerticalBarChart data={data} onPilihRw={onPilihRw} />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Distribusi Program Bantuan Sosial */}
          {data.perBansos && data.perBansos.length > 0 && (
            <div data-apple-fade data-apple-delay="2">
              <Card className="transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-black hover:shadow-md motion-reduce:hover:translate-y-0">
                <CardHeader title="Distribusi Program Bantuan Sosial" />
                <CardContent className="p-4 sm:p-5">
                  <DistribusiVerticalBarChart data={data.perBansos} />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </QueryBoundary>
  );
}
