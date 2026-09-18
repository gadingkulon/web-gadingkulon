import { toRingkasanBansos, type RingkasanBansos } from '@/lib/bansos';
import { toStatWarga } from '@/lib/stat-warga';
import type { StatWarga } from '@/lib/stat-warga';
import { formatAngka } from '@/lib/utils';
import type { Distribusi } from '@/types/statistik';
import type { StatistikPublik } from './types';

export interface BarisRw {
  label: string;

  jumlahTeks: string;

  persenTeks: string;
}

export interface RingkasanStatistik extends RingkasanBansos {
  total: number;

  stat: StatWarga[];

  distribusi: Distribusi[];
  baris: BarisRw[];
}

export interface TujuanWilayah {
  rw: string | null;
  rt: string | null;
}

export interface Crumb {
  label: string;

  tujuan: TujuanWilayah | null;
}

export function toJalurWilayah(
  rwAktif: string | null,
  rtAktif: string | null,
): Crumb[] {
  if (rwAktif === null) return [{ label: 'Statistik', tujuan: null }];

  const jalur: Crumb[] = [
    { label: 'Statistik', tujuan: { rw: null, rt: null } },
    {
      label: rwAktif,
      tujuan: rtAktif === null ? null : { rw: rwAktif, rt: null },
    },
  ];
  if (rtAktif !== null) jalur.push({ label: rtAktif, tujuan: null });
  return jalur;
}

export function toRingkasanStatistik(
  data: StatistikPublik,
): RingkasanStatistik {
  const total = data.totalPenduduk;

  return {
    distribusi: data.perRw.map((d) => ({
      label: d.label,
      value: d.totalPenduduk,
    })),
    total,
    stat: toStatWarga(data).filter(
      (s) => s.id !== 'penduduk' && s.id !== 'keluarga',
    ),
    baris: data.perRw.map((d) => ({
      label: d.label,
      jumlahTeks: `${formatAngka(d.totalPenduduk)} jiwa`,
      persenTeks:
        total === 0 ? '—' : `${Math.round((d.totalPenduduk / total) * 100)}%`,
    })),
    ...toRingkasanBansos(data),
  };
}
