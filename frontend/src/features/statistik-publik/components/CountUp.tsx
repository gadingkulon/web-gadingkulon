import { useEffect, useState } from 'react';
import { formatAngka } from '@/lib/utils';

const DURASI_MS = 900;

interface CountUpProps {
  value: number;
  className?: string;
}

export function CountUp({ value, className }: CountUpProps) {
  const [tampil, setTampil] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTampil(value);
      return;
    }

    let frame = 0;
    const mulai = performance.now();

    const langkah = (kini: number) => {
      const t = Math.min((kini - mulai) / DURASI_MS, 1);

      setTampil(Math.round(value * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(langkah);
    };

    frame = requestAnimationFrame(langkah);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span className={className}>{formatAngka(tampil)}</span>;
}
