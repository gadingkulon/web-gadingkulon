import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Role } from '@/types/auth';

export const PERAN_LOGIN = [
  {
    role: 'ADMIN' as Role,
    label: 'Admin',
    judul: 'Masuk sebagai Admin',
    contoh: 'admin',
    catatan: 'Mengelola akun pengurus. Tidak bisa melihat data warga.',
  },
  {
    role: 'DUKUH' as Role,
    label: 'Dukuh',
    judul: 'Masuk sebagai Dukuh',
    contoh: 'dukuh',
    catatan: 'Melihat seluruh data warga & infografis padukuhan.',
  },
  {
    role: 'RW' as Role,
    label: 'Ketua RW',
    judul: 'Masuk sebagai Ketua RW',
    contoh: 'rw19',
    catatan: 'Melihat seluruh data warga & infografis padukuhan.',
  },
  {
    role: 'RT' as Role,
    label: 'Ketua RT',
    judul: 'Masuk sebagai Ketua RT',
    contoh: 'rt1',
    catatan: 'Melihat seluruh data warga & infografis padukuhan.',
  },
] as const;

interface Props {
  dipilih: Role;
  onPilih: (role: Role) => void;
}

export function PilihanPeranLogin({ dipilih, onPilih }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<Role, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const btn = buttonRefs.current.get(dipilih);
    const container = containerRef.current;
    if (!btn || !container) return;

    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setIndicator({
      left: btnRect.left - containerRect.left,
      width: btnRect.width,
    });

    if (!ready) requestAnimationFrame(() => setReady(true));
  }, [dipilih, ready]);

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label="Pilih peran"
      className="relative mt-4 grid grid-cols-4 rounded-xl bg-slate-100 p-1"
    >
      <span
        aria-hidden
        className={cn(
          'absolute inset-y-1 rounded-lg bg-surface shadow-sm',
          ready &&
            'duration-250 transition-all ease-[cubic-bezier(0.4,0,0.2,1)]',
        )}
        style={{ left: indicator.left, width: indicator.width }}
      />

      {PERAN_LOGIN.map((p) => (
        <button
          key={p.role}
          ref={(el) => {
            if (el) buttonRefs.current.set(p.role, el);
          }}
          type="button"
          role="tab"
          aria-selected={dipilih === p.role}
          onClick={() => onPilih(p.role)}
          className={cn(
            'focus-ring relative z-10 h-11 truncate rounded-lg px-1 text-xs transition-colors duration-200 sm:px-2 sm:text-sm',
            dipilih === p.role
              ? 'font-bold text-brand-700'
              : 'font-medium text-slate-500 hover:text-slate-700',
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
