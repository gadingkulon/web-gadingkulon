/**
 * Identitas & sesi pengurus — dipakai lintas fitur, routes, layout, dan `lib`.
 *
 * Di sini, bukan di dalam `features/auth`: `features/A` tidak boleh mengimpor
 * internal `features/B` (CLAUDE.md §4), sementara `Role` dibaca `pengurus`,
 * `pergantian`, `penduduk`, guards, dan menu sidebar.
 */

export type Role = 'ADMIN' | 'DUKUH' | 'RW' | 'RT';

export const ROLE_PENGURUS: readonly Role[] = ['DUKUH', 'RW', 'RT'];

export interface AuthUser {
  id: string;
  nama: string;
  username: string;
  role: Role;

  rw?: string | null;
  rt?: string | null;

  jabatan: string;

  harusGantiPassword: boolean;
}

export interface PetugasCredentials {
  username: string;
  password: string;
}

export interface GantiPassword {
  passwordLama: string;
  passwordBaru: string;
}

export interface Session {
  token: string;
  user: AuthUser;
}
