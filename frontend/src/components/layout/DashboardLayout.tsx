import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { PersetujuanPanel } from '@/features/pergantian/components/PersetujuanPanel';
import { paths } from '@/routes/paths';
import { BarKredit } from './BarKredit';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export function DashboardLayout() {
  const { harusGantiPassword } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const konten = useRef<HTMLElement>(null);

  useEffect(() => {
    konten.current?.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-slate-50 lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onOpenSidebar={() => setSidebarOpen(true)} />

        <main ref={konten} className="flex-1 lg:overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8">
            <PersetujuanPanel />

            {harusGantiPassword && (
              <div className="mb-6 flex flex-col justify-between gap-3 rounded-xl border-1 border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-center">
                <div className="text-sm">
                  <p className="font-semibold text-amber-900">
                    Perhatian: Anda masih menggunakan password awal
                  </p>
                  <p className="text-amber-700">
                    Demi keamanan akun, Anda disarankan untuk segera mengganti
                    password.
                  </p>
                </div>
                <Link
                  to={paths.gantiPassword}
                  state={{ from: pathname }}
                  className="inline-flex shrink-0 items-center justify-center rounded-lg bg-amber-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-700"
                >
                  Ganti Password
                </Link>
              </div>
            )}

            <Outlet />
          </div>
        </main>

        <BarKredit className="min-h-14 shrink-0 px-4 py-1.5 lg:px-8" />
      </div>
    </div>
  );
}
