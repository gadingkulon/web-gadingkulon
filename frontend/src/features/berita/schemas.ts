import { z } from 'zod';
import { keRingkasan } from './utils';

const MAKS_ISI = 4_000_000;

export const beritaSchema = z.object({
  judul: z.string().trim().min(4, 'Judul minimal 4 huruf'),
  penulis: z.string().trim().min(2, 'Nama penulis wajib diisi'),
  tanggalTerbit: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Pilih tanggal terbit'),

  isi: z
    .string()
    .refine(
      (html) => keRingkasan(html).length >= 20,
      'Isi berita minimal 20 huruf',
    )
    .refine(
      (html) => html.length <= MAKS_ISI,
      'Isi berita terlalu besar. Kurangi jumlah foto, atau perkecil ukurannya sebelum diunggah.',
    ),

  foto: z.string(),
});

export type BeritaFormValues = z.infer<typeof beritaSchema>;
