import { apiClient } from '@/lib/api-client';

export interface WargaPilihan {
  id: string;
  nama: string;
  rt: string;
  rw: string;
}

export async function cariWarga(
  q: string,
  jabatanKode?: string,
): Promise<WargaPilihan[]> {
  const { data } = await apiClient.get<WargaPilihan[]>('/pengurus/warga', {
    params: { q, jabatanKode },
  });
  return data;
}
