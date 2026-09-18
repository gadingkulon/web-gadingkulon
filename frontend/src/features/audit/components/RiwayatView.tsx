import { History } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { Table, Td, Th } from '@/components/ui/Table';
import { cn } from '@/lib/utils';
import type { BarisRiwayat } from '../view-model';

interface RiwayatViewProps {
  isLoading: boolean;
  isError: boolean;
  baris: BarisRiwayat[] | undefined;
  kosongJudul: string;
  kosongKeterangan: string;
}

export function RiwayatView({
  isLoading,
  isError,
  baris,
  kosongJudul,
  kosongKeterangan,
}: RiwayatViewProps) {
  return (
    <Card className="overflow-hidden">
      <QueryBoundary
        isLoading={isLoading}
        isError={isError}
        data={baris}
        isEmpty={(b) => b.length === 0}
        errorMessage="Gagal memuat riwayat perubahan."
        empty={
          <EmptyState
            icon={History}
            title={kosongJudul}
            description={kosongKeterangan}
          />
        }
      >
        {(daftar) => (
          <Table className="w-full">
            <thead>
              <tr>
                <Th className="w-44 whitespace-nowrap px-4 py-3 sm:w-48 sm:px-5">
                  Waktu
                </Th>
                <Th className="w-28 whitespace-nowrap px-4 py-3 sm:px-5">
                  Oleh
                </Th>
                <Th className="min-w-[240px] whitespace-nowrap px-4 py-3 sm:px-5">
                  Tindakan
                </Th>
                <Th className="w-64 whitespace-nowrap px-4 py-3 sm:w-80 sm:px-5">
                  Yang Diubah
                </Th>
              </tr>
            </thead>
            <tbody>
              {daftar.map((b, index) => {
                const isLast = index === daftar.length - 1;
                return (
                  <tr
                    key={b.id}
                    className="align-top transition-colors hover:bg-slate-50/80"
                  >
                    <Td
                      className={cn(
                        'whitespace-nowrap px-4 py-3.5 sm:px-5',
                        isLast && 'border-b-0',
                      )}
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">
                          {b.waktu}
                        </span>
                        <span className="mt-0.5 font-mono text-xs font-medium text-slate-500">
                          {b.jam} WIB
                        </span>
                      </div>
                    </Td>

                    <Td
                      className={cn(
                        'whitespace-nowrap px-4 py-3.5 sm:px-5',
                        isLast && 'border-b-0',
                      )}
                    >
                      <span className="shadow-2xs inline-flex items-center rounded-md border-1 border-black bg-white px-2 py-0.5 font-mono text-xs font-bold text-slate-800">
                        {b.aktor}
                      </span>
                    </Td>

                    <Td
                      className={cn(
                        'whitespace-normal px-4 py-3.5 sm:px-5',
                        isLast && 'border-b-0',
                      )}
                    >
                      <p className="text-sm font-bold text-slate-900">
                        {b.aksi}
                      </p>
                      {b.sasaran && (
                        <p className="mt-0.5 text-xs font-medium leading-relaxed text-slate-600 sm:text-sm">
                          {b.sasaran}
                        </p>
                      )}
                    </Td>

                    <Td
                      className={cn(
                        'whitespace-normal px-4 py-3.5 sm:px-5',
                        isLast && 'border-b-0',
                      )}
                    >
                      {b.perubahan.length === 0 && !b.catatan && (
                        <span className="font-sans text-sm text-slate-400">
                          —
                        </span>
                      )}
                      {b.catatan && (
                        <p className="text-xs font-medium text-slate-600 sm:text-sm">
                          {b.catatan}
                        </p>
                      )}
                      {b.perubahan.length > 0 && (
                        <div className="space-y-1.5">
                          {b.perubahan.map((p) => (
                            <div
                              key={p.kolom}
                              className="rounded-md border-1 border-black bg-slate-50 px-2.5 py-1.5 text-xs font-medium"
                            >
                              <span className="font-bold capitalize text-slate-900">
                                {p.kolom}:{' '}
                              </span>
                              <span className="text-rose-600 line-through">
                                {p.lama || '(kosong)'}
                              </span>
                              <span className="mx-1.5 font-bold text-slate-400">
                                →
                              </span>
                              <span className="font-bold text-emerald-700">
                                {p.baru || '(kosong)'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </QueryBoundary>
    </Card>
  );
}
