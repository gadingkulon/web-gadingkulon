import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { padukuhanApi } from '@/lib/padukuhan-api';
import { PADUKUHAN_BAWAAN, type Padukuhan } from '@/lib/padukuhan';

export const padukuhanKeys = {
  all: ['padukuhan'] as const,
};

export function usePadukuhanQuery() {
  return useQuery({
    queryKey: padukuhanKeys.all,
    queryFn: () => padukuhanApi.ambil(),

    staleTime: 60 * 60 * 1000,
  });
}

export function usePadukuhan(): Padukuhan {
  return usePadukuhanQuery().data ?? PADUKUHAN_BAWAAN;
}

export function useUbahPadukuhan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (isi: Padukuhan) => padukuhanApi.ubah(isi),

    onSuccess: (baru) => qc.setQueryData(padukuhanKeys.all, baru),
  });
}
