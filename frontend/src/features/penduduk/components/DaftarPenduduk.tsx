import { useMemo, useState } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { pesanError } from '@/lib/utils';
import type { FilterPenduduk } from '../types';
import {
  useFilterOpsi,
  useHapusPenduduk,
  usePendudukList,
} from '../hooks/use-penduduk';
import { pendudukApi } from '../api/penduduk-api';
import type { Penduduk } from '../types';
import {
  toPendudukDetail,
  toPendudukRow,
  type PendudukRow,
} from '../view-model';
import { WargaFormDialog } from './WargaFormDialog';
import { DaftarPendudukView, type PaginasiView } from './DaftarPendudukView';

const PAGE_SIZE = 8;

export function DaftarPenduduk() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterPenduduk>({});
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formTarget, setFormTarget] = useState<Penduduk | 'baru' | null>(null);
  const [targetHapus, setTargetHapus] = useState<PendudukRow | null>(null);
  const [pesanErrorHapus, setPesanErrorHapus] = useState<string | null>(null);
  const [pesanErrorEkspor, setPesanErrorEkspor] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const debouncedSearch = useDebounce(search);
  const { data: filterOpsi } = useFilterOpsi();
  const hapusMutation = useHapusPenduduk();

  const params = useMemo(
    () => ({ page, pageSize: PAGE_SIZE, search: debouncedSearch, ...filter }),
    [page, debouncedSearch, filter],
  );
  const { data, isLoading, isError, isFetching } = usePendudukList(params);

  const rows = useMemo(() => data?.items.map(toPendudukRow), [data]);

  const detail = useMemo(() => {
    const terpilih = data?.items.find((p) => p.id === selectedId);
    return terpilih ? toPendudukDetail(terpilih) : null;
  }, [data, selectedId]);

  const paginasi: PaginasiView | null = useMemo(() => {
    if (!data || data.total === 0) return null;
    const totalHalaman = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
    const dari = (page - 1) * PAGE_SIZE + 1;
    const sampai = Math.min(page * PAGE_SIZE, data.total);
    return {
      ringkasan: `${dari}–${sampai} dari ${data.total}`,
      halaman: page,
      totalHalaman,
      bisaMundur: page > 1,
      bisaMaju: page < totalHalaman,
      sedangMenyegarkan: isFetching,
    };
  }, [data, page, isFetching]);

  function onSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function onFilterChange(next: FilterPenduduk) {
    setFilter(next);

    setPage(1);
  }

  function onUbah(id: string) {
    const warga = data?.items.find((p) => p.id === id);
    if (warga) setFormTarget(warga);
  }

  function onHapus(row: PendudukRow) {
    setTargetHapus(row);
    setPesanErrorHapus(null);
  }

  async function handleEkspor(format: 'xlsx' | 'csv') {
    try {
      setIsExporting(true);
      setPesanErrorEkspor(null);
      const blob = await pendudukApi.ekspor({
        search: debouncedSearch,
        ...filter,
        format,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const tgl = new Date().toISOString().slice(0, 10);
      a.download = `data-penduduk-${tgl}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setPesanErrorEkspor(
        pesanError(err, 'Gagal mengekspor data penduduk. Silakan coba lagi.'),
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      {pesanErrorEkspor && (
        <div className="mb-4">
          <Alert tone="error">{pesanErrorEkspor}</Alert>
        </div>
      )}
      <DaftarPendudukView
        search={search}
        onSearchChange={onSearchChange}
        filter={filter}
        filterOpsi={filterOpsi}
        onFilterChange={onFilterChange}
        isLoading={isLoading}
        isError={isError}
        rows={rows}
        paginasi={paginasi}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => p + 1)}
        onPilih={(row) => setSelectedId(row.id)}
        detail={detail}
        onTutupDetail={() => setSelectedId(null)}
        onTambah={() => setFormTarget('baru')}
        onUbah={onUbah}
        onHapus={onHapus}
        onEkspor={handleEkspor}
        isExporting={isExporting}
      />
      <WargaFormDialog
        target={formTarget}
        onClose={() => setFormTarget(null)}
      />

      <Modal
        open={Boolean(targetHapus)}
        onClose={() => {
          if (!hapusMutation.isPending) {
            setTargetHapus(null);
            setPesanErrorHapus(null);
          }
        }}
        title="Hapus Warga (Salah Input)"
        className="max-w-md"
      >
        {targetHapus && (
          <div className="space-y-4">
            <div className="rounded-lg border-1 border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
              <p className="mb-1 font-semibold">
                Khusus Data Salah Input / Fiktif
              </p>
              <p className="text-xs leading-relaxed text-amber-800">
                Fitur ini{' '}
                <strong>hanya untuk data yang salah dimasukkan</strong> (misal
                salah ketik nama atau duplikat input). Jika warga{' '}
                <strong>pindah keluar</strong> atau{' '}
                <strong>meninggal dunia</strong>, jangan dihapus! Gunakan tombol{' '}
                <strong>Ubah Data</strong> lalu ganti Status Kependudukannya
                agar tercatat di buku mutasi desa.
              </p>
            </div>

            <p className="text-sm text-slate-700">
              Apakah Anda yakin ingin menghapus data warga{' '}
              <strong className="font-semibold text-slate-900">
                {targetHapus.nama}
              </strong>{' '}
              ({targetHapus.id}) dari{' '}
              <strong className="font-semibold text-slate-900">
                {targetHapus.rtRw}
              </strong>
              ?
            </p>

            {pesanErrorHapus && (
              <div className="rounded-md border-1 border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-700">
                {pesanErrorHapus}
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTargetHapus(null);
                  setPesanErrorHapus(null);
                }}
                disabled={hapusMutation.isPending}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={hapusMutation.isPending}
                onClick={async () => {
                  try {
                    await hapusMutation.mutateAsync(targetHapus.id);
                    setTargetHapus(null);
                    setPesanErrorHapus(null);
                  } catch (err: unknown) {
                    const axiosErr = err as {
                      response?: { data?: { detail?: string } };
                    };
                    const detail = axiosErr?.response?.data?.detail;
                    setPesanErrorHapus(
                      detail ||
                        'Gagal menghapus data warga. Silakan coba lagi.',
                    );
                  }
                }}
              >
                Hapus Warga
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
