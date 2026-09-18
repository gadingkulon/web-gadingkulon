import { WADAH } from '@/components/layout/wadah';
import { PetaPadukuhan } from '@/components/ui/PetaPadukuhan';
import { paths } from '@/routes/paths';
import ikonProfil from '@/assets/icons/Profil-padukuhan-icon.png';
import ikonStatistik from '@/assets/icons/Stastistik-Kependudukan-icon.png';
import ikonKabar from '@/assets/icons/kabar&agenda-icon.png';
import { BeritaTerkini } from './components/BeritaTerkini';
import { HeroBeranda } from './components/HeroBeranda';
import { JudulBagian } from './components/JudulBagian';
import { KartuJelajah } from './components/KartuJelajah';
import { RingkasanPenduduk } from './components/RingkasanPenduduk';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroBeranda />

      <section className={`${WADAH} py-8 sm:py-16`}>
        <div data-apple-fade>
          <JudulBagian judul="JELAJAHI PADUKUHAN" className="uppercase" />
        </div>
        <div className="grid gap-2.5 sm:gap-6 md:grid-cols-3">
          <div
            data-apple-fade
            data-apple-delay="1"
            className="flex h-full flex-col"
          >
            <KartuJelajah
              ke={paths.profil}
              judul="Profil Padukuhan"
              deskripsi="Struktur kelembagaan dan informasi wilayah."
              ikon={
                <img
                  src={ikonProfil}
                  alt=""
                  width={144}
                  height={144}
                  loading="lazy"
                  decoding="async"
                  className="h-10 w-10 object-contain sm:h-12 sm:w-12"
                />
              }
            />
          </div>
          <div
            data-apple-fade
            data-apple-delay="2"
            className="flex h-full flex-col"
          >
            <KartuJelajah
              ke={paths.infografis}
              judul="Statistik Kependudukan"
              deskripsi="Visualisasi data demografi dan sebaran warga."
              ikon={
                <img
                  src={ikonStatistik}
                  alt=""
                  width={144}
                  height={144}
                  loading="lazy"
                  decoding="async"
                  className="h-10 w-10 object-contain sm:h-12 sm:w-12"
                />
              }
            />
          </div>
          <div
            data-apple-fade
            data-apple-delay="3"
            className="flex h-full flex-col"
          >
            <KartuJelajah
              ke={paths.berita}
              judul="Kabar & Agenda Warga"
              deskripsi="Informasi kegiatan terkini dan agenda warga."
              ikon={
                <img
                  src={ikonKabar}
                  alt=""
                  width={144}
                  height={144}
                  loading="lazy"
                  decoding="async"
                  className="h-10 w-10 object-contain sm:h-12 sm:w-12"
                />
              }
            />
          </div>
        </div>
      </section>

      <RingkasanPenduduk />

      <section className={`${WADAH} py-10 sm:py-16`}>
        <div data-apple-fade>
          <JudulBagian judul="PETA PADUKUHAN" className="uppercase" />
        </div>
        <div data-apple-fade>
          <PetaPadukuhan className="aspect-[2432/832] w-full sm:min-h-[14rem]" />
        </div>
      </section>

      <BeritaTerkini />
    </div>
  );
}
