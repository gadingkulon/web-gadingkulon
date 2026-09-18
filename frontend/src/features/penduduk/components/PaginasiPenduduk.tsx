import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface PaginasiView {
  ringkasan: string;
  halaman: number;
  totalHalaman: number;
  bisaMundur: boolean;
  bisaMaju: boolean;

  sedangMenyegarkan: boolean;
}

interface PaginasiPendudukProps {
  paginasi: PaginasiView;
  onPrev: () => void;
  onNext: () => void;
}

export function PaginasiPenduduk({
  paginasi,
  onPrev,
  onNext,
}: PaginasiPendudukProps) {
  return (
    <div className="flex flex-col gap-2.5 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:text-sm">
      <span>
        {paginasi.ringkasan}
        {paginasi.sedangMenyegarkan && ' · memperbarui…'}
      </span>
      <div className="flex w-full items-center justify-between gap-1 sm:w-auto sm:justify-end">
        <Button
          size="sm"
          variant="outline"
          disabled={!paginasi.bisaMundur}
          onClick={onPrev}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-2">
          {paginasi.halaman} / {paginasi.totalHalaman}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={!paginasi.bisaMaju}
          onClick={onNext}
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
