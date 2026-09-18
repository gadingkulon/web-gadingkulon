import { useQuery } from '@tanstack/react-query';
import { strukturOrganisasiApi } from '../api/struktur-organisasi-api';

export const strukturOrganisasiKeys = {
  all: ['struktur-organisasi'] as const,
};

export function useStrukturOrganisasi() {
  return useQuery({
    queryKey: strukturOrganisasiKeys.all,
    queryFn: () => strukturOrganisasiApi.get(),
  });
}
