export type JenisKelamin = 'LAKI_LAKI' | 'PEREMPUAN';

export type Agama =
  'ISLAM' | 'KRISTEN' | 'KATOLIK' | 'HINDU' | 'BUDDHA' | 'KONGHUCU' | 'LAINNYA';

export type StatusPerkawinan =
  'BELUM_KAWIN' | 'KAWIN' | 'CERAI_HIDUP' | 'CERAI_MATI';

export type Pendidikan =
  | 'TIDAK_BELUM_SEKOLAH'
  | 'BELUM_TAMAT_SD'
  | 'SD'
  | 'SMP'
  | 'SMA'
  | 'D2'
  | 'D3'
  | 'D4'
  | 'S1'
  | 'S2'
  | 'S3';

export type StatusHubunganKeluarga =
  'KEPALA_KELUARGA' | 'ISTRI' | 'ANAK' | 'FAMILI_LAIN' | 'LAINNYA';

export type GolonganDarah = 'A' | 'B' | 'AB' | 'O' | 'TIDAK_TAHU';

export type StatusKependudukan = 'AKTIF' | 'PINDAH' | 'MENINGGAL';

export interface Alamat {
  jalan: string;
  rt: string;
  rw: string;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kodePos: string;
}

export type StatusDomisili = 'TETAP' | 'KONTRAK';

export interface Penduduk {
  id: string;
  kodeKeluarga?: string | null;
  nama: string;
  jenisKelamin: JenisKelamin;
  tempatLahir: string;

  tanggalLahir: string;
  agama: Agama;
  statusPerkawinan: StatusPerkawinan;
  pendidikan: Pendidikan;
  pekerjaan: string;
  golonganDarah: GolonganDarah;
  statusHubunganKeluarga: StatusHubunganKeluarga;
  kewarganegaraan: string;

  jabatan: 'WARGA' | 'DUKUH' | 'RW' | 'RT';
  alamat: Alamat;
  statusKependudukan: StatusKependudukan;
  statusDomisili?: StatusDomisili;
  bansos?: string[];
  alamatAsal?: string;
  catatanPerkawinan?: string;
  catatanKematian?: string;

  deletedAt: string | null;
}

export type KelompokUmur =
  '0-5' | '6-12' | '13-17' | '18-25' | '26-40' | '41-60' | '60+';

export interface FilterPenduduk {
  jenisKelamin?: JenisKelamin;
  agama?: Agama;
  golonganDarah?: GolonganDarah;
  pendidikan?: Pendidikan;
  statusPerkawinan?: StatusPerkawinan;
  statusHubunganKeluarga?: StatusHubunganKeluarga;
  pekerjaan?: string;
  rt?: string;
  rw?: string;
  kelompokUmur?: KelompokUmur;
  bansos?: string;
  statusDomisili?: StatusDomisili;
  statusKependudukan?: StatusKependudukan;
}

export interface FilterOpsi {
  rt: string[];
  rw: string[];
  pekerjaan: string[];
  bansos?: string[];
}

export type PendudukBaru = Omit<
  Penduduk,
  'id' | 'statusKependudukan' | 'deletedAt' | 'jabatan'
>;

export interface PendudukUbah {
  kodeKeluarga?: string | null;
  nama?: string;
  jenisKelamin?: JenisKelamin;
  tempatLahir?: string;
  tanggalLahir?: string;
  agama?: Agama;
  statusPerkawinan?: StatusPerkawinan;
  pendidikan?: Pendidikan;
  pekerjaan?: string;
  golonganDarah?: GolonganDarah;
  statusHubunganKeluarga?: StatusHubunganKeluarga;
  kewarganegaraan?: string;
  statusKependudukan?: StatusKependudukan;
  statusDomisili?: StatusDomisili;
  bansos?: string[];
  alamatAsal?: string | null;
  catatanPerkawinan?: string | null;
  catatanKematian?: string | null;
  alamat?: Partial<Alamat>;
}
