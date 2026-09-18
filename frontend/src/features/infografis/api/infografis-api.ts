import { apiClient } from '@/lib/api-client';
import type { InfografisData } from '../types';

export interface InfografisApi {
  get(): Promise<InfografisData>;
}

export const infografisApi: InfografisApi = {
  async get() {
    const { data } = await apiClient.get<InfografisData>('/infografis');
    return data;
  },
};
