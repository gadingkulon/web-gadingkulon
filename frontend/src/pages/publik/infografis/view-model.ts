import {
  agamaLabel,
  pendidikanLabel,
  relabel,
  statusPerkawinanLabel,
} from '@/features/penduduk/labels';
import type {
  RincianRw,
  StatistikPublik,
} from '@/features/statistik-publik/types';
import { panelBansos } from '@/lib/bansos';
import type { Distribusi, PanelDistribusi } from '@/types/statistik';

function gabungDistribusi(
  perRw: RincianRw[],
  ambil: (rw: RincianRw) => Distribusi[],
): Distribusi[] {
  const total = new Map<string, number>();
  for (const rw of perRw) {
    for (const d of ambil(rw)) {
      total.set(d.label, (total.get(d.label) ?? 0) + d.value);
    }
  }
  return [...total].map(([label, value]) => ({ label, value }));
}

function urutKelompokUmur(data: Distribusi[]): Distribusi[] {
  return [...data].sort(
    (a, b) => Number.parseInt(a.label, 10) - Number.parseInt(b.label, 10),
  );
}

export function toPanelDemografi(data: StatistikPublik): PanelDistribusi[] {
  return [
    {
      id: 'umur',
      judul: 'Demografi Usia',
      jenis: 'bar',
      data: urutKelompokUmur(
        gabungDistribusi(data.perRw, (rw) => rw.perKelompokUmur),
      ),
    },
    {
      id: 'agama',
      judul: 'Distribusi Agama',
      jenis: 'pie',
      data: relabel(
        gabungDistribusi(data.perRw, (rw) => rw.perAgama),
        agamaLabel,
      ),
    },
    {
      id: 'pekerjaan',
      judul: 'Pekerjaan',
      jenis: 'bar',
      data: data.perPekerjaan,
    },
    {
      id: 'perkawinan',
      judul: 'Status Perkawinan',
      jenis: 'pie',
      data: relabel(
        gabungDistribusi(data.perRw, (rw) => rw.perStatusPerkawinan),
        statusPerkawinanLabel,
      ),
    },
    {
      id: 'pendidikan',
      judul: 'Tingkat Pendidikan',
      jenis: 'bar',
      data: relabel(
        gabungDistribusi(data.perRw, (rw) => rw.perPendidikan),
        pendidikanLabel,
      ),
      lebarPenuh: true,
    },
    ...panelBansos(data.perBansos, { lebarPenuh: true }),
  ];
}
