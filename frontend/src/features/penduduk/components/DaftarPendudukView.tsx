import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import type { FilterOpsi, FilterPenduduk } from '../types';
import type {
  PendudukDetailView as PendudukDetailData,
  PendudukRow,
} from '../view-model';
import { PaginasiPenduduk, type PaginasiView } from './PaginasiPenduduk';
import { PendudukDetailView } from './PendudukDetailView';
import { TabelPenduduk } from './TabelPenduduk';
import { ToolbarPenduduk } from './ToolbarPenduduk';

export type { PaginasiView };

interface DaftarPendudukViewProps {
  search: string;
  onSearchChange: (value: string) => void;
  filter: FilterPenduduk;
  filterOpsi: FilterOpsi | undefined;
  onFilterChange: (next: FilterPenduduk) => void;
  isLoading: boolean;
  isError: boolean;
  rows: PendudukRow[] | undefined;
  paginasi: PaginasiView | null;
  onPrev: () => void;
  onNext: () => void;
  onPilih: (row: PendudukRow) => void;
  detail: PendudukDetailData | null;
  onTutupDetail: () => void;
  onTambah: () => void;
  onUbah: (id: string) => void;
  onHapus: (row: PendudukRow) => void;
  onEkspor?: (format: 'xlsx' | 'csv') => void;
  isExporting?: boolean;
}

export function DaftarPendudukView({
  search,
  onSearchChange,
  filter,
  filterOpsi,
  onFilterChange,
  isLoading,
  isError,
  rows,
  paginasi,
  onPrev,
  onNext,
  onPilih,
  detail,
  onTutupDetail,
  onTambah,
  onUbah,
  onHapus,
  onEkspor,
  isExporting,
}: DaftarPendudukViewProps) {
  return (
    <>
      <Card>
        <CardContent className="border-b-1 border-black">
          <ToolbarPenduduk
            search={search}
            onSearchChange={onSearchChange}
            value={filter}
            opsi={filterOpsi}
            onChange={onFilterChange}
            onTambah={onTambah}
            onEkspor={onEkspor}
            isExporting={isExporting}
          />
        </CardContent>

        <CardContent className="p-0">
          <QueryBoundary
            isLoading={isLoading}
            isError={isError}
            data={rows}
            isEmpty={(r) => r.length === 0}
            errorMessage="Gagal memuat data penduduk. Silakan muat ulang halaman."
            empty={
              <EmptyState
                icon={Search}
                title="Tidak ada data"
                description="Tidak ada penduduk yang cocok dengan pencarian dan filter Anda."
              />
            }
          >
            {(daftar) => (
              <TabelPenduduk
                rows={daftar}
                onPilih={onPilih}
                onUbah={onUbah}
                onHapus={onHapus}
              />
            )}
          </QueryBoundary>
        </CardContent>

        {paginasi && (
          <PaginasiPenduduk
            paginasi={paginasi}
            onPrev={onPrev}
            onNext={onNext}
          />
        )}
      </Card>

      <Modal
        open={Boolean(detail)}
        onClose={onTutupDetail}
        title="Detail Penduduk"
      >
        {detail && <PendudukDetailView detail={detail} />}
      </Modal>
    </>
  );
}
