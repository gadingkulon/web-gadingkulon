import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import type { Role } from '@/types/auth';
import { paths } from './paths';
import { homePathForRole } from './role-utils';

export function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={paths.login} state={{ from: location }} replace />;
  }
  return <Outlet />;
}

export function RequireRole({ roles }: { roles: readonly Role[] }) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <Navigate to={homePathForRole(user?.role)} replace />;
  }
  return <Outlet />;
}

/**
 * Menahan halaman aplikasi selama password awal dari Admin belum diganti.
 *
 * Backend sudah menolak 403 di mana-mana selama penanda itu menyala, jadi tanpa
 * guard ini pengurus tetap tidak bisa apa-apa — bedanya ia melihat galat di tiap
 * halaman dan menyangka aplikasinya rusak.
 *
 * BUKAN jebakan: `/ganti-password` sengaja didaftarkan DI LUAR guard ini, dan
 * tombol keluar di formulirnya mengakhiri sesi lalu mengembalikan orangnya ke
 * `/login`. Kalau `/ganti-password` ikut dijaga, pengalihannya akan menunjuk ke
 * dirinya sendiri dan halamannya tidak pernah selesai memuat.
 */
export function RequireGantiPassword() {
  const { harusGantiPassword } = useAuth();

  if (harusGantiPassword) {
    return <Navigate to={paths.gantiPassword} replace />;
  }
  return <Outlet />;
}

export function RedirectIfAuthenticated() {
  const { isAuthenticated, user, harusGantiPassword } = useAuth();

  // Yang masih memegang password awal sengaja TIDAK dilempar ke berandanya:
  // berandanya dijaga `RequireGantiPassword`, jadi ia cuma akan terpental ke
  // `/ganti-password` — dan tombol "kembali" di sana jadi tidak ada gunanya.
  // Membiarkan halaman login tampil adalah jalan keluarnya.
  if (isAuthenticated && !harusGantiPassword) {
    return <Navigate to={homePathForRole(user?.role)} replace />;
  }
  return <Outlet />;
}
