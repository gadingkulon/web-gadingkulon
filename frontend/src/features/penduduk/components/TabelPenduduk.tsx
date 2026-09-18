import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Table, Td, Th } from '@/components/ui/Table';
import { statusDomisiliLabel } from '../labels';
import type { PendudukRow } from '../view-model';

interface TabelPendudukProps {
  rows: PendudukRow[];
  onPilih: (row: PendudukRow) => void;
  onUbah: (id: string) => void;
  onHapus: (row: PendudukRow) => void;
}

export function TabelPenduduk({
  rows,
  onPilih,
  onUbah,
  onHapus,
}: TabelPendudukProps) {
  return (
    <Table className="w-full min-w-[720px] table-fixed">
      <thead>
        <tr>
          <Th className="w-[28%] min-w-[160px]">Nama</Th>
          <Th className="w-[11%] min-w-[80px]">L/P</Th>
          <Th className="w-[8%] min-w-[60px]">Umur</Th>
          <Th className="w-[11%] min-w-[75px]">Agama</Th>
          <Th className="w-[9%] min-w-[70px]">RT/RW</Th>
          <Th className="w-[19%] min-w-[125px]">Keterangan</Th>
          <Th className="w-[14%] min-w-[125px] text-right">Aksi</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="transition-colors hover:bg-slate-50">
            <Td
              className="truncate font-medium text-slate-900"
              title={row.nama}
            >
              {row.nama}
            </Td>
            <Td>{row.jenisKelamin}</Td>
            <Td className="tabular-nums">{row.umur}</Td>
            <Td>{row.agama}</Td>
            <Td className="tabular-nums text-slate-600">{row.rtRw}</Td>
            <Td>
              <div className="flex flex-wrap items-center gap-1.5">
                {row.keteranganTone ? (
                  <Badge
                    tone={row.keteranganTone}
                    className="rounded-md font-medium"
                    title={
                      row.catatanKematian
                        ? `${row.keterangan}: ${row.catatanKematian}`
                        : undefined
                    }
                  >
                    {row.catatanKematian
                      ? `${row.keterangan} (${row.catatanKematian})`
                      : row.keterangan}
                  </Badge>
                ) : row.catatanKematian ? (
                  <Badge
                    tone="slate"
                    className="rounded-md font-medium"
                    title={row.catatanKematian}
                  >
                    Meninggal ({row.catatanKematian})
                  </Badge>
                ) : null}
                {row.statusDomisili === 'KONTRAK' && (
                  <Badge tone="amber" className="rounded-md font-semibold">
                    {statusDomisiliLabel.KONTRAK}
                  </Badge>
                )}
                {row.bansos?.map((b) => (
                  <Badge
                    key={b}
                    tone={b === 'BPNT' ? 'green' : 'brand'}
                    className="rounded-md font-medium"
                  >
                    {b}
                  </Badge>
                ))}
                {row.catatanPerkawinan && (
                  <Badge
                    tone="red"
                    className="rounded-md text-2xs font-medium"
                    title={row.catatanPerkawinan}
                  >
                    {row.catatanPerkawinan}
                  </Badge>
                )}
                {!row.keteranganTone &&
                  row.statusDomisili !== 'KONTRAK' &&
                  (!row.bansos || row.bansos.length === 0) &&
                  !row.catatanPerkawinan &&
                  !row.catatanKematian && (
                    <span className="text-xs text-slate-400">-</span>
                  )}
              </div>
            </Td>
            {/* Aksi */}
            <Td className="text-right">
              <div className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPilih(row)}
                  className="shadow-2xs inline-flex cursor-pointer items-center justify-center rounded-lg border-1 border-black bg-white p-1.5 text-slate-900 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 active:bg-slate-200"
                  title="Lihat detail"
                  aria-label={`Lihat detail ${row.nama}`}
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onUbah(row.id)}
                  className="shadow-2xs inline-flex cursor-pointer items-center justify-center rounded-lg border-1 border-black bg-white p-1.5 text-slate-900 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 active:bg-slate-200"
                  title="Ubah data"
                  aria-label={`Ubah data ${row.nama}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onHapus(row)}
                  className="shadow-2xs inline-flex cursor-pointer items-center justify-center rounded-lg border-1 border-black bg-white p-1.5 text-rose-600 transition-all hover:border-black hover:bg-rose-50 hover:text-rose-600 active:scale-95 disabled:opacity-50"
                  title="Hapus warga (salah input)"
                  aria-label={`Hapus warga ${row.nama}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
