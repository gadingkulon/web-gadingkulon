import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';
import { paths } from '@/routes/paths';
import { AccountButton } from './AccountButton';

const TAUTAN = [
  { label: 'Beranda', to: paths.landing, end: true },
  { label: 'Profil Desa', to: paths.profil, end: true },
  { label: 'Infografis', to: paths.infografis, end: true },
  { label: 'Berita', to: paths.berita, end: false },
  { label: 'Statistik', to: paths.statistik, end: true },
];

const tautanClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-lg px-3.5 py-2 text-sm transition-all duration-150 ease-out active:scale-95 motion-reduce:transition-none',
    isActive
      ? 'font-bold text-brand-700'
      : 'font-bold text-black hover:bg-slate-100 hover:text-brand-700',
  );

export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setOpen(false);
      };
      window.addEventListener('keydown', onKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', onKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-30 border-b-1 border-black bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <NavLink to={paths.landing} aria-label="Beranda" className="shrink-0">
            <Logo className="h-8" />
          </NavLink>

          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            {TAUTAN.map((t) => (
              <NavLink key={t.to} to={t.to} end={t.end} className={tautanClass}>
                {t.label}
              </NavLink>
            ))}
          </nav>

          <AccountButton className="ml-auto hidden lg:ml-4 lg:flex" />

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="ml-auto rounded-lg p-2 text-slate-900 hover:bg-slate-100 lg:hidden"
            aria-label="Buka menu"
            aria-expanded={open}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Backdrop overlay saat drawer terbuka */}
      <div
        className={cn(
          'backdrop-blur-xs fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden',
          open
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0',
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile drawer dari sisi kanan */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex h-full max-h-dvh w-72 max-w-[85vw] flex-col border-l-1 border-black bg-surface shadow-2xl transition-transform duration-300 ease-in-out sm:w-80 lg:hidden',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        aria-label="Menu navigasi mobile"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b-1 border-black px-5">
          <Logo className="h-7" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav
          className="flex-1 space-y-1.5 overflow-y-auto overscroll-contain p-4 [webkit-overflow-scrolling:touch]"
          onClick={() => setOpen(false)}
        >
          {TAUTAN.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-xl px-4 py-3 text-base font-semibold transition-all duration-150',
                  isActive
                    ? 'bg-brand-50 font-bold text-brand-700'
                    : 'text-slate-800 hover:bg-slate-100 hover:text-brand-700',
                )
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 border-t-1 border-black p-4">
          <AccountButton className="w-full justify-center py-2.5" />
        </div>
      </aside>
    </>
  );
}
