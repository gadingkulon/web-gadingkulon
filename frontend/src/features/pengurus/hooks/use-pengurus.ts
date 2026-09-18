import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pengurusApi } from '../api/pengurus-api';
import type { PengurusBaru } from '../types';

export const pengurusKeys = {
  all: ['pengurus'] as const,
  jabatan: () => [...pengurusKeys.all, 'jabatan'] as const,
};

export function useDaftarJabatan() {
  return useQuery({
    queryKey: pengurusKeys.jabatan(),
    queryFn: () => pengurusApi.daftarJabatan(),
  });
}

function useSegarkanJabatan() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: pengurusKeys.all });
}

export function useTambahPengurus() {
  const segarkan = useSegarkanJabatan();
  return useMutation({
    mutationFn: (payload: PengurusBaru) => pengurusApi.tambah(payload),
    onSuccess: segarkan,
  });
}

export function useResetPassword() {
  const segarkan = useSegarkanJabatan();
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      pengurusApi.resetPassword(id, password),
    onSuccess: segarkan,
  });
}

export function useIsiLpm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (wargaId: string) => pengurusApi.isiLpm(wargaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['struktur-organisasi'] });
      queryClient.invalidateQueries({ queryKey: pengurusKeys.all });
    },
  });
}
