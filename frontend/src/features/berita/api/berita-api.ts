import { apiClient } from '@/lib/api-client';
import { ApiError } from '@/types/api';
import type { Berita, BeritaBaru } from '../types';

export interface BeritaApi {
  list(): Promise<Berita[]>;
  getBySlug(slug: string): Promise<Berita | null>;
  simpan(input: BeritaBaru, id?: string): Promise<Berita>;
  hapus(id: string): Promise<void>;
}

export const beritaApi: BeritaApi = {
  async list() {
    const { data } = await apiClient.get<Berita[]>('/publik/berita');
    return [...data].sort((a, b) =>
      b.tanggalTerbit.localeCompare(a.tanggalTerbit),
    );
  },

  async getBySlug(slug) {
    try {
      const { data } = await apiClient.get<Berita>(
        `/publik/berita/${encodeURIComponent(slug)}`,
      );
      return data;
    } catch (galat) {
      if (galat instanceof ApiError && galat.status === 404) return null;
      throw galat;
    }
  },

  async simpan(input, id) {
    const { data } =
      id === undefined
        ? await apiClient.post<Berita>('/berita', input)
        : await apiClient.patch<Berita>(
            `/berita/${encodeURIComponent(id)}`,
            input,
          );
    return data;
  },

  async hapus(id) {
    await apiClient.delete(`/berita/${encodeURIComponent(id)}`);
  },
};
