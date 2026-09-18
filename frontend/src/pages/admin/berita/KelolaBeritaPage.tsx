import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { Table, Td, Th } from '@/components/ui/Table';
import { BeritaFormDialog } from '@/features/berita/components/BeritaFormDialog';
import { FotoBerita } from '@/features/berita/components/BeritaCard';
import {
  useBeritaList,
  useHapusBerita,
} from '@/features/berita/hooks/use-berita';
import type { Berita } from '@/features/berita/types';
import { formatTanggal } from '@/lib/tanggal';
import { cn, pesanError } from '@/lib/utils';
import { paths } from '@/routes/paths';

export default function KelolaBeritaPage() {
  const { data, isLoading, isError } = useBeritaList();
  const hapus = useHapusBerita();
  const [target, setTarget] = useState<Berita | 'baru' | null>(null);
  const [beritaDihapus, setBeritaDihapus] = useState<Berita | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setTarget('baru')}>+ Tulis Berita</Button>
      </div>

      {hapus.isError && (
        <Alert tone="error">
          {pesanError(hapus.error, 'Berita gagal dihapus.')}
        </Alert>
      )}

      <Card className="overflow-hidden shadow-sm">
        <QueryBoundary
          isLoading={isLoading}
          isError={isError}
          data={data}
          isEmpty={(d) => d.length === 0}
          loadingLabel="Memuat berita"
          errorMessage="Daftar berita belum bisa ditampilkan."
          emptyTitle="Belum ada berita"
          emptyDescription="Mulai dengan menekan Tulis Berita."
        >
          {(daftar) => (
            <Table className="w-full min-w-[600px]">
              <thead>
                <tr>
                  <Th className="w-[45%] min-w-[200px]">Berita</Th>
                  <Th className="w-[20%] min-w-[120px]">Tanggal Kejadian</Th>
                  <Th className="w-[20%] min-w-[120px]">Penulis</Th>
                  <Th className="w-[15%] min-w-[100px] text-right">Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {daftar.map((berita, index) => {
                  const isLast = index === daftar.length - 1;
                  return (
                    <tr
                      key={berita.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <Td
                        className={cn(
                          'whitespace-normal',
                          isLast && 'border-b-0',
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <FotoBerita
                            berita={berita}
                            className="h-12 w-16 shrink-0 rounded-md"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">
                              {berita.judul}
                            </p>
                            <Link
                              to={paths.beritaDetail(berita.slug)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              <span>Lihat Berita</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      </Td>
                      <Td
                        className={cn(
                          'font-medium text-slate-800',
                          isLast && 'border-b-0',
                        )}
                      >
                        {formatTanggal(berita.tanggalTerbit)}
                      </Td>
                      <Td
                        className={cn(
                          'font-medium text-slate-800',
                          isLast && 'border-b-0',
                        )}
                      >
                        {berita.penulis}
                      </Td>
                      <Td className={cn('text-right', isLast && 'border-b-0')}>
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setTarget(berita)}
                            className="shadow-2xs inline-flex cursor-pointer items-center justify-center rounded-lg border-1 border-black bg-white p-1.5 text-slate-900 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 active:bg-slate-200"
                            title="Sunting berita"
                            aria-label={`Sunting ${berita.judul}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              hapus.reset();
                              setBeritaDihapus(berita);
                            }}
                            className="shadow-2xs inline-flex cursor-pointer items-center justify-center rounded-lg border-1 border-black bg-white p-1.5 text-rose-600 transition-all hover:border-black hover:bg-rose-50 hover:text-rose-600 active:scale-95 disabled:opacity-50"
                            title="Hapus berita"
                            aria-label={`Hapus ${berita.judul}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </QueryBoundary>
      </Card>

      <BeritaFormDialog target={target} onClose={() => setTarget(null)} />

      <Modal
        open={beritaDihapus !== null}
        onClose={() => {
          if (!hapus.isPending) setBeritaDihapus(null);
        }}
        title="Hapus Berita"
        className="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Apakah Anda yakin ingin menghapus berita{' '}
            <span className="font-semibold text-slate-900">
              “{beritaDihapus?.judul}”
            </span>
            ? Tindakan ini tidak dapat dibatalkan.
          </p>

          {hapus.isError && (
            <Alert tone="error">
              {pesanError(hapus.error, 'Gagal menghapus berita.')}
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBeritaDihapus(null)}
              disabled={hapus.isPending}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={hapus.isPending}
              onClick={async () => {
                if (!beritaDihapus) return;
                try {
                  await hapus.mutateAsync(beritaDihapus.id);
                  setBeritaDihapus(null);
                } catch {
                  // Pesan error ditangani oleh Alert di atas
                }
              }}
            >
              Ya, Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
