import { z } from 'zod';
import { keTanggalLahirIso } from '@/lib/tanggal';

export const wargaSchema = z
  .object({
    nama: z.string().trim().min(1, 'Nama wajib diisi'),
    jenisKelamin: z.enum(['LAKI_LAKI', 'PEREMPUAN']),
    tempatLahir: z.string().trim().min(1, 'Tempat lahir wajib diisi'),
    tanggal: z.string().regex(/^([1-9]|[12]\d|3[01])$/, 'Tanggal 1–31'),
    bulan: z.string().regex(/^(0[1-9]|1[0-2])$/, 'Pilih bulan'),
    tahun: z.string().regex(/^(19|20)\d{2}$/, 'Tahun 4 angka'),
    agama: z.enum([
      'ISLAM',
      'KRISTEN',
      'KATOLIK',
      'HINDU',
      'BUDDHA',
      'KONGHUCU',
      'LAINNYA',
    ]),
    statusPerkawinan: z.enum([
      'BELUM_KAWIN',
      'KAWIN',
      'CERAI_HIDUP',
      'CERAI_MATI',
    ]),
    pendidikan: z.enum([
      'TIDAK_BELUM_SEKOLAH',
      'BELUM_TAMAT_SD',
      'SD',
      'SMP',
      'SMA',
      'D2',
      'D3',
      'D4',
      'S1',
      'S2',
      'S3',
    ]),
    pekerjaan: z.string().trim().min(1, 'Pekerjaan wajib diisi'),
    golonganDarah: z.enum(['A', 'B', 'AB', 'O', 'TIDAK_TAHU']),
    statusHubunganKeluarga: z.enum([
      'KEPALA_KELUARGA',
      'ISTRI',
      'ANAK',
      'FAMILI_LAIN',
      'LAINNYA',
    ]),
    statusKependudukan: z.enum(['AKTIF', 'PINDAH', 'MENINGGAL']),
    statusDomisili: z.enum(['TETAP', 'KONTRAK']).default('TETAP'),
    bansosBpnt: z.boolean().default(false),
    bansosPkh: z.boolean().default(false),
    kodeKeluarga: z.string().optional(),
    alamatAsal: z.string().optional(),
    catatanPerkawinan: z.string().optional(),
    catatanKematian: z.string().optional(),
    jalan: z.string().trim().min(1, 'Alamat jalan wajib diisi'),
    rt: z
      .string()
      .trim()
      .min(1, 'RT wajib diisi')
      .transform((v) => (/^\d+$/.test(v) ? v.replace(/^0+/, '') || '0' : v)),
    rw: z
      .string()
      .trim()
      .min(1, 'RW wajib diisi')
      .transform((v) => (/^\d+$/.test(v) ? v.replace(/^0+/, '') || '0' : v)),
  })
  .refine((v) => keTanggalLahirIso(v) !== null, {
    message: 'Tanggal itu tidak ada di kalender, atau melewati hari ini',
    path: ['tanggal'],
  });

export type WargaFormValues = z.infer<typeof wargaSchema>;
