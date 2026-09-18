import type { AuthUser } from '@/types/auth';

function normalisasi(v?: string | null): string {
  if (!v) return '';
  const s = v.trim();
  return /^\d+$/.test(s) ? s.replace(/^0+/, '') || '0' : s;
}

export function labelWilayah(user: AuthUser | null): string {
  if (!user) return '';
  if (user.role === 'RT')
    return `RT ${normalisasi(user.rt)} / RW ${normalisasi(user.rw)}`;
  if (user.role === 'RW') return `RW ${normalisasi(user.rw)}`;
  return 'seluruh padukuhan';
}
