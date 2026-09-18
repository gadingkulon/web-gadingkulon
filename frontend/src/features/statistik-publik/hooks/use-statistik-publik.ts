import { useQuery } from '@tanstack/react-query';
import { periodeBulanIni } from '@/lib/tanggal';
import { statistikPublikApi } from '../api/statistik-publik-api';

export const statistikPublikKeys = {
  all: ['statistik-publik'] as const,

  periode: (periode?: string) =>
    ['statistik-publik', periode ?? 'kini'] as const,
};

export function useStatistikPublik(periode?: string) {
  const kunci = periode === periodeBulanIni() ? undefined : periode;

  return useQuery({
    queryKey: statistikPublikKeys.periode(kunci),
    queryFn: () => statistikPublikApi.get(kunci),
  });
}
