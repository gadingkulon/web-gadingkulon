import { useEffect, useState } from 'react';
import { Accessibility } from 'lucide-react';
import { useDismissOnOutside } from '@/hooks/use-dismiss-on-outside';
import { bacaLokal, cn, tulisLokal } from '@/lib/utils';

const KUNCI = 'siduk.skalaTeks';

const SKALA = [
  { label: 'A', persen: 100 },
  { label: 'A', persen: 115 },
  { label: 'A', persen: 130 },
] as const;

function terapkan(persen: number): void {
  document.documentElement.style.fontSize = `${persen}%`;
}

function skalaTersimpan(): number {
  const angka = Number(bacaLokal(KUNCI));
  return SKALA.some((s) => s.persen === angka) ? angka : 100;
}

export function AksesibilitasWidget() {
  const [open, setOpen] = useState(false);
  const [persen, setPersen] = useState(100);

  useEffect(() => {
    const tersimpan = skalaTersimpan();
    setPersen(tersimpan);
    terapkan(tersimpan);
  }, []);

  const pilih = (nilai: number) => {
    setPersen(nilai);
    terapkan(nilai);
    tulisLokal(KUNCI, String(nilai));
  };

  const ref = useDismissOnOutside<HTMLDivElement>(open, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Pengaturan aksesibilitas"
        aria-haspopup="menu"
        aria-expanded={open}
        className="focus-ring flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white shadow-md transition-all duration-200 hover:scale-110 hover:bg-brand-700 hover:shadow-lg active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100"
      >
        <Accessibility className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-11 right-0 w-52 rounded-xl border-1 border-black bg-surface p-3 shadow-xl"
        >
          <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Ukuran Teks
          </p>
          <div className="flex gap-2">
            {SKALA.map((s) => (
              <button
                key={s.persen}
                type="button"
                onClick={() => pilih(s.persen)}
                aria-pressed={persen === s.persen}
                className={cn(
                  'flex-1 rounded-lg border-1 py-2 font-bold transition-all duration-150 active:scale-95',
                  persen === s.persen
                    ? 'border-brand-600 text-brand-600 shadow-sm'
                    : 'border-1 border-black text-slate-700 hover:border-black hover:bg-slate-50',
                )}
                style={{ fontSize: `${0.8 + (s.persen - 100) / 200}rem` }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
