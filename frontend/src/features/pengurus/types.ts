import type { AuthUser, Role } from '@/types/auth';

export interface Pengurus extends AuthUser {
  aktif: boolean;
}

export interface Calon {
  id: string;
  nama: string;
}

export interface Jabatan {
  kode: string;
  role: Role;
  rw?: string | null;
  rt?: string | null;

  label: string;
  pemegang: Pengurus | null;

  calon: Calon | null;
}

export interface PengurusBaru {
  username: string;
  password: string;
  wargaId: string;
  role: Role;
  rw?: string;
  rt?: string;
}
