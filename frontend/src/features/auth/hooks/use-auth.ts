import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/auth-api';
import { useAuthStore } from '@/lib/auth-store';
import type { GantiPassword, PetugasCredentials, Role } from '@/types/auth';
import { ROLE_PENGURUS } from '@/types/auth';

export function useLoginPetugas() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: async ({
      credentials,
      expectedRole,
    }: {
      credentials: PetugasCredentials;
      expectedRole: Role;
    }) => {
      const session = await authApi.login(credentials);

      if (session.user.role !== expectedRole) {
        await authApi.logout(session.token).catch(() => undefined);
        const p = ROLE_PENGURUS.includes(expectedRole) ? expectedRole : 'Admin';
        throw new Error(`Username atau password salah untuk akun ${p}.`);
      }

      return session;
    },
    onSuccess: (session) => setSession(session),
  });
}

export function useGantiPassword() {
  const updateUser = useAuthStore((s) => s.updateUser);
  return useMutation({
    mutationFn: (payload: GantiPassword) => authApi.gantiPassword(payload),
    onSuccess: (user) => updateUser(user),
  });
}
