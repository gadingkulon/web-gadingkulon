import { apiClient } from '@/lib/api-client';
import type { CatatanAudit } from '../types';

export interface AuditApi {
  riwayat(): Promise<CatatanAudit[]>;
}

export const auditApi: AuditApi = {
  async riwayat() {
    const { data } = await apiClient.get<CatatanAudit[]>('/audit');
    return data;
  },
};
