import type {
  Agama,
  FilterPenduduk,
  GolonganDarah,
  StatusKependudukan,
  JenisKelamin,
  KelompokUmur,
  Pendidikan,
  StatusHubunganKeluarga,
  StatusPerkawinan,
} from './types';
import type { Distribusi } from '@/types/statistik';

export const jenisKelaminLabel: Record<JenisKelamin, string> = {
  LAKI_LAKI: 'Laki-laki',
  PEREMPUAN: 'Perempuan',
};

export const agamaLabel: Record<Agama, string> = {
  ISLAM: 'Islam',
  KRISTEN: 'Kristen',
  KATOLIK: 'Katolik',
  HINDU: 'Hindu',
  BUDDHA: 'Buddha',
  KONGHUCU: 'Konghucu',
  LAINNYA: 'Lainnya',
};

export const statusPerkawinanLabel: Record<StatusPerkawinan, string> = {
  BELUM_KAWIN: 'Belum Kawin',
  KAWIN: 'Kawin',
  CERAI_HIDUP: 'Cerai Hidup',
  CERAI_MATI: 'Cerai Mati',
};

export const pendidikanLabel: Record<Pendidikan, string> = {
  TIDAK_BELUM_SEKOLAH: 'Tidak/Belum Sekolah',
  BELUM_TAMAT_SD: 'Belum Tamat SD',
  SD: 'SD',
  SMP: 'SMP',
  SMA: 'SMA/SMK',
  D2: 'Diploma II (D2)',
  D3: 'Diploma III (D3)',
  D4: 'Diploma IV (D4)',
  S1: 'Sarjana (S1)',
  S2: 'Magister (S2)',
  S3: 'Doktor (S3)',
};

export const golonganDarahLabel: Record<GolonganDarah, string> = {
  A: 'A',
  B: 'B',
  AB: 'AB',
  O: 'O',
  TIDAK_TAHU: 'Tidak Tahu',
};

export const statusHubunganLabel: Record<StatusHubunganKeluarga, string> = {
  KEPALA_KELUARGA: 'Kepala Keluarga',
  ISTRI: 'Istri',
  ANAK: 'Anak',
  FAMILI_LAIN: 'Famili Lain',
  LAINNYA: 'Lainnya',
};

export const statusKependudukanLabel: Record<StatusKependudukan, string> = {
  AKTIF: 'Aktif',
  MENINGGAL: 'Meninggal',
  PINDAH: 'Pindah',
};

export const statusDomisiliLabel: Record<'TETAP' | 'KONTRAK', string> = {
  TETAP: 'Domisili Tetap',
  KONTRAK: 'Domisili Sementara',
};

export const bansosLabel: Record<string, string> = {
  BPNT: 'BPNT',
  PKH: 'PKH',
  SEMUA: 'Semua Penerima Bansos',
  TIDAK: 'Bukan Penerima Bansos',
};

export const kelompokUmurOpsi: readonly KelompokUmur[] = [
  '0-5',
  '6-12',
  '13-17',
  '18-25',
  '26-40',
  '41-60',
  '60+',
];

export const filterLabel: Record<keyof FilterPenduduk, string> = {
  rw: 'RW',
  rt: 'RT',
  statusKependudukan: 'Status Warga',
  jenisKelamin: 'Jenis Kelamin',
  kelompokUmur: 'Kelompok Umur',
  agama: 'Agama',
  pendidikan: 'Pendidikan',
  statusPerkawinan: 'Status Perkawinan',
  statusHubunganKeluarga: 'Status dalam Keluarga',
  golonganDarah: 'Gol. Darah',
  pekerjaan: 'Pekerjaan',
  bansos: 'Bantuan Sosial',
  statusDomisili: 'Status Domisili',
};

const nilaiFilterLabel: Partial<
  Record<keyof FilterPenduduk, Record<string, string>>
> = {
  statusKependudukan: statusKependudukanLabel,
  jenisKelamin: jenisKelaminLabel,
  agama: agamaLabel,
  golonganDarah: golonganDarahLabel,
  pendidikan: pendidikanLabel,
  statusPerkawinan: statusPerkawinanLabel,
  statusHubunganKeluarga: statusHubunganLabel,
  bansos: bansosLabel,
  statusDomisili: statusDomisiliLabel,
};

export interface FilterChip {
  field: keyof FilterPenduduk;
  label: string;
  nilai: string;
}

export function toFilterChips(filter: FilterPenduduk): FilterChip[] {
  const urutan = Object.keys(filterLabel) as (keyof FilterPenduduk)[];
  return urutan.flatMap((field) => {
    const nilai = filter[field];
    if (!nilai) return [];
    return [
      {
        field,
        label: filterLabel[field],
        nilai:
          nilaiFilterLabel[field]?.[nilai] ??
          (field === 'kelompokUmur' ? `${nilai} th` : nilai),
      },
    ];
  });
}

export function relabel<T extends string>(
  data: Distribusi[],
  map: Record<T, string>,
): Distribusi[] {
  return data.map((d) => ({ ...d, label: map[d.label as T] ?? d.label }));
}
