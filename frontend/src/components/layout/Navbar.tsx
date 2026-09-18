import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useDismissOnOutside } from '@/hooks/use-dismiss-on-outside';
import { useAuth, useLogout } from '@/hooks/use-auth';
import { paths } from '@/routes/paths';
import { NavbarView } from './NavbarView';

const JUDUL_NAVBAR: Record<string, string> = {
  [paths.admin.root]: 'Ringkasan',
  [paths.admin.penduduk]: 'Penduduk',
  [paths.admin.infografis]: 'Infografis',
  [paths.admin.riwayat]: 'Riwayat',
  [paths.admin.pengurus]: 'Kelola Akun',
  [paths.admin.berita]: 'Kelola Berita',
  [paths.admin.profil]: 'Profil Padukuhan',
  [paths.admin.lokasi]: 'Lokasi',
  [paths.gantiPassword]: 'Ganti Password',
};

export function Navbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { user } = useAuth();
  const logout = useLogout();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const title = JUDUL_NAVBAR[pathname];

  const menuRef = useDismissOnOutside<HTMLDivElement>(menuOpen, () =>
    setMenuOpen(false),
  );

  return (
    <NavbarView
      title={title}
      nama={user?.nama ?? ''}
      peran={user?.jabatan ?? 'Perangkat Desa'}
      role={user?.role}
      onOpenSidebar={onOpenSidebar}
      menuOpen={menuOpen}
      onToggleMenu={() => setMenuOpen((v) => !v)}
      menuRef={menuRef}
      onTutupMenu={() => setMenuOpen(false)}
      onLogout={logout}
    />
  );
}
