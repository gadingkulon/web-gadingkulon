import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../api/audit-api';

export const auditKeys = {
  all: ['audit'] as const,
};

export function useRiwayat() {
  return useQuery({
    queryKey: auditKeys.all,
    queryFn: () => auditApi.riwayat(),
  });
}
