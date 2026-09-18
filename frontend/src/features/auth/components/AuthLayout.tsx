import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import ikonKembali from '@/assets/back-navigasi.svg';
import { BarKredit } from '@/components/layout/BarKredit';
import { Logo } from '@/components/ui/Logo';
import { paths } from '@/routes/paths';

interface AuthLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  onBack?: () => void;
  /** Tulisan tombol kiri-atas. Ganti kalau tombolnya tidak benar-benar
   *  mengembalikan ke halaman sebelumnya — mis. saat ia mengakhiri sesi. */
  backLabel?: string;
  backTo?: string;
}

export function AuthLayout({
  title,
  description,
  children,
  onBack,
  backLabel = 'Kembali',
  backTo,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b-1 border-black bg-surface px-4 py-4 sm:px-6">
        <Logo className="h-6" />
      </header>

      <div className="flex flex-1 flex-col px-3.5 py-6 sm:px-6 sm:py-8">
        <div className="my-auto w-full max-w-md self-center">
          <div className="rounded-2xl border-1 border-black bg-surface p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)] sm:p-8">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="focus-ring -ml-3 mb-2 inline-flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100 hover:text-brand-700"
              >
                <span
                  aria-hidden
                  className="h-4 w-4 shrink-0 bg-current"
                  style={{
                    mask: `url("${ikonKembali}") center / contain no-repeat`,
                    WebkitMask: `url("${ikonKembali}") center / contain no-repeat`,
                  }}
                />
                {backLabel}
              </button>
            ) : (
              <Link
                to={backTo ?? paths.landing}
                className="focus-ring -ml-3 mb-2 inline-flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100 hover:text-brand-700"
              >
                <span
                  aria-hidden
                  className="h-4 w-4 shrink-0 bg-current"
                  style={{
                    mask: `url("${ikonKembali}") center / contain no-repeat`,
                    WebkitMask: `url("${ikonKembali}") center / contain no-repeat`,
                  }}
                />
                Kembali
              </Link>
            )}

            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                {title}
              </h1>
              {description && (
                <p className="mt-1.5 text-sm text-slate-500">{description}</p>
              )}
            </div>

            {children}
          </div>
        </div>
      </div>

      <BarKredit className="min-h-14 shrink-0 px-4 py-1.5 sm:px-6" />
    </div>
  );
}
