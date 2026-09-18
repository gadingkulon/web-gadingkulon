import { useState } from 'react';
import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useDismissOnOutside } from '@/hooks/use-dismiss-on-outside';
import { cn } from '@/lib/utils';
import type { FilterOpsi, FilterPenduduk } from '../types';
import {
  agamaLabel,
  bansosLabel,
  filterLabel,
  golonganDarahLabel,
  jenisKelaminLabel,
  kelompokUmurOpsi,
  pendidikanLabel,
  statusDomisiliLabel,
  statusHubunganLabel,
  statusKependudukanLabel,
  statusPerkawinanLabel,
  toFilterChips,
} from '../labels';

type Opsi = readonly [nilai: string, teks: string];

const LANJUTAN = [
  'statusKependudukan',
  'statusDomisili',
  'jenisKelamin',
  'kelompokUmur',
  'agama',
  'pendidikan',
  'statusPerkawinan',
  'statusHubunganKeluarga',
  'golonganDarah',
  'pekerjaan',
  'bansos',
] as const satisfies readonly (keyof FilterPenduduk)[];

interface ToolbarPendudukProps {
  search: string;
  onSearchChange: (value: string) => void;
  value: FilterPenduduk;

  opsi: FilterOpsi | undefined;
  onChange: (next: FilterPenduduk) => void;
  onTambah: () => void;
  onEkspor?: (format: 'xlsx' | 'csv') => void;
  isExporting?: boolean;
}

function dariLabel(map: Record<string, string>): Opsi[] {
  return Object.entries(map);
}

function normalisasiWilayah(v: string | null | undefined): string {
  if (!v) return '';
  const bersih = v.trim();
  return /^\d+$/.test(bersih) ? bersih.replace(/^0+/, '') || '0' : bersih;
}

function dariWilayah(nilai: string[] | undefined): Opsi[] {
  const unik = Array.from(new Set((nilai ?? []).map(normalisasiWilayah)));
  return unik.map((v) => [v, v] as Opsi);
}

function dariData(nilai: string[] | undefined): Opsi[] {
  return (nilai ?? []).map((v) => [v, v] as Opsi);
}

function PilihanRingkas({
  label,
  nilai,
  opsi,
  onPilih,
  className,
}: {
  label: string;
  nilai: string | undefined;
  opsi: Opsi[];
  onPilih: (v: string) => void;
  className?: string;
}) {
  return (
    <select
      aria-label={label}
      value={nilai ?? ''}
      onChange={(e) => onPilih(e.target.value)}
      className={cn(
        'focus-ring h-10 w-full rounded-lg border-1 bg-surface px-3 text-sm transition-colors sm:w-auto',
        nilai
          ? 'border-brand-600 font-medium text-brand-700'
          : 'border-1 border-black text-slate-900 hover:border-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black',
        className,
      )}
    >
      <option value="">{label}: Semua</option>
      {opsi.map(([v, teks]) => {
        const teksTampil = teks.startsWith(label) ? teks : `${label}: ${teks}`;
        return (
          <option key={v} value={v} className="bg-surface text-slate-900">
            {teksTampil}
          </option>
        );
      })}
    </select>
  );
}

function PilihanPanel({
  field,
  nilai,
  opsi,
  onPilih,
}: {
  field: keyof FilterPenduduk;
  nilai: string | undefined;
  opsi: Opsi[];
  onPilih: (field: keyof FilterPenduduk, v: string) => void;
}) {
  return (
    <Select
      name={field}
      label={filterLabel[field]}
      value={nilai ?? ''}
      onChange={(e) => onPilih(field, e.target.value)}
    >
      <option value="">Semua</option>
      {opsi.map(([v, teks]) => (
        <option key={v} value={v} className="bg-surface text-slate-900">
          {teks}
        </option>
      ))}
    </Select>
  );
}

