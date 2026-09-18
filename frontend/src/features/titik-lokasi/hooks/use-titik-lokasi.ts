import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { titikLokasiApi } from '../api/titik-lokasi-api';
import type { TitikLokasiBaru, TitikLokasiUbah } from '../types';

export const titikLokasiKeys = {
  all: ['titik-lokasi'] as const,
  publik: () => [...titikLokasiKeys.all, 'publik'] as const,
  admin: () => [...titikLokasiKeys.all, 'admin'] as const,
  detail: (id: string) => [...titikLokasiKeys.all, 'detail', id] as const,
};

export function useTitikLokasiList() {
  return useQuery({
    queryKey: titikLokasiKeys.publik(),
    queryFn: () => titikLokasiApi.listPublik(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTitikLokasiAdminList() {
  return useQuery({
    queryKey: titikLokasiKeys.admin(),
    queryFn: () => titikLokasiApi.listAdmin(),
  });
}

export function useTambahTitikLokasi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TitikLokasiBaru) => titikLokasiApi.tambah(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: titikLokasiKeys.all });
    },
  });
}

export function useUbahTitikLokasi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TitikLokasiUbah }) =>
      titikLokasiApi.ubah(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: titikLokasiKeys.all });
    },
  });
}

export function useHapusTitikLokasi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => titikLokasiApi.hapus(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: titikLokasiKeys.all });
    },
  });
}
