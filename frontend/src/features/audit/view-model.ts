import { formatJam, formatTanggal } from '@/lib/tanggal';
import type { CatatanAudit } from './types';

const AKSI_LABEL: Record<string, string> = {
  'ubah-warga': 'Mengubah data',
  'tambah-warga': 'Menambah warga',
  'tambah-pengurus': 'Membuatkan akun',
  'isi-lpm': 'Mengisi Ketua LPM',
  'ubah-lpm': 'Mengubah nama Ketua LPM',
  'reset-password': 'Mereset password',
  'tambah-berita': 'Menerbitkan berita',
  'ubah-berita': 'Menyunting berita',
  'hapus-berita': 'Menghapus berita',
  'ubah-padukuhan': 'Mengubah profil padukuhan',
  'tambah-titik-lokasi': 'Menambah titik lokasi',
  'ubah-titik-lokasi': 'Menyunting titik lokasi',
  'hapus-titik-lokasi': 'Menghapus titik lokasi',
  'muat-bawaan-titik-lokasi': 'Memuat titik lokasi bawaan',
};

export interface PerubahanKolom {
  kolom: string;
  lama: string;
  baru: string;
}

export interface BarisRiwayat {
  id: number;
  waktu: string;
  jam: string;
  aktor: string;
  aksi: string;
  sasaran: string;
  perubahan: PerubahanKolom[];

  catatan: string;
}

export function toBarisRiwayat(c: CatatanAudit): BarisRiwayat {
  const potongan = (c.perubahan ?? '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  const perubahan: PerubahanKolom[] = [];
  const catatan: string[] = [];
  for (const p of potongan) {
    const cocok = p.match(/^([\w.]+):\s*(.*?)\s*->\s*(.*)$/);
    if (cocok) {
      perubahan.push({
        kolom: cocok[1].replace('alamat.', 'alamat '),
        lama: cocok[2].replace(/^'|'$/g, ''),
        baru: cocok[3].replace(/^'|'$/g, ''),
      });
    } else {
      catatan.push(p);
    }
  }

  return {
    id: c.id,
    waktu: formatTanggal(c.waktu),
    jam: formatJam(c.waktu),
    aktor: c.aktor,
    aksi: AKSI_LABEL[c.aksi] ?? c.aksi,
    sasaran: c.sasaran,
    perubahan,
    catatan: catatan.join('; '),
  };
}
