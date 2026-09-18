export interface CatatanAudit {
  id: number;

  waktu: string;

  aktor: string;
  aksi: string;

  sasaran: string;
  sasaranId?: string | null;

  perubahan?: string | null;
}
