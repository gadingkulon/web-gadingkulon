import type { Distribusi, PanelDistribusi } from '@/types/statistik';

/**
 * Bentuk mentah dari server. Semua opsional karena `/infografis`,
 * `/publik/statistik`, dan rincian per-RW memakai skema yang berbeda-beda —
 * yang sama cuma empat field ini.
 */
export interface SumberBansos {
  totalPenerimaBansos?: number;
  totalBpnt?: number;
  totalPkh?: number;
  perBansos?: Distribusi[];
}

export interface RingkasanBansos {
  totalPenerimaBansos: number;
  totalBpnt: number;
  totalPkh: number;
  perBansos: Distribusi[];
}

/** Isi nilai bawaan supaya halaman tidak perlu menulis `?? 0` di tiap field. */
export function toRingkasanBansos(sumber: SumberBansos): RingkasanBansos {
  return {
    totalPenerimaBansos: sumber.totalPenerimaBansos ?? 0,
    totalBpnt: sumber.totalBpnt ?? 0,
    totalPkh: sumber.totalPkh ?? 0,
    perBansos: sumber.perBansos ?? [],
  };
}

export const JUDUL_PANEL_BANSOS = 'Distribusi Program Bantuan Sosial';

/**
 * Panel grafik bansos — dikembalikan sebagai larik supaya bisa langsung
 * di-spread (`...panelBansos(x)`) dan hilang sendiri kalau datanya kosong.
 *
 * Ditulis sekali di sini, bukan di tiap view-model: sebelumnya blok yang sama
 * berdiri di tiga halaman (infografis pengurus, infografis publik, statistik),
 * jadi mengganti judul atau jenis grafiknya menuntut tiga suntingan yang harus
 * diingat semuanya.
 *
 * Syaratnya sengaja tetap "ada isinya", sama persis dengan sebelumnya. Server
 * selalu mengirim tiga batang walau semuanya nol, jadi dalam praktiknya panel
 * ini selalu tampil — termasuk saat tidak ada penerima sama sekali. Menyembunyikannya
 * saat semua nol adalah keputusan tampilan tersendiri, bukan bagian dari perapian ini.
 */
export function panelBansos(
  perBansos: Distribusi[] | undefined,
  opsi?: { lebarPenuh?: boolean },
): PanelDistribusi[] {
  if (!perBansos || perBansos.length === 0) return [];
  return [
    {
      id: 'bansos',
      judul: JUDUL_PANEL_BANSOS,
      jenis: 'bar-vertical',
      data: perBansos,
      ...(opsi?.lebarPenuh ? { lebarPenuh: true } : {}),
    },
  ];
}
