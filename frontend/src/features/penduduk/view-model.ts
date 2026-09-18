import { formatTanggal, formatUmur } from '@/lib/tanggal';
import type { Penduduk, StatusDomisili, StatusKependudukan } from './types';
import {
  agamaLabel,
  golonganDarahLabel,
  statusKependudukanLabel,
  jenisKelaminLabel,
  pendidikanLabel,
  statusDomisiliLabel,
  statusHubunganLabel,
  statusPerkawinanLabel,
} from './labels';

type KeteranganTone = 'amber' | 'slate' | null;

const KETERANGAN_TONE: Record<StatusKependudukan, KeteranganTone> = {
  AKTIF: null,
  PINDAH: 'amber',
  MENINGGAL: 'slate',
};

export interface PendudukRow {
  id: string;
  nama: string;
  jenisKelamin: string;
  umur: string;
  agama: string;

  rtRw: string;

  keterangan: string;

  keteranganTone: KeteranganTone;
  statusDomisili?: StatusDomisili;
  bansos?: string[];
  catatanPerkawinan?: string;
  catatanKematian?: string;
}

function normWil(v?: string | null): string {
  if (!v) return '';
  const s = v.trim();
  return /^\d+$/.test(s) ? s.replace(/^0+/, '') || '0' : s;
}

export function toPendudukRow(p: Penduduk): PendudukRow {
  return {
    id: p.id,
    nama: p.nama,
    jenisKelamin: jenisKelaminLabel[p.jenisKelamin],
    umur: formatUmur(p.tanggalLahir, {
      statusKependudukan: p.statusKependudukan,
    }),
    agama: agamaLabel[p.agama],
    rtRw: `${normWil(p.alamat.rt)}/${normWil(p.alamat.rw)}`,
    keterangan: statusKependudukanLabel[p.statusKependudukan],
    keteranganTone: KETERANGAN_TONE[p.statusKependudukan],
    statusDomisili: p.statusDomisili,
    bansos: p.bansos,
    catatanPerkawinan: p.catatanPerkawinan,
    catatanKematian: p.catatanKematian,
  };
}

export interface DetailField {
  label: string;
  value: string;
}

export interface PendudukDetailView {
  nama: string;
  hubungan: string;
  fields: DetailField[];
  alamat: string;
}

export function toPendudukDetail(p: Penduduk): PendudukDetailView {
  const { alamat } = p;
  const fields: DetailField[] = [
    { label: 'Jenis Kelamin', value: jenisKelaminLabel[p.jenisKelamin] },
    {
      label: 'Tempat, Tgl Lahir',
      value: `${p.tempatLahir}, ${formatTanggal(p.tanggalLahir)}`,
    },
    {
      label: 'Umur',
      value: formatUmur(p.tanggalLahir, {
        statusKependudukan: p.statusKependudukan,
        lengkap: true,
      }),
    },
    { label: 'Agama', value: agamaLabel[p.agama] },
    {
      label: 'Status Perkawinan',
      value: statusPerkawinanLabel[p.statusPerkawinan],
    },
  ];

  if (p.catatanPerkawinan) {
    fields.push({ label: 'Catatan Perkawinan', value: p.catatanPerkawinan });
  }

  fields.push({
    label: 'Status Kependudukan',
    value: statusKependudukanLabel[p.statusKependudukan],
  });

  if (p.catatanKematian) {
    fields.push({
      label: 'Penyebab / Keterangan Meninggal',
      value: p.catatanKematian,
    });
  }

  fields.push(
    { label: 'Pendidikan', value: pendidikanLabel[p.pendidikan] },
    { label: 'Pekerjaan', value: p.pekerjaan },
    { label: 'Gol. Darah', value: golonganDarahLabel[p.golonganDarah] },
    { label: 'Kewarganegaraan', value: p.kewarganegaraan },
    {
      label: 'Status Tempat Tinggal',
      value: statusDomisiliLabel[p.statusDomisili ?? 'TETAP'],
    },
  );

  if (p.statusDomisili === 'KONTRAK' && p.alamatAsal) {
    fields.push({ label: 'Alamat Asal (KTP/KK)', value: p.alamatAsal });
  }

  fields.push({
    label: 'Program Bansos',
    value:
      p.bansos && p.bansos.length > 0
        ? p.bansos.join(', ')
        : 'Tidak Menerima Bansos',
  });

  return {
    nama: p.nama,
    hubungan: statusHubunganLabel[p.statusHubunganKeluarga],
    fields,
    alamat:
      `${alamat.jalan}, RT ${normWil(alamat.rt)}/RW ${normWil(alamat.rw)}, Desa ${alamat.desa}, ` +
      `Kec. ${alamat.kecamatan}, ${alamat.kabupaten}, ${alamat.provinsi} ${alamat.kodePos}`,
  };
}
