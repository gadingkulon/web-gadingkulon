import { useState } from 'react';
import { ExternalLink, MapPin, Maximize2 } from 'lucide-react';
import mapImage from '@/assets/Maps-frontend.webp';
import { Modal } from '@/components/ui/Modal';
import { usePadukuhan } from '@/hooks/use-padukuhan';
import { GOOGLE_MAPS_URL } from '@/lib/padukuhan';
import { cn } from '@/lib/utils';

export function PetaPadukuhan({ className }: { className?: string }) {
  const { namaLengkap } = usePadukuhan();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div
        className={cn(
          'group relative aspect-[2432/832] overflow-hidden rounded-xl border-1 border-black bg-slate-100 shadow-sm transition-all hover:shadow-md sm:rounded-2xl',
          className,
        )}
        aria-label={`Peta Wilayah ${namaLengkap}`}
      >
        <img
          src={mapImage}
          alt={`Peta Wilayah ${namaLengkap}`}
          className="h-full w-full object-contain object-center transition-transform duration-300 group-hover:scale-[1.01] sm:object-cover"
          loading="lazy"
          decoding="async"
        />

        {/* Tombol langsung buka Google Maps */}
        <a
          href={GOOGLE_MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-lg border-1 border-black bg-white/95 px-2.5 py-1 text-2xs font-semibold text-slate-800 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:text-brand-600 hover:shadow-md sm:left-3 sm:top-3 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs"
          title="Buka lokasi di Google Maps"
        >
          <MapPin className="h-3 w-3 shrink-0 text-rose-500 sm:h-3.5 sm:w-3.5" />
          <span className="sm:hidden">Google Maps</span>
          <span className="hidden sm:inline">Buka di Google Maps</span>
          <ExternalLink className="h-2.5 w-2.5 shrink-0 text-slate-800 sm:h-3 sm:w-3" />
        </a>

        {/* Tombol Lihat Peta Penuh Eksplisit */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setModalOpen(true);
          }}
          className="pointer-events-auto absolute bottom-2.5 right-2.5 z-10 flex cursor-pointer items-center gap-1 rounded-lg bg-black/75 px-2.5 py-1 text-2xs font-medium text-white shadow-sm backdrop-blur-sm transition-all hover:scale-105 hover:bg-black/90 active:scale-95 sm:bottom-3 sm:right-3 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs"
          title="Buka denah peta ukuran penuh"
        >
          <Maximize2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          <span>Lihat Peta Penuh</span>
        </button>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Denah Peta Wilayah ${namaLengkap}`}
        className="max-w-5xl"
      >
        <div className="space-y-4">
          <div className="relative aspect-[2432/832] overflow-hidden rounded-lg bg-slate-950">
            <img
              src={mapImage}
              alt={`Peta Wilayah ${namaLengkap}`}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex flex-col justify-between gap-2.5 border-t-1 border-black pt-3 sm:flex-row sm:items-center sm:gap-3">
            <p className="text-xs text-slate-500">
              Koordinat pusat padukuhan: -7.656826, 110.363111
            </p>
            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>Buka di Google Maps</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </Modal>
    </>
  );
}
