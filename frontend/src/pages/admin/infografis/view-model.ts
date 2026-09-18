import {
  agamaLabel,
  pendidikanLabel,
  relabel,
  statusDomisiliLabel,
  statusPerkawinanLabel,
} from '@/features/penduduk/labels';
import type { InfografisData } from '@/features/infografis/types';
import { panelBansos } from '@/lib/bansos';
import type { PanelDistribusi } from '@/types/statistik';

export function toPanelInfografis(data: InfografisData): PanelDistribusi[] {
  return [
    {
      id: 'agama',
      judul: 'Komposisi Agama',
      jenis: 'pie',
      data: relabel(data.perAgama, agamaLabel),
    },
    {
      id: 'umur',
      judul: 'Kelompok Umur',
      jenis: 'bar',
      data: data.perKelompokUmur,
    },
    {
      id: 'pendidikan',
      judul: 'Tingkat Pendidikan',
      jenis: 'bar',
      data: relabel(data.perPendidikan, pendidikanLabel),
    },
    ...panelBansos(data.perBansos),
    {
      id: 'perkawinan',
      judul: 'Status Perkawinan',
      jenis: 'pie',
      data: relabel(data.perStatusPerkawinan, statusPerkawinanLabel),
    },
    {
      id: 'domisili',
      judul: 'Status Domisili Warga',
      jenis: 'pie',
      data: [
        {
          label: statusDomisiliLabel.TETAP,
          value: Math.max(0, data.totalPenduduk - (data.totalNgontrak ?? 0)),
        },
        {
          label: statusDomisiliLabel.KONTRAK,
          value: data.totalNgontrak ?? 0,
        },
      ],
    },
    {
      id: 'dusun',
      judul: 'Sebaran per RW',
      jenis: 'bar',
      data: data.perDusun,
      lebarPenuh: true,
    },
  ];
}
