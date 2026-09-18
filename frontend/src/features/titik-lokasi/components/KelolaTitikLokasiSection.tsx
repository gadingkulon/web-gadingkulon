import { useState } from 'react';
import {
  ExternalLink,
  Home,
  Landmark,
  Pencil,
  Plus,
  Shield,
  Sparkles,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type { KategoriTitik, TitikLokasi } from '../types';
import { dapatkanTemaTitik } from '../warna';
import {
  useHapusTitikLokasi,
  useTitikLokasiAdminList,
} from '../hooks/use-titik-lokasi';
import { DialogUbahTitikLokasi } from './DialogUbahTitikLokasi';

function IkonBadge({ item }: { item: TitikLokasi }) {
  const tema = dapatkanTemaTitik(item);
  const iconClass = cn('h-6 w-6 shrink-0 mt-0.5', tema.textIkon);

  switch (item.ikon) {
    case 'balai':
      return <Landmark className={iconClass} />;
    case 'ibadah':
      return <Home className={iconClass} />;
    case 'poskamling':
      return <Shield className={iconClass} />;
    case 'posyandu':
      return <Sparkles className={iconClass} />;
    case 'perangkat':
    default:
      return <UserCheck className={iconClass} />;
  }
}

export function KelolaTitikLokasiSection() {
  const {
    data: daftarTitik = [],
    isLoading,
    isError,
  } = useTitikLokasiAdminList();
  const hapusMutasi = useHapusTitikLokasi();

  const [tabAktif, setTabAktif] = useState<'semua' | KategoriTitik>('semua');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [titikDipilih, setTitikDipilih] = useState<TitikLokasi | null>(null);
  const [hapusId, setHapusId] = useState<string | null>(null);

  const titikTerfilter = daftarTitik.filter((t) => {
    if (tabAktif === 'semua') return true;
    return t.kategori === tabAktif;
  });

  const jumlahFasilitas = daftarTitik.filter(
    (t) => t.kategori === 'fasilitas',
  ).length;
  const jumlahPerangkat = daftarTitik.filter(
    (t) => t.kategori === 'perangkat',
  ).length;

  const bukaTambah = () => {
    setTitikDipilih(null);
    setDialogOpen(true);
  };

  const bukaUbah = (titik: TitikLokasi) => {
    setTitikDipilih(titik);
    setDialogOpen(true);
  };

  const konfirmasiHapus = async (id: string, nama: string) => {
    if (window.confirm(`Yakin ingin menghapus titik lokasi "${nama}"?`)) {
      setHapusId(id);
      try {
        await hapusMutasi.mutateAsync(id);
      } finally {
        setHapusId(null);
      }
    }
  };

  return (
    <Card className="overflow-hidden">
      {/* Toolbar: Tab Kategori di kiri & Tombol Tambah di kanan */}
      <div className="flex flex-col gap-3 border-b-1 border-black bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-3.5">
        {/* Tab Navigasi Kategori */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTabAktif('semua')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
              tabAktif === 'semua'
                ? 'shadow-xs bg-slate-900 text-white'
                : 'border-1 border-black bg-white text-slate-800 hover:bg-slate-100 hover:text-slate-900',
            )}
          >
            Semua Titik
            <span
              className={cn(
                'py-0.2 ml-1 rounded-full px-1.5 text-2xs font-extrabold',
                tabAktif === 'semua'
                  ? 'bg-white/25 text-white'
                  : 'bg-slate-200 text-slate-900',
              )}
            >
              {daftarTitik.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTabAktif('fasilitas')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
              tabAktif === 'fasilitas'
                ? 'shadow-xs bg-teal-700 text-white'
                : 'border-1 border-black bg-white text-slate-800 hover:bg-slate-100 hover:text-slate-900',
            )}
          >
            Fasilitas Umum
            <span
              className={cn(
                'py-0.2 ml-1 rounded-full px-1.5 text-2xs font-extrabold',
                tabAktif === 'fasilitas'
                  ? 'bg-white/25 text-white'
                  : 'bg-slate-200 text-slate-900',
              )}
            >
              {jumlahFasilitas}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTabAktif('perangkat')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
              tabAktif === 'perangkat'
                ? 'shadow-xs bg-blue-700 text-white'
                : 'border-1 border-black bg-white text-slate-800 hover:bg-slate-100 hover:text-slate-900',
            )}
          >
            Perangkat Desa
            <span
              className={cn(
                'py-0.2 ml-1 rounded-full px-1.5 text-2xs font-extrabold',
                tabAktif === 'perangkat'
                  ? 'bg-white/25 text-white'
                  : 'bg-slate-200 text-slate-900',
              )}
            >
              {jumlahPerangkat}
            </span>
          </button>
        </div>

        {/* Tombol Tambah Titik Baru */}
        <button
          type="button"
          onClick={bukaTambah}
          className="shadow-xs inline-flex shrink-0 cursor-pointer items-center gap-1.5 self-start rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-bold text-white transition-all hover:bg-brand-700 active:scale-95 active:bg-brand-800 sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Titik Baru</span>
        </button>
      </div>

      {isError && (
        <div className="p-4 pb-0 sm:p-6">
          <Alert tone="error">
            Gagal memuat daftar titik lokasi. Pastikan sambungan ke backend
            aktif.
          </Alert>
        </div>
      )}

      {/* Konten Daftar Titik Lokasi Langsung di Dalam Container (Tanpa Box Tambahan) */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-500 sm:text-sm">
          Memuat daftar titik lokasi…
        </div>
      ) : titikTerfilter.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <p className="text-sm font-medium text-slate-500">
            {tabAktif === 'fasilitas'
              ? 'Belum ada fasilitas umum'
              : tabAktif === 'perangkat'
                ? 'Belum ada perangkat desa'
                : 'Belum ada titik lokasi'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-black">
          {titikTerfilter.map((item) => (
            <div
              key={item.id}
              className="sm:py-4.5 flex flex-col justify-between gap-4 px-4 py-4 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:px-6"
            >
              <div className="flex min-w-0 items-start gap-3.5">
                <IkonBadge item={item} />
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 sm:text-base">
                      {item.nama}
                    </span>
                    <span
                      className={cn(
                        'shadow-2xs rounded px-2 py-0.5 text-2xs font-extrabold uppercase tracking-wider text-white',
                        dapatkanTemaTitik(item).bgBadge,
                      )}
                    >
                      {item.kategoriLabel}
                    </span>
                    {item.peran && (
                      <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-2xs font-bold tracking-wider text-white">
                        {item.peran}
                      </span>
                    )}
                  </div>
                  {item.deskripsi && (
                    <p className="line-clamp-2 max-w-xl text-xs font-medium text-slate-700 sm:text-sm">
                      {item.deskripsi}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 pt-0.5 text-xs text-slate-600">
                    <span>
                      Koordinat:{' '}
                      <strong className="font-mono font-bold text-slate-900">
                        X {item.x}% / Y {item.y}%
                      </strong>
                    </span>
                    {item.googleMapsUrl && (
                      <a
                        href={item.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Google Maps</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Aksi Tombol Edit & Hapus yang Selaras & Seimbang */}
              <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => bukaUbah(item)}
                  className="shadow-2xs inline-flex cursor-pointer items-center justify-center rounded-lg border-1 border-black bg-white p-1.5 text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 active:bg-slate-200"
                  title="Edit titik lokasi"
                  aria-label={`Edit ${item.nama}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => konfirmasiHapus(item.id, item.nama)}
                  disabled={hapusId === item.id}
                  className="shadow-2xs inline-flex cursor-pointer items-center justify-center rounded-lg border-1 border-black bg-white p-1.5 text-rose-600 transition-all hover:border-black hover:bg-rose-50 hover:text-rose-600 active:scale-95 disabled:opacity-50"
                  title="Hapus titik lokasi"
                  aria-label={`Hapus ${item.nama}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DialogUbahTitikLokasi
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        titik={titikDipilih}
      />
    </Card>
  );
}
