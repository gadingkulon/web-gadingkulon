import { Mail, Phone } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import { useAppleScrollFade } from '@/hooks/use-apple-scroll-fade';
import { usePadukuhan } from '@/hooks/use-padukuhan';
import { paths } from '@/routes/paths';
import { BarKredit } from './BarKredit';
import { PublicNavbar } from './PublicNavbar';

const JELAJAHI = [
  { label: 'Beranda', to: paths.landing },
  { label: 'Profil Desa', to: paths.profil },
  { label: 'Infografis', to: paths.infografis },
  { label: 'Berita', to: paths.berita },
  { label: 'Statistik', to: paths.statistik },
];

export function PublicShell() {
  const padukuhan = usePadukuhan();
  useAppleScrollFade();

  return (
    <div className="flex min-h-dvh min-h-screen flex-col bg-slate-50">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>

      <div className="bg-brand-950 text-brand-100">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div>
            <p className="text-lg font-bold text-white">
              {padukuhan.namaLengkap}
            </p>
            <p className="mt-2 text-sm">
              {padukuhan.desa}, {padukuhan.kapanewon}
              <br />
              {padukuhan.kabupaten}, {padukuhan.provinsi}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-300">
              Hubungi Kami
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href={`tel:${padukuhan.telepon.replace(/[^+\d]/g, '')}`}
                  className="flex items-center gap-2 hover:text-white"
                >
                  <Phone className="h-4 w-4 shrink-0" aria-hidden />
                  {padukuhan.telepon}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${padukuhan.email}`}
                  className="flex items-center gap-2 hover:text-white"
                >
                  <Mail className="h-4 w-4 shrink-0" aria-hidden />
                  {padukuhan.email}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-300">
              Jelajahi
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {JELAJAHI.map((j) => (
                <li key={j.to}>
                  <Link to={j.to} className="hover:text-white">
                    {j.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <BarKredit className="min-h-14 shrink-0 px-4 py-1.5 sm:px-6 lg:px-8" />
    </div>
  );
}
