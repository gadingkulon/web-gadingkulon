import { apiClient } from '@/lib/api-client';
import type { StrukturOrganisasiPublik } from '../types';

export interface StrukturOrganisasiApi {
  get(): Promise<StrukturOrganisasiPublik>;
}

export const strukturOrganisasiApi: StrukturOrganisasiApi = {
  async get() {
    const { data } = await apiClient.get<StrukturOrganisasiPublik>(
      '/publik/struktur-organisasi',
    );
    return data;
  },
};