export function ToolbarPenduduk({
  search,
  onSearchChange,
  value,
  opsi,
  onChange,
  onTambah,
  onEkspor,
  isExporting,
}: ToolbarPendudukProps) {
  const { user } = useAuth();
  const isRT = user?.role === 'RT';
  const isRW = user?.role === 'RW';

  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useDismissOnOutside<HTMLDivElement>(panelOpen, () =>
    setPanelOpen(false),
  );
  const [eksporOpen, setEksporOpen] = useState(false);
  const eksporRef = useDismissOnOutside<HTMLDivElement>(eksporOpen, () =>
    setEksporOpen(false),
  );

  const set = (field: keyof FilterPenduduk, v: string) => {
    const next = { ...value };
    if (v) {
      next[field] = v as never;
    } else {
      delete next[field];
    }
    onChange(next);
  };

  const chips = toFilterChips(value).filter((chip) => {
    if (isRT && (chip.field === 'rt' || chip.field === 'rw')) return false;
    if (isRW && chip.field === 'rw') return false;
    return true;
  });
  const jumlahLanjutan = LANJUTAN.filter((f) => value[f]).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
        {/* Sisi Kiri: Search & Filter Wilayah */}
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="w-full sm:w-56 sm:flex-shrink-0 lg:w-64">
            <Input
              icon={<Search className="h-4 w-4" />}
              placeholder="Cari nama warga…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Cari nama warga"
            />
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
            {isRT ? (
              <>
                <div
                  className="flex h-10 items-center justify-center rounded-lg border-1 border-black bg-slate-100 px-3 text-sm font-semibold text-slate-800 shadow-sm sm:justify-start"
                  title={`Wilayah Anda: RW ${normalisasiWilayah(user?.rw)}`}
                >
                  <span className="mr-1.5 font-normal text-slate-500">RW:</span>
                  <span>{normalisasiWilayah(user?.rw)}</span>
                </div>
                <div
                  className="flex h-10 items-center justify-center rounded-lg border-1 border-black bg-slate-100 px-3 text-sm font-semibold text-slate-800 shadow-sm sm:justify-start"
                  title={`Wilayah Anda: RT ${normalisasiWilayah(user?.rt)}`}
                >
                  <span className="mr-1.5 font-normal text-slate-500">RT:</span>
                  <span>{normalisasiWilayah(user?.rt)}</span>
                </div>
              </>
            ) : isRW ? (
              <>
                <div
                  className="flex h-10 items-center justify-center rounded-lg border-1 border-black bg-slate-100 px-3 text-sm font-semibold text-slate-800 shadow-sm sm:justify-start"
                  title={`Wilayah Anda: RW ${normalisasiWilayah(user?.rw)}`}
                >
                  <span className="mr-1.5 font-normal text-slate-500">RW:</span>
                  <span>{normalisasiWilayah(user?.rw)}</span>
                </div>
                <PilihanRingkas
                  label="RT"
                  nilai={value.rt ? normalisasiWilayah(value.rt) : undefined}
                  opsi={dariWilayah(opsi?.rt)}
                  onPilih={(v) => set('rt', v)}
                />
              </>
            ) : (
              <>
                <PilihanRingkas
                  label="RW"
                  nilai={value.rw ? normalisasiWilayah(value.rw) : undefined}
                  opsi={dariWilayah(opsi?.rw)}
                  onPilih={(v) => set('rw', v)}
                />
                <PilihanRingkas
                  label="RT"
                  nilai={value.rt ? normalisasiWilayah(value.rt) : undefined}
                  opsi={dariWilayah(opsi?.rt)}
                  onPilih={(v) => set('rt', v)}
                />
              </>
            )}
          </div>
        </div>

        {/* Sisi Kanan: Aksi (Ekspor, Filter, Tambah) */}
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {onEkspor && (
            <div className="relative" ref={eksporRef}>
              <Button
                variant="outline"
                onClick={() => setEksporOpen((v) => !v)}
                disabled={isExporting}
                aria-haspopup="menu"
                aria-expanded={eksporOpen}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Ekspor
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>

              {eksporOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-30 mt-2 w-48 rounded-xl border-1 border-black bg-surface p-1 shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setEksporOpen(false);
                      onEkspor('xlsx');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-slate-900">
                        Excel (.xlsx)
                      </p>
                      <p className="text-xs text-slate-500">Format resmi</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setEksporOpen(false);
                      onEkspor('csv');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  >
                    <FileText className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-semibold text-slate-900">CSV (.csv)</p>
                      <p className="text-xs text-slate-500">Format teks</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="relative flex items-center gap-2" ref={panelRef}>
            <Button
              variant="outline"
              onClick={() => setPanelOpen((v) => !v)}
              aria-haspopup="dialog"
              aria-expanded={panelOpen}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter
              {jumlahLanjutan > 0 && (
                <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-semibold text-white">
                  {jumlahLanjutan}
                </span>
              )}
            </Button>

            <Button
              onClick={() => {
                setPanelOpen(false);
                onTambah();
              }}
            >
              <Plus className="h-4 w-4" />
              Tambah Warga
            </Button>

            {panelOpen && (
              <div
                role="dialog"
                aria-label="Filter lanjutan"
                className="absolute right-0 top-full z-30 mt-2 w-[calc(100vw-2rem)] max-w-sm rounded-xl border-1 border-black bg-surface p-4 shadow-lg sm:max-w-md"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-900">
                    Filter lanjutan
                  </p>
                  {jumlahLanjutan > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const next = { ...value };
                        for (const f of LANJUTAN) delete next[f];
                        onChange(next);
                      }}
                    >
                      Atur ulang
                    </Button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <PilihanPanel
                    field="statusKependudukan"
                    nilai={value.statusKependudukan}
                    opsi={dariLabel(statusKependudukanLabel)}
                    onPilih={set}
                  />
                  <PilihanPanel
                    field="statusDomisili"
                    nilai={value.statusDomisili}
                    opsi={dariLabel(statusDomisiliLabel)}
                    onPilih={set}
                  />
                  <PilihanPanel
                    field="jenisKelamin"
                    nilai={value.jenisKelamin}
                    opsi={dariLabel(jenisKelaminLabel)}
                    onPilih={set}
                  />
                  <PilihanPanel
                    field="kelompokUmur"
                    nilai={value.kelompokUmur}
                    opsi={kelompokUmurOpsi.map((u) => [u, `${u} th`] as Opsi)}
                    onPilih={set}
                  />
                  <PilihanPanel
                    field="agama"
                    nilai={value.agama}
                    opsi={dariLabel(agamaLabel)}
                    onPilih={set}
                  />
                  <PilihanPanel
                    field="pendidikan"
                    nilai={value.pendidikan}
                    opsi={dariLabel(pendidikanLabel)}
                    onPilih={set}
                  />
                  <PilihanPanel
                    field="statusPerkawinan"
                    nilai={value.statusPerkawinan}
                    opsi={dariLabel(statusPerkawinanLabel)}
                    onPilih={set}
                  />
                  <PilihanPanel
                    field="statusHubunganKeluarga"
                    nilai={value.statusHubunganKeluarga}
                    opsi={dariLabel(statusHubunganLabel)}
                    onPilih={set}
                  />
                  <PilihanPanel
                    field="golonganDarah"
                    nilai={value.golonganDarah}
                    opsi={dariLabel(golonganDarahLabel)}
                    onPilih={set}
                  />
                  <PilihanPanel
                    field="pekerjaan"
                    nilai={value.pekerjaan}
                    opsi={dariData(opsi?.pekerjaan)}
                    onPilih={set}
                  />
                  <div className="sm:col-span-2">
                    <PilihanPanel
                      field="bansos"
                      nilai={value.bansos}
                      opsi={
                        opsi?.bansos && opsi.bansos.length > 0
                          ? [
                              ['SEMUA', 'Semua Penerima Bansos'],
                              ['TIDAK', 'Bukan Penerima Bansos'],
                              ...opsi.bansos.map((b) => [b, b] as Opsi),
                            ]
                          : dariLabel(bansosLabel)
                      }
                      onPilih={set}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-2">
          {chips.map((chip) => (
            <span
              key={chip.field}
              className="inline-flex items-center gap-1.5 rounded-full border-1 border-black bg-slate-50 py-1 pl-3 pr-1.5 text-xs text-slate-700"
            >
              <span className="text-slate-500">{chip.label}:</span>
              <span className="font-medium">{chip.nilai}</span>
              <button
                type="button"
                onClick={() => set(chip.field, '')}
                aria-label={`Hapus filter ${chip.label}`}
                className="focus-ring rounded-full p-0.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          <Button size="sm" variant="ghost" onClick={() => onChange({})}>
            Hapus semua
          </Button>
        </div>
      )}
    </div>
  );
}
