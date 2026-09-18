import { Headset } from 'lucide-react';
import { usePadukuhan } from '@/hooks/use-padukuhan';

export function TombolPengaduan() {
  const padukuhan = usePadukuhan();

  return (
    <a
      href={`mailto:${padukuhan.email}?subject=${encodeURIComponent('Pengaduan Warga')}`}
      className="focus-ring flex h-9 items-center gap-1.5 rounded-full bg-rose-600 px-3.5 text-xs font-semibold text-white shadow-md transition-colors hover:bg-rose-700 sm:text-sm"
    >
      <Headset className="h-4 w-4" aria-hidden />
      Pengaduan
    </a>
  );
}
