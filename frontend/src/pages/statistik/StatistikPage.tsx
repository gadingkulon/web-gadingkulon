import { useSearchParams } from 'react-router-dom';
import { PublicLandingLayout } from '@/components/layout/PublicLandingLayout';
import { periodeBulanIni } from '@/lib/tanggal';
import { StatistikBreadcrumb } from '@/features/statistik-publik/components/StatistikBreadcrumb';
import { StatistikNav } from '@/features/statistik-publik/components/StatistikNav';
import { StatistikPanel } from '@/features/statistik-publik/components/StatistikPanel';
import { RincianRwPanel } from './RincianRwPanel';

export default function StatistikPage() {
  const [params, setParams] = useSearchParams();
  const rwAktif = params.get('rw');
  const rtAktif = rwAktif === null ? null : params.get('rt');
  const bulanIni = periodeBulanIni();
  const periode = params.get('periode') ?? bulanIni;

  const ubah = (rw: string | null, rt: string | null, periodeBaru: string) =>
    setParams({
      ...(rw ? (rt ? { rw, rt } : { rw }) : {}),

      ...(periodeBaru === bulanIni ? {} : { periode: periodeBaru }),
    });

  const pilih = (rw: string | null, rt: string | null = null) =>
    ubah(rw, rt, periode);

  return (
    <PublicLandingLayout
      nav={
        <StatistikNav
          rwAktif={rwAktif}
          rtAktif={rtAktif}
          onPilih={pilih}
          periode={periode}
          onPilihPeriode={(p) => ubah(rwAktif, rtAktif, p)}
        />
      }
      breadcrumb={
        <StatistikBreadcrumb
          rwAktif={rwAktif}
          rtAktif={rtAktif}
          onPilih={pilih}
        />
      }
    >
      {rwAktif === null ? (
        <StatistikPanel onPilihRw={pilih} periode={periode} />
      ) : (
        <RincianRwPanel rw={rwAktif} rt={rtAktif} periode={periode} />
      )}
    </PublicLandingLayout>
  );
}
