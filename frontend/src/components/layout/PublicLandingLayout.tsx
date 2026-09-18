import { useState, type ReactNode } from 'react';
import { useAppleScrollFade } from '@/hooks/use-apple-scroll-fade';
import { AccountButton } from './AccountButton';
import { BarKredit } from './BarKredit';
import { PublicSidebar } from './PublicSidebar';
import { PublicTopbar } from './PublicTopbar';

interface PublicLandingLayoutProps {
  nav: ReactNode;

  breadcrumb: ReactNode;

  children: ReactNode;
}

export function PublicLandingLayout({
  nav,
  breadcrumb,
  children,
}: PublicLandingLayoutProps) {
  const [navOpen, setNavOpen] = useState(false);
  useAppleScrollFade();

  return (
    <div className="flex min-h-screen flex-col lg:grid lg:h-dvh lg:min-h-0 lg:grid-cols-[20rem_1fr] lg:overflow-hidden">
      <PublicSidebar
        nav={nav}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />
      <PublicTopbar onOpenNav={() => setNavOpen(true)} />

      <div className="flex flex-1 flex-col lg:col-start-2 lg:row-start-1 lg:min-h-0">
        <div className="flex min-h-12 shrink-0 items-center justify-between gap-4 border-b-1 border-black bg-surface px-4 py-2 sm:h-20 sm:px-6 sm:py-0 lg:px-12">
          {breadcrumb}
          <AccountButton className="hidden shrink-0 lg:flex" />
        </div>

        <main className="flex flex-1 flex-col px-3.5 py-4 sm:px-6 sm:py-10 lg:overflow-y-auto lg:px-12">
          <div className="my-auto w-full">{children}</div>
        </main>

        <BarKredit className="min-h-14 shrink-0 px-6 py-1.5 lg:px-12" />
      </div>
    </div>
  );
}
