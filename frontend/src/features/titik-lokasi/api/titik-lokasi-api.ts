import { apiClient } from '@/lib/api-client';
import type { TitikLokasi, TitikLokasiBaru, TitikLokasiUbah } from '../types';

export const titikLokasiApi = {
  async listPublik(): Promise<TitikLokasi[]> {
    const { data } = await apiClient.get<TitikLokasi[]>('/publik/titik-lokasi');
    return data;
  },

  async listAdmin(): Promise<TitikLokasi[]> {
    const { data } = await apiClient.get<TitikLokasi[]>('/titik-lokasi');
    return data;
  },

  async getById(id: string): Promise<TitikLokasi> {
    const { data } = await apiClient.get<TitikLokasi>(
      `/titik-lokasi/${encodeURIComponent(id)}`,
    );
    return data;
  },

  async tambah(input: TitikLokasiBaru): Promise<TitikLokasi> {
    const { data } = await apiClient.post<TitikLokasi>('/titik-lokasi', input);
    return data;
  },

  async ubah(id: string, input: TitikLokasiUbah): Promise<TitikLokasi> {
    const { data } = await apiClient.put<TitikLokasi>(
      `/titik-lokasi/${encodeURIComponent(id)}`,
      input,
    );
    return data;
  },

  async hapus(id: string): Promise<void> {
    await apiClient.delete(`/titik-lokasi/${encodeURIComponent(id)}`);
  },
};
