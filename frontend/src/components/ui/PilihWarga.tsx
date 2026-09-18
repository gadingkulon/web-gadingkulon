import { cn } from '@/lib/utils';
import type { WargaPilihan } from '@/lib/warga-api';
import { Input } from './Input';

interface PilihWargaProps {
  label: string;
  cari: string;
  onCariChange: (nilai: string) => void;
  hasil: WargaPilihan[] | undefined;
  sedangMencari: boolean;
  terpilih: WargaPilihan | null;
  onPilih: (warga: WargaPilihan) => void;
  hint?: string;
}

function normalisasi(v?: string | null): string {
  if (!v) return '';
  const s = v.trim();
  return /^\d+$/.test(s) ? s.replace(/^0+/, '') || '0' : s;
}

export function PilihWarga({
  label,
  cari,
  onCariChange,
  hasil,
  sedangMencari,
  terpilih,
  onPilih,
  hint,
}: PilihWargaProps) {
  const cukupPanjang = cari.trim().length >= 2;

  return (
    <div className="space-y-2">
      <Input
        label={label}
        placeholder="Ketik nama…"
        hint={hint}
        value={cari}
        onChange={(e) => onCariChange(e.target.value)}
      />

      {terpilih && (
        <p className="text-sm text-slate-700">
          Terpilih: <strong>{terpilih.nama}</strong>{' '}
          <span className="text-xs text-slate-500">
            (RT {normalisasi(terpilih.rt)}/RW {normalisasi(terpilih.rw)})
          </span>
        </p>
      )}

      {cukupPanjang && (
        <div className="max-h-56 overflow-y-auto rounded-lg border-1 border-black">
          {sedangMencari && (
            <p className="px-3 py-2 text-sm text-slate-500">Mencari…</p>
          )}
          {!sedangMencari && hasil?.length === 0 && (
            <p className="px-3 py-2 text-sm text-slate-500">
              Tidak ada warga bernama itu.
            </p>
          )}
          {hasil?.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => onPilih(w)}
              className={cn(
                'flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50',
                terpilih?.id === w.id && 'font-bold text-brand-600',
              )}
            >
              <span>{w.nama}</span>
              <span className="text-xs text-slate-500">
                RT {normalisasi(w.rt)}/RW {normalisasi(w.rw)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
