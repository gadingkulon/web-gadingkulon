import { Link } from 'react-router-dom';
import { WADAH } from '@/components/layout/wadah';
import { usePadukuhan } from '@/hooks/use-padukuhan';
import { paths } from '@/routes/paths';
import latarHero from '@/assets/hero-beranda.webp';

export function HeroBeranda() {
  const padukuhan = usePadukuhan();

  return (
    <section className="relative isolate overflow-hidden">
      <img
        src={latarHero}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-[#3b1368]/90 via-[#3b1368]/70 to-transparent"
        aria-hidden
      />

      <div className={`${WADAH} relative py-12 sm:py-20 lg:py-28`}>
        <div className="max-w-2xl text-center lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-200 sm:text-sm">
            {padukuhan.desa} · {padukuhan.kapanewon}
          </p>
          <h1 className="mt-2 text-2xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            Selamat Datang di Website Resmi{' '}
            <span className="text-amber-300">{padukuhan.namaLengkap}</span>
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-brand-100 sm:mt-5 sm:text-base lg:mx-0">
            Pusat informasi resmi layanan kependudukan, statistik wilayah, dan
            kabar kegiatan masyarakat {padukuhan.namaLengkap}, {padukuhan.desa}.
          </p>

          <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4 lg:justify-start">
            <Link
              to={paths.profil}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#FACC15] px-4 text-sm font-bold text-[#4C1D95] shadow-sm transition-all duration-150 ease-out hover:-translate-y-0.5 hover:bg-yellow-400 hover:shadow-md active:translate-y-0 active:scale-[0.98] motion-reduce:hover:translate-y-0 sm:h-12 sm:w-auto sm:px-6 sm:text-base"
            >
              Jelajahi Padukuhan
            </Link>
            <Link
              to={paths.statistik}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg border-1 border-white/70 bg-transparent px-4 text-sm font-semibold text-white transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-white hover:bg-white/10 hover:shadow-md active:translate-y-0 active:scale-[0.98] motion-reduce:hover:translate-y-0 sm:h-12 sm:w-auto sm:px-6 sm:text-base"
            >
              Statistik
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
