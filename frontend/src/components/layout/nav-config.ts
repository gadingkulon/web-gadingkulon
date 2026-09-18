import ikonChartPie from '@/assets/icons/nav/chart-pie.svg';
import ikonUsers from '@/assets/icons/nav/users.svg';
import ikonKelolaAkun from '@/assets/icons/Sidebar-Pengurus/kelola_akun.png';
import ikonKelolaBerita from '@/assets/icons/Sidebar-Pengurus/kelola_berita.png';
import ikonProfilPadukuhan from '@/assets/icons/Sidebar-Pengurus/profil padukuhan.png';
import ikonLokasi from '@/assets/icons/Sidebar-Pengurus/lokasi.png';
import ikonRiwayatEdit from '@/assets/icons/Sidebar-Pengurus/riwayat_edit.png';
import ikonRingkasan from '@/assets/icons/Sidebar-Pengurus/ringkasan.png';
import ikonStatWarga from '@/assets/icons/Sidebar-Pengurus/stat warga.png';
import type { Role } from '@/types/auth';
import { CHART_KATEGORI_COLORS } from '@/lib/colors';
import { paths } from '@/routes/paths';

export interface NavItem {
  label: string;
  to: string;

  icon?: string;

  aksen: string;

  end?: boolean;
}

const statistikDesa: NavItem = {
  label: 'Statistik',
  to: paths.statistik,
  icon: ikonStatWarga,
  aksen: CHART_KATEGORI_COLORS[3],
  end: true,
};

const riwayat: NavItem = {
  label: 'Riwayat',
  to: paths.admin.riwayat,
  icon: ikonRiwayatEdit,
  aksen: CHART_KATEGORI_COLORS[1],
};

export function navItemsForRole(role: Role | undefined): NavItem[] {
  if (role === 'ADMIN') {
    return [
      {
        label: 'Kelola Akun',
        to: paths.admin.pengurus,
        icon: ikonKelolaAkun,
        aksen: CHART_KATEGORI_COLORS[2],
      },
      {
        label: 'Kelola Berita',
        to: paths.admin.berita,
        icon: ikonKelolaBerita,
        aksen: CHART_KATEGORI_COLORS[6],
      },
      {
        label: 'Profil Padukuhan',
        to: paths.admin.profil,
        icon: ikonProfilPadukuhan,
        aksen: CHART_KATEGORI_COLORS[7],
      },
      {
        label: 'Lokasi',
        to: paths.admin.lokasi,
        icon: ikonLokasi,
        aksen: CHART_KATEGORI_COLORS[4],
      },
      riwayat,
    ];
  }
  return [
    {
      label: 'Ringkasan',
      to: paths.admin.root,
      icon: ikonRingkasan,
      aksen: CHART_KATEGORI_COLORS[0],
      end: true,
    },
    {
      label: 'Penduduk',
      to: paths.admin.penduduk,
      icon: ikonUsers,
      aksen: CHART_KATEGORI_COLORS[5],
    },
    {
      label: 'Infografis',
      to: paths.admin.infografis,
      icon: ikonChartPie,
      aksen: CHART_KATEGORI_COLORS[4],
    },
    riwayat,
    statistikDesa,
  ];
}
