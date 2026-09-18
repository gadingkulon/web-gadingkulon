import { apiClient } from '@/lib/api-client';
import type { Jabatan, Pengurus, PengurusBaru } from '../types';

export interface PengurusApi {
  daftarJabatan(): Promise<Jabatan[]>;
  tambah(payload: PengurusBaru): Promise<Pengurus>;
  resetPassword(id: string, password: string): Promise<void>;

  isiLpm(wargaId: string): Promise<{ nama: string; wargaId: string }>;
}

export const pengurusApi: PengurusApi = {
  async daftarJabatan() {
    const { data } = await apiClient.get<Jabatan[]>('/pengurus');
    return data;
  },
  async tambah(payload) {
    const { data } = await apiClient.post<Pengurus>('/pengurus', payload);
    return data;
  },
  async resetPassword(id, password) {
    await apiClient.post(`/pengurus/${id}/reset-password`, { password });
  },
  async isiLpm(wargaId) {
    const { data } = await apiClient.patch<{ nama: string; wargaId: string }>(
      '/pengurus/lpm',
      { wargaId },
    );
    return data;
  },
};
