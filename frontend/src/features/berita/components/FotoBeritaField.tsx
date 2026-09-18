import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { bacaFoto } from '../foto';
import { bantuFotoUrl } from '../utils';

interface FotoBeritaFieldProps {
  value: string;
  onChange: (dataUrl: string) => void;
}

export function FotoBeritaField({ value, onChange }: FotoBeritaFieldProps) {
  const [error, setError] = useState<string | null>(null);
  const [namaFile, setNamaFile] = useState<string>('');

  const onPilih = async (berkas: File | undefined) => {
    if (!berkas) return;
    setNamaFile(berkas.name);
    const hasil = await bacaFoto(berkas);
    if ('galat' in hasil) {
      setError(hasil.galat);
      return;
    }
    setError(null);
    onChange(hasil.dataUrl);
  };

  const src = bantuFotoUrl(value);

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        Foto Sampul
      </label>
      {src && (
        <div className="mb-2.5 flex items-center gap-3">
          <img
            src={src}
            alt="Pratinjau foto utama"
            className="shadow-xs h-20 w-32 rounded-lg border-1 border-black object-cover"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            onClick={() => {
              setNamaFile('');
              onChange('');
            }}
          >
            Hapus foto
          </Button>
        </div>
      )}
      <div className="flex items-center gap-3">
        <label
          htmlFor="foto-sampul-input"
          className="shadow-xs inline-flex cursor-pointer items-center gap-2 rounded-lg border-1 border-black bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-900 transition-colors focus-within:outline-none hover:bg-slate-100 active:bg-slate-200"
        >
          <Upload className="h-4 w-4 text-slate-800" />
          <span>Pilih File</span>
          <input
            id="foto-sampul-input"
            type="file"
            accept="image/*"
            onChange={(e) => void onPilih(e.target.files?.[0])}
            className="sr-only"
          />
        </label>
        <span className="max-w-[220px] truncate text-xs text-slate-600 sm:max-w-xs sm:text-sm">
          {namaFile ||
            (src ? 'Foto telah terpasang' : 'Belum ada file dipilih')}
        </span>
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      ) : (
        <p className="mt-1.5 text-xs text-slate-500">
          Opsional. JPG/PNG. Foto besar otomatis diperkecil, dan metadata
          lokasinya dibuang sebelum terbit.
        </p>
      )}
    </div>
  );
}
