import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PublicShell } from '@/components/layout/PublicShell';
import { LoadingBlock } from '@/components/ui/Spinner';
import { ROLE_PENGURUS } from '@/types/auth';
import {
  RedirectIfAuthenticated,
  RequireAuth,
  RequireGantiPassword,
  RequireRole,
} from './guards';
import { paths } from './paths';

const HomePage = lazy(() => import('@/pages/publik/home/HomePage'));
const ProfilPage = lazy(() => import('@/pages/publik/profil/ProfilPage'));
const InfografisPublikPage = lazy(
  () => import('@/pages/publik/infografis/InfografisPublikPage'),
);
const BeritaListPage = lazy(
  () => import('@/pages/publik/berita/BeritaListPage'),
);
const BeritaDetailPage = lazy(
  () => import('@/pages/publik/berita/BeritaDetailPage'),
);
const StatistikPage = lazy(() => import('@/pages/statistik/StatistikPage'));
const LoginPage = lazy(() => import('@/pages/login/LoginPetugasPage'));
const GantiPasswordPage = lazy(
  () => import('@/pages/ganti-password/GantiPasswordPage'),
);
const AdminDashboardPage = lazy(
  () => import('@/pages/admin/dashboard/AdminDashboardPage'),
);
const PendudukPage = lazy(() => import('@/pages/admin/penduduk/PendudukPage'));
const InfografisPage = lazy(
  () => import('@/pages/admin/infografis/InfografisPage'),
);
const PengurusPage = lazy(() => import('@/pages/admin/pengurus/PengurusPage'));
const RiwayatPage = lazy(() => import('@/pages/admin/riwayat/RiwayatPage'));
const KelolaBeritaPage = lazy(
  () => import('@/pages/admin/berita/KelolaBeritaPage'),
);
const ProfilPadukuhanPage = lazy(
  () => import('@/pages/admin/profil/ProfilPadukuhanPage'),
);
const LokasiWilayahPage = lazy(
  () => import('@/pages/admin/lokasi/LokasiWilayahPage'),
);
const NotFoundPage = lazy(() => import('@/pages/not-found/NotFoundPage'));

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Routes>
        <Route element={<RedirectIfAuthenticated />}>
          <Route path={paths.login} element={<LoginPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          {/* Di luar `RequireGantiPassword` dengan sengaja — kalau ikut dijaga,
              pengalihannya akan menunjuk ke halaman ini sendiri. */}
          <Route path={paths.gantiPassword} element={<GantiPasswordPage />} />

          <Route element={<RequireGantiPassword />}>
            <Route element={<DashboardLayout />}>
              <Route element={<RequireRole roles={ROLE_PENGURUS} />}>
                <Route
                  path={paths.admin.root}
                  element={<AdminDashboardPage />}
                />
                <Route path={paths.admin.penduduk} element={<PendudukPage />} />
                <Route
                  path={paths.admin.infografis}
                  element={<InfografisPage />}
                />
              </Route>

              <Route path={paths.admin.riwayat} element={<RiwayatPage />} />

              <Route element={<RequireRole roles={['ADMIN']} />}>
                <Route path={paths.admin.pengurus} element={<PengurusPage />} />
                <Route
                  path={paths.admin.berita}
                  element={<KelolaBeritaPage />}
                />
                <Route
                  path={paths.admin.profil}
                  element={<ProfilPadukuhanPage />}
                />
                <Route
                  path={paths.admin.lokasi}
                  element={<LokasiWilayahPage />}
                />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route element={<PublicShell />}>
          <Route path={paths.landing} element={<HomePage />} />
          <Route path={paths.profil} element={<ProfilPage />} />
          <Route path={paths.infografis} element={<InfografisPublikPage />} />
          <Route path={paths.berita} element={<BeritaListPage />} />
          <Route path="/berita/:slug" element={<BeritaDetailPage />} />
        </Route>
        <Route path={paths.statistik} element={<StatistikPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
