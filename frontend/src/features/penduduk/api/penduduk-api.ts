import { apiClient } from '@/lib/api-client';
import type { Paginated, PaginationParams } from '@/types/api';
import type {
  FilterOpsi,
  FilterPenduduk,
  Penduduk,
  PendudukBaru,
  PendudukUbah,
} from '../types';

export interface PendudukApi {
  list(params: PaginationParams & FilterPenduduk): Promise<Paginated<Penduduk>>;

  getById(id: string): Promise<Penduduk | null>;

  filterOpsi(): Promise<FilterOpsi>;

  tambah(payload: PendudukBaru): Promise<Penduduk>;

  ubah(id: string, payload: PendudukUbah): Promise<Penduduk>;

  hapus(id: string): Promise<void>;

  ekspor(
    params: FilterPenduduk & { search?: string; format?: 'xlsx' | 'csv' },
  ): Promise<Blob>;
}

export const pendudukApi: PendudukApi = {
  async list(params) {
    const { data } = await apiClient.get<Paginated<Penduduk>>('/penduduk', {
      params,
    });
    return data;
  },
  async getById(id) {
    const { data } = await apiClient.get<Penduduk>(`/penduduk/${id}`);
    return data;
  },
  async filterOpsi() {
    const { data } = await apiClient.get<FilterOpsi>('/penduduk/filter-opsi');
    return data;
  },
  async tambah(payload) {
    const { data } = await apiClient.post<Penduduk>('/penduduk', payload);
    return data;
  },
  async ubah(id, payload) {
    const { data } = await apiClient.patch<Penduduk>(
      `/penduduk/${id}`,
      payload,
    );
    return data;
  },
  async hapus(id) {
    await apiClient.delete(`/penduduk/${id}`);
  },
  async ekspor(params) {
    const { data } = await apiClient.get<Blob>('/penduduk/ekspor', {
      params,
      responseType: 'blob',
    });
    return data;
  },
};
