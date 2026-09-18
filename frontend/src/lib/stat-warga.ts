import ikonKeluarga from '@/assets/icons/keluarga.png';
import ikonLakiLaki from '@/assets/icons/laki-laki.png';
import ikonPenduduk from '@/assets/icons/penduduk.png';
import ikonPerempuan from '@/assets/icons/perempuan.png';
import { formatAngka } from './utils';

export type StatWargaId = 'keluarga' | 'penduduk' | 'lakiLaki' | 'perempuan';

export const STAT_WARGA: Record<StatWargaId, { label: string; icon: string }> =
  {
    keluarga: { label: 'Jumlah Kartu Keluarga', icon: ikonKeluarga },
    penduduk: { label: 'Total Penduduk', icon: ikonPenduduk },
    lakiLaki: { label: 'Laki-laki', icon: ikonLakiLaki },
    perempuan: { label: 'Perempuan', icon: ikonPerempuan },
  };

export interface TotalWarga {
  totalKepalaKeluarga?: number;
  totalPenduduk: number;
  totalLakiLaki: number;
  totalPerempuan: number;
}

export interface StatWarga {
  id: StatWargaId;

  value: string;
}

export function toStatWarga(total: TotalWarga): StatWarga[] {
  const hasil: StatWarga[] = [
    { id: 'penduduk', value: formatAngka(total.totalPenduduk) },
  ];
  if (total.totalKepalaKeluarga != null) {
    hasil.push({
      id: 'keluarga',
      value: formatAngka(total.totalKepalaKeluarga),
    });
  }
  hasil.push(
    { id: 'lakiLaki', value: formatAngka(total.totalLakiLaki) },
    { id: 'perempuan', value: formatAngka(total.totalPerempuan) },
  );
  return hasil;
}
