import { useQuery } from '@tanstack/react-query';
import { cariWarga } from '@/lib/warga-api';

export const cariWargaKeys = {
  all: ['cari-warga'] as const,
  q: (q: string, jabatanKode: string) =>
    [...cariWargaKeys.all, jabatanKode, q] as const,
};

export function useCariWarga(q: string, jabatanKode?: string) {
  return useQuery({
    queryKey: cariWargaKeys.q(q.trim(), jabatanKode ?? ''),
    queryFn: () => cariWarga(q, jabatanKode),

    enabled: q.trim().length >= 2,
  });
}
