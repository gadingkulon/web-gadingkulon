import {
  agamaLabel,
  pendidikanLabel,
  relabel,
  statusPerkawinanLabel,
} from '@/features/penduduk/labels';
import type { RincianRw } from '@/features/statistik-publik/types';
import {
  panelBansos,
  toRingkasanBansos,
  type RingkasanBansos,
} from '@/lib/bansos';
import { toStatWarga, type StatWarga } from '@/lib/stat-warga';
import type { PanelDistribusi } from '@/types/statistik';

export interface RincianRwViewModel extends RingkasanBansos {
  stat: StatWarga[];
  panels: PanelDistribusi[];
}

export function toRincianRw(rw: RincianRw): RincianRwViewModel {
  return {
    stat: toStatWarga(rw),
    ...toRingkasanBansos(rw),
    panels: [
      {
        id: 'umur',
        judul: 'Kelompok Umur',
        jenis: 'bar',
        data: rw.perKelompokUmur,
      },
      {
        id: 'pendidikan',
        judul: 'Tingkat Pendidikan',
        jenis: 'bar',
        data: relabel(rw.perPendidikan, pendidikanLabel),
      },
      ...panelBansos(rw.perBansos, { lebarPenuh: true }),
      {
        id: 'agama',
        judul: 'Komposisi Agama',
        jenis: 'bar',
        data: relabel(rw.perAgama, agamaLabel),
      },
      {
        id: 'perkawinan',
        judul: 'Status Perkawinan',
        jenis: 'bar',
        data: relabel(rw.perStatusPerkawinan, statusPerkawinanLabel),
      },
    ],
  };
}
