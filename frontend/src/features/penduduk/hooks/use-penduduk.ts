import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { PaginationParams } from '@/types/api';
import type { FilterPenduduk, PendudukBaru, PendudukUbah } from '../types';
import { pendudukApi } from '../api/penduduk-api';

type ListParams = PaginationParams & FilterPenduduk;

export const pendudukKeys = {
  all: ['penduduk'] as const,
  list: (params: ListParams) => [...pendudukKeys.all, 'list', params] as const,
  byId: (id: string) => [...pendudukKeys.all, 'id', id] as const,
  filterOpsi: () => [...pendudukKeys.all, 'filter-opsi'] as const,
};

export function usePendudukList(params: ListParams) {
  return useQuery({
    queryKey: pendudukKeys.list(params),
    queryFn: () => pendudukApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useFilterOpsi() {
  return useQuery({
    queryKey: pendudukKeys.filterOpsi(),
    queryFn: () => pendudukApi.filterOpsi(),
    staleTime: 5 * 60 * 1000,
  });
}

function useSegarkanPenduduk() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: pendudukKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['infografis'] });
    void queryClient.invalidateQueries({ queryKey: ['statistik-publik'] });
  };
}

export function useTambahPenduduk() {
  const segarkan = useSegarkanPenduduk();
  return useMutation({
    mutationFn: (payload: PendudukBaru) => pendudukApi.tambah(payload),
    onSuccess: segarkan,
  });
}

export function useUbahPenduduk() {
  const segarkan = useSegarkanPenduduk();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PendudukUbah }) =>
      pendudukApi.ubah(id, payload),
    onSuccess: segarkan,
  });
}

export function useHapusPenduduk() {
  const segarkan = useSegarkanPenduduk();
  return useMutation({
    mutationFn: (id: string) => pendudukApi.hapus(id),
    onSuccess: segarkan,
  });
}
