import { apiClient } from '@/lib/api-client';
import type { Pengajuan } from '../types';

export interface PergantianApi {
  daftar(): Promise<Pengajuan[]>;

  ajukan(jabatanKode: string, kandidatId: string): Promise<Pengajuan>;

  menunggu(): Promise<Pengajuan[]>;

  jawab(id: string, setuju: boolean): Promise<Pengajuan>;
}

export const pergantianApi: PergantianApi = {
  async daftar() {
    const { data } = await apiClient.get<Pengajuan[]>('/pergantian');
    return data;
  },
  async ajukan(jabatanKode, kandidatId) {
    const { data } = await apiClient.post<Pengajuan>('/pergantian', {
      jabatanKode,
      kandidatId,
    });
    return data;
  },
  async menunggu() {
    const { data } = await apiClient.get<Pengajuan[]>('/pergantian/menunggu');
    return data;
  },
  async jawab(id, setuju) {
    const { data } = await apiClient.post<Pengajuan>(
      `/pergantian/${id}/jawab`,
      { setuju },
    );
    return data;
  },
};
