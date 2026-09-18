import type { RefObject } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';
import type { Role } from '@/types/auth';
import ikonMenu from '@/assets/icons/nav/menu.svg';
import ikonUserCircle from '@/assets/icons/nav/user-circle.svg';
import ikonKeyRound from '@/assets/icons/nav/key-round.svg';
import ikonLogOut from '@/assets/icons/nav/log-out.svg';
import { paths } from '@/routes/paths';

interface NavbarViewProps {
  title?: string;
  nama: string;
  peran: string;
  role?: Role;
  onOpenSidebar: () => void;
  menuOpen: boolean;
  onToggleMenu: () => void;
  menuRef: RefObject<HTMLDivElement>;
  onTutupMenu: () => void;
  onLogout: () => void;
}

export function NavbarView({
  title,
  nama,
  peran,
  role,
  onOpenSidebar,
  menuOpen,
  onToggleMenu,
  menuRef,
  onTutupMenu,
  onLogout,
}: NavbarViewProps) {
  const samaPeran = nama.trim().toLowerCase() === peran.trim().toLowerCase();
  const isAdmin = role === 'ADMIN';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b-1 border-black bg-surface px-4 backdrop-blur sm:h-20 sm:px-6 lg:px-8">
      {/* Mobile bar: Menu + Logo + Title */}
      <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
        <button
          className="-ml-1 shrink-0 rounded-md p-2 text-slate-500 hover:bg-slate-100"
          onClick={onOpenSidebar}
          aria-label="Buka menu"
        >
          <span
            aria-hidden
            className="block h-5 w-5 bg-current"
            style={{
              mask: `url("${ikonMenu}") center / contain no-repeat`,
              WebkitMask: `url("${ikonMenu}") center / contain no-repeat`,
            }}
          />
        </button>
        <Logo className="h-7 shrink-0" />
        {title && (
          <>
            <span className="text-slate-400" aria-hidden>
              |
            </span>
            <span className="truncate text-sm font-semibold text-slate-900">
              {title}
            </span>
          </>
        )}
      </div>

      {/* Desktop title: adjacent to sidebar's right border with SIGALON logo */}
      {title && (
        <div className="hidden items-center lg:flex">
          <span className="text-base font-semibold text-slate-900">
            {title}
          </span>
        </div>
      )}

      <div className="ml-auto flex items-center gap-3">
        <div className="relative" ref={menuRef}>
          <button
            onClick={onToggleMenu}
            className={cn(
              'focus-ring flex items-center gap-2.5 rounded-lg border-1 border-black px-3.5 py-1.5 font-medium text-white shadow-sm transition-all duration-150 ease-out active:scale-[0.98]',
              isAdmin
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-brand-600 hover:bg-brand-700',
            )}
            aria-label="Menu pengguna"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <div className="text-left leading-tight sm:text-right">
              <span className="block text-sm font-bold text-white">{nama}</span>
              {!samaPeran && (
                <span className="block text-2xs font-medium text-white/90">
                  {peran}
                </span>
              )}
            </div>

            <span
              aria-hidden
              className="block h-6 w-6 shrink-0 bg-white"
              style={{
                mask: `url("${ikonUserCircle}") center / contain no-repeat`,
                WebkitMask: `url("${ikonUserCircle}") center / contain no-repeat`,
              }}
            />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg border-1 border-black bg-surface p-1.5 shadow-lg">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-slate-800">{nama}</p>
                {!samaPeran && (
                  <p className="text-xs text-slate-500">{peran}</p>
                )}
              </div>
              <div className="my-1 h-px bg-black" />
              <Link
                to={paths.gantiPassword}
                onClick={onTutupMenu}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                <span
                  aria-hidden
                  className="h-4 w-4 shrink-0 bg-current"
                  style={{
                    mask: `url("${ikonKeyRound}") center / contain no-repeat`,
                    WebkitMask: `url("${ikonKeyRound}") center / contain no-repeat`,
                  }}
                />
                Ganti Password
              </Link>
              <button
                onClick={onLogout}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <span
                  aria-hidden
                  className="h-4 w-4 shrink-0 bg-current"
                  style={{
                    mask: `url("${ikonLogOut}") center / contain no-repeat`,
                    WebkitMask: `url("${ikonLogOut}") center / contain no-repeat`,
                  }}
                />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
