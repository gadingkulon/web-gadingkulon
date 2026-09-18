import type { Role } from '@/types/auth';
import { paths } from './paths';

export function homePathForRole(role: Role | undefined): string {
  return role === 'ADMIN' ? paths.admin.pengurus : paths.admin.penduduk;
}
