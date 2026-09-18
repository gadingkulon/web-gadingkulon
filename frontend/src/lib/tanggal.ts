import {
  differenceInMonths,
  differenceInYears,
  format,
  isAfter,
  isValid,
  parseISO,
} from 'date-fns';
import { id as localeId } from 'date-fns/locale';

/**
 * Format teks umur yang dinamis, akurat, dan manusiawi:
 * - Warga meninggal: '-'
 * - Tanggal kosong / tidak valid / masa depan: '-'
 * - Usia >= 1 tahun: 'X th' (ringkas) atau 'X tahun' (lengkap)
 * - Usia 1–11 bulan: 'X bln' (ringkas) atau 'X bulan' (lengkap)
 * - Usia < 1 bulan: '< 1 bln' (ringkas) atau '< 1 bulan' (lengkap)
 */
export function formatUmur(
  tanggalLahirIso?: string | null,
  opsi?: {
    statusKependudukan?: string;
    lengkap?: boolean;
  },
): string {
  if (opsi?.statusKependudukan?.trim().toUpperCase() === 'MENINGGAL') {
    return '-';
  }

  if (!tanggalLahirIso || !tanggalLahirIso.trim()) {
    return '-';
  }

  try {
    const tglLahir = parseISO(tanggalLahirIso);
    if (!isValid(tglLahir)) {
      return '-';
    }

    const sekarang = new Date();
    if (isAfter(tglLahir, sekarang)) {
      return '-';
    }

    const th = differenceInYears(sekarang, tglLahir);
    if (th >= 1) {
      return opsi?.lengkap ? `${th} tahun` : `${th} th`;
    }

    const bln = differenceInMonths(sekarang, tglLahir);
    if (bln >= 1) {
      return opsi?.lengkap ? `${bln} bulan` : `${bln} bln`;
    }

    return opsi?.lengkap ? '< 1 bulan' : '< 1 bln';
  } catch {
    return '-';
  }
}

/**
 * `'2026-08-02'` -> `'2 Agustus 2026'`. Satu-satunya pemformat tanggal di
 * aplikasi ini.
 *
 * Dulu ada tiga: yang ini, satu lagi bernama sama persis di
 * `features/berita/utils.ts`, dan sepasang `Intl.DateTimeFormat` di
 * `features/audit/view-model.ts`. Keluarannya kebetulan identik, jadi yang
 * berbahaya bukan tampilannya melainkan namanya — membaca `formatTanggal`
 * menuntut mengecek dulu berkas mana yang sedang dibuka.
 *
 * Menerima tanggal polos (`'2026-08-02'`) maupun waktu lengkap
 * (`'2026-08-02T03:26:38+00:00'`, dipakai riwayat audit); yang terakhir
 * ditampilkan menurut zona waktu pembacanya.
 */
export function formatTanggal(iso?: string | null): string {
  if (!iso || !iso.trim()) return '-';
  try {
    const d = parseISO(iso);
    if (!isValid(d)) return iso;
    return format(d, 'd MMMM yyyy', { locale: localeId });
  } catch {
    return iso;
  }
}

// Sengaja `Intl`, bukan `format(d, 'HH:mm')` dari date-fns: penulisan jam
// Indonesia memakai titik (`10.26`), sedangkan date-fns memberi titik dua
// (`10:26`). Memindahkannya ke date-fns demi seragam dengan `formatTanggal`
// akan mengubah tampilan riwayat tanpa ada yang meminta.
const FORMAT_JAM = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
});

/** `'2026-08-02T03:26:38+00:00'` -> `'10.26'` menurut zona waktu pembaca. */
export function formatJam(iso?: string | null): string {
  if (!iso || !iso.trim()) return '-';
  const d = parseISO(iso);
  return isValid(d) ? FORMAT_JAM.format(d) : '-';
}

export function periodeBulanIni(): string {
  return format(new Date(), 'yyyy-MM');
}

export function labelPeriode(periode: string): string {
  return format(parseISO(`${periode}-01`), 'MMMM yyyy', { locale: localeId });
}

export function daftarPeriode(terawal: string, sampai: string): string[] {
  const hasil: string[] = [];
  let kursor = parseISO(`${sampai}-01`);
  const batas = parseISO(`${terawal}-01`);
  while (kursor >= batas) {
    hasil.push(format(kursor, 'yyyy-MM'));
    kursor = new Date(kursor.getFullYear(), kursor.getMonth() - 1, 1);
  }
  return hasil;
}

export const NAMA_BULAN: string[] = (() => {
  const format = new Intl.DateTimeFormat('id-ID', { month: 'long' });
  return Array.from({ length: 12 }, (_, i) =>
    format.format(new Date(2000, i, 1)),
  );
})();

export interface TanggalTerpisah {
  tanggal: string;
  bulan: string;
  tahun: string;
}

export function keTanggalLahirIso(v: TanggalTerpisah): string | null {
  const t = Number(v.tanggal);
  const b = Number(v.bulan);
  const th = Number(v.tahun);
  if (!t || !b || !th) return null;
  const d = new Date(th, b - 1, t);

  if (d.getFullYear() !== th || d.getMonth() !== b - 1 || d.getDate() !== t) {
    return null;
  }
  if (d > new Date()) return null;
  return `${th}-${String(b).padStart(2, '0')}-${String(t).padStart(2, '0')}`;
}

export function dariTanggalLahirIso(iso: string): TanggalTerpisah {
  const [tahun = '', bulan = '', tanggal = ''] = iso.split('-');
  return { tanggal: String(Number(tanggal) || ''), bulan, tahun };
}
