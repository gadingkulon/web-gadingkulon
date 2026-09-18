import { Link, NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';
import { env } from '@/config/env';
import { useAuth } from '@/hooks/use-auth';
import ikonBack from '@/assets/back-navigasi.svg';
import ikonClose from '@/assets/icons/nav/x-close.svg';
import { paths } from '@/routes/paths';
import { navItemsForRole } from './nav-config';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const tautanSidebarClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-base transition-all duration-150 ease-out active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 motion-reduce:transition-none',
    isActive
      ? 'font-bold text-brand-600 hover:bg-slate-100'
      : 'font-medium text-slate-900 hover:bg-slate-100 hover:text-brand-600',
  );

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth();
  const items = navItemsForRole(user?.role);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex h-full max-h-dvh min-h-0 w-72 max-w-[85vw] flex-col border-r-1 border-black bg-surface transition-transform sm:w-80 lg:static lg:h-full lg:max-h-full lg:w-80 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Header sidebar */}
        <div className="flex h-20 shrink-0 flex-col justify-center border-b-1 border-black px-5">
          <div className="flex items-center justify-between">
            <Logo className="h-8" />
            <button
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 lg:hidden"
              onClick={onClose}
              aria-label="Tutup menu"
            >
              <span
                aria-hidden
                className="block h-5 w-5 bg-current"
                style={{
                  mask: `url("${ikonClose}") center / contain no-repeat`,
                  WebkitMask: `url("${ikonClose}") center / contain no-repeat`,
                }}
              />
            </button>
          </div>
        </div>

        {/* Link cepat kembali ke portal publik */}
        <div className="pt-2">
          <Link
            to={paths.landing}
            onClick={onClose}
            className="mx-10 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-normal text-slate-500 transition-all duration-150 ease-out hover:bg-slate-100 hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 active:scale-95 motion-reduce:transition-none"
          >
            <span
              aria-hidden
              className="block h-4 w-4 shrink-0 bg-current"
              style={{
                mask: `url("${ikonBack}") center / contain no-repeat`,
                WebkitMask: `url("${ikonBack}") center / contain no-repeat`,
              }}
            />
            Kembali ke Beranda
          </Link>
          {/* Garis pembatas inset (tidak menyambung sampai pojok) */}
          <div
            className="mx-10 my-2 border-b-2 border-black"
            aria-hidden="true"
          />
        </div>

        <nav
          aria-label="Menu"
          className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-3 pt-0 [webkit-overflow-scrolling:touch]"
        >
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={tautanSidebarClass}
            >
              {item.icon && (
                <span
                  aria-hidden
                  className="h-5 w-5 shrink-0"
                  style={{
                    backgroundColor: 'currentColor',
                    mask: `url("${item.icon}") center / contain no-repeat`,
                    WebkitMask: `url("${item.icon}") center / contain no-repeat`,
                    maskSize: 'contain',
                    WebkitMaskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    WebkitMaskRepeat: 'no-repeat',
                  }}
                />
              )}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <p className="flex h-14 min-h-14 shrink-0 items-center border-t-1 border-black px-4 text-xs text-slate-400 sm:text-sm">
          {env.appName} · v0.1.0
        </p>
      </aside>
    </>
  );
}
