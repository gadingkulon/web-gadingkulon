import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { beritaApi } from '../api/berita-api';
import type { BeritaBaru } from '../types';

export const beritaKeys = {
  all: ['berita'] as const,
  list: () => [...beritaKeys.all, 'list'] as const,
  detail: (slug: string) => [...beritaKeys.all, 'detail', slug] as const,
};

export function useBeritaList() {
  return useQuery({
    queryKey: beritaKeys.list(),
    queryFn: () => beritaApi.list(),
  });
}

export function useBerita(slug: string) {
  return useQuery({
    queryKey: beritaKeys.detail(slug),
    queryFn: () => beritaApi.getBySlug(slug),
  });
}

export function useSimpanBerita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, id }: { input: BeritaBaru; id?: string }) =>
      beritaApi.simpan(input, id),

    onSuccess: () => qc.invalidateQueries({ queryKey: beritaKeys.all }),
  });
}

export function useHapusBerita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => beritaApi.hapus(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: beritaKeys.all }),
  });
}
