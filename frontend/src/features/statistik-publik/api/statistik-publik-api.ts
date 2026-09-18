import { apiClient } from '@/lib/api-client';
import type { StatistikPublik } from '../types';

export interface StatistikPublikApi {
  get(periode?: string): Promise<StatistikPublik>;
}

export const statistikPublikApi: StatistikPublikApi = {
  async get(periode) {
    const { data } = await apiClient.get<StatistikPublik>('/publik/statistik', {
      params: periode ? { periode } : undefined,
    });
    return data;
  },
};
