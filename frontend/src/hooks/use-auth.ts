/**
 * Sesi yang sedang berjalan — siapa yang masuk, dan cara keluar.
 *
 * Di sini, bukan di `features/auth`: dibaca layout, guards, dan tiga fitur
 * lain, sementara `features/A` tidak boleh mengimpor internal `features/B`
 * (CLAUDE.md §4). Hook khusus login & ganti password tetap di fiturnya.
 */

import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/lib/auth-api';
import { useAuthStore } from '@/lib/auth-store';
import { paths } from '@/routes/paths';
import { ROLE_PENGURUS } from '@/types/auth';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return {
    user,
    isAuthenticated,

    isAdmin: user?.role === 'ADMIN',

    isPengurus: user ? ROLE_PENGURUS.includes(user.role) : false,

    harusGantiPassword: user?.harusGantiPassword ?? false,
  };
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return () => {
    void authApi.logout().catch(() => undefined);
    clear();

    queryClient.clear();

    navigate(paths.login, { replace: true });
  };
}
