import { useEffect, useRef } from 'react';
import { formatAngka } from '@/lib/utils';

interface UseCountUpOptions {
  duration?: number;
  suffix?: string;
}

// Kurva akselerasi easeOutQuart: berakselerasi cepat di awal lalu melambat sangat halus di akhir
function easeOutQuart(x: number): number {
  return 1 - Math.pow(1 - x, 4);
}

export function useCountUp(
  targetValue: number,
  options: UseCountUpOptions = {},
) {
  const { duration, suffix = '' } = options;
  const textRef = useRef<HTMLSpanElement | null>(null);
  const currentValRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const hasAnimatedRef = useRef<boolean>(false);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    // Aksesibilitas: hormati pengguna yang mematikan animasi
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || targetValue <= 0) {
      currentValRef.current = targetValue;
      el.textContent = `${formatAngka(targetValue)}${suffix}`;
      return;
    }

    // Durasi adaptif agar angka kecil tidak terasa lambat dan angka besar tetap mulus
    const adaptiveDuration =
      duration ?? (targetValue < 20 ? 400 : targetValue < 200 ? 700 : 900);

    const startVal = currentValRef.current;
    const diff = targetValue - startVal;

    // Jika selisihnya 0, tidak perlu animasi
    if (diff === 0) {
      el.textContent = `${formatAngka(targetValue)}${suffix}`;
      return;
    }

    function runAnimation() {
      let lastRenderedVal = startVal;
      const startTime = performance.now();

      function step(currentTime: number) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / adaptiveDuration, 1);
        const ease = easeOutQuart(progress);
        const currentInt = Math.round(startVal + diff * ease);

        // Throttling DOM: hanya perbarui DOM jika nilai bulatnya benar-benar berubah
        if (currentInt !== lastRenderedVal) {
          lastRenderedVal = currentInt;
          currentValRef.current = currentInt;
          if (el) {
            el.textContent = `${formatAngka(currentInt)}${suffix}`;
          }
        }

        if (progress < 1) {
          rafIdRef.current = requestAnimationFrame(step);
        } else {
          currentValRef.current = targetValue;
          if (el) {
            el.textContent = `${formatAngka(targetValue)}${suffix}`;
          }
          rafIdRef.current = null;
        }
      }

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = requestAnimationFrame(step);
    }

    // Jika sudah pernah terlihat dan targetValue berubah (misal ganti periode bulan), langsung animasikan transisi
    if (hasAnimatedRef.current) {
      runAnimation();
      return;
    }

    // Jalankan hanya saat elemen masuk ke dalam viewport layar
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimatedRef.current) {
          hasAnimatedRef.current = true;
          // Set angka awal 0 saat pertama kali muncul sebelum berhitung naik
          el.textContent = `${formatAngka(0)}${suffix}`;
          runAnimation();
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [targetValue, duration, suffix]);

  return { textRef };
}
