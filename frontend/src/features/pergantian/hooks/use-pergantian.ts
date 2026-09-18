import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pergantianApi } from '../api/pergantian-api';

export const pergantianKeys = {
  all: ['pergantian'] as const,
  daftar: () => [...pergantianKeys.all, 'daftar'] as const,
  menunggu: () => [...pergantianKeys.all, 'menunggu'] as const,
};

export function usePengajuanList() {
  return useQuery({
    queryKey: pergantianKeys.daftar(),
    queryFn: () => pergantianApi.daftar(),
  });
}

export function useMenungguJawaban(enabled: boolean) {
  return useQuery({
    queryKey: pergantianKeys.menunggu(),
    queryFn: () => pergantianApi.menunggu(),
    enabled,
  });
}

function useSegarkan() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: pergantianKeys.all });

    void queryClient.invalidateQueries({ queryKey: ['pengurus'] });
  };
}

export function useAjukanPergantian() {
  const segarkan = useSegarkan();
  return useMutation({
    mutationFn: ({
      jabatanKode,
      kandidatId,
    }: {
      jabatanKode: string;
      kandidatId: string;
    }) => pergantianApi.ajukan(jabatanKode, kandidatId),
    onSuccess: segarkan,
  });
}

export function useJawabPengajuan() {
  const segarkan = useSegarkan();
  return useMutation({
    mutationFn: ({ id, setuju }: { id: string; setuju: boolean }) =>
      pergantianApi.jawab(id, setuju),
    onSuccess: segarkan,
  });
}
