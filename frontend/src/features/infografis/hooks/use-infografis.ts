import { useQuery } from '@tanstack/react-query';
import { infografisApi } from '../api/infografis-api';

export const infografisKeys = {
  all: ['infografis'] as const,
};

export function useInfografis() {
  return useQuery({
    queryKey: infografisKeys.all,
    queryFn: () => infografisApi.get(),
  });
}
