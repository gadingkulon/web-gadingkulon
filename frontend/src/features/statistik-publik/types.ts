import type { Distribusi } from '@/types/statistik';

export interface RincianRw {
  label: string;
  totalPenduduk: number;

  totalKepalaKeluarga: number;
  totalLakiLaki: number;
  totalPerempuan: number;
  totalPenerimaBansos?: number;
  totalBpnt?: number;
  totalPkh?: number;
  perBansos?: Distribusi[];
  perKelompokUmur: Distribusi[];
  perPendidikan: Distribusi[];
  perAgama: Distribusi[];
  perStatusPerkawinan: Distribusi[];

  perRt: RincianRw[];
}

export interface StatistikPublik {
  periodeTerawal: string;
  totalPenduduk: number;
  totalLakiLaki: number;
  totalPerempuan: number;

  totalKepalaKeluarga: number;
  totalPenerimaBansos?: number;
  totalBpnt?: number;
  totalPkh?: number;
  perBansos?: Distribusi[];

  perPekerjaan: Distribusi[];

  perRw: RincianRw[];
}
