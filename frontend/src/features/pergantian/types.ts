import type { Role } from '@/types/auth';

export type StatusPengajuan = 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK' | 'GUGUR';

export interface Suara {
  pengurusId: string;
  nama: string;
  jabatan: string;
  setuju: boolean;

  pada: string;
}

export interface Pengajuan {
  id: string;

  jabatanKode: string;
  role: Role;
  rw?: string | null;
  rt?: string | null;

  jabatan: string;
  kandidatId: string;
  kandidatNama: string;
  kandidatRt: string;
  kandidatRw: string;
  status: StatusPengajuan;
  diajukanOleh: string;
  diajukanPada: string;
  selesaiPada?: string | null;

  sebab?: string | null;
  suara: Suara[];
}
