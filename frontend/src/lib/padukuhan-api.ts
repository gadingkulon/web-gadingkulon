import { apiClient } from '@/lib/api-client';
import type { Padukuhan } from '@/lib/padukuhan';

export interface PadukuhanApi {
  ambil(): Promise<Padukuhan | null>;
  ubah(isi: Padukuhan): Promise<Padukuhan>;
}

export const padukuhanApi: PadukuhanApi = {
  async ambil() {
    const { data } = await apiClient.get<Padukuhan | null>('/publik/padukuhan');
    return data;
  },

  async ubah(isi) {
    const { data } = await apiClient.patch<Padukuhan>('/padukuhan', isi);
    return data;
  },
};
