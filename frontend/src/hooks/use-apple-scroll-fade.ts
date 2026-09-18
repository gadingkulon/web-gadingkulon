import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook scroll fade ala Apple eksklusif mobile (< 1024px).
 * Memunculkan elemen secara dramatis & nyata saat pengguna menggulir ke bawah di HP.
 *
 * FITUR KEAMANAN & ANTI-BUG:
 * 1. Setiap elemen yang sudah pernah muncul (atau berada di atas viewport)
 *    DITANDAI secara permanen via data attribute `data-apple-revealed="true"`
 *    dan class `apple-fade-in`. Elemen ini TIDAK AKAN PERNAH disembunyikan lagi,
 *    meskipun pengguna menggulir sampai ke paling bawah atau komponen di-re-render oleh React.
 * 2. Setelah animasi selesai, ditambahkan class `apple-fade-done` untuk melepaskan
 *    layer komposit GPU (transform: none, filter: none) sehingga memori HP tetap lega
 *    dan browser tidak membuang tile/elemen di atas (anti layer-dropping).
 * 3. Di desktop (>= 1024px) dinonaktifkan sepenuhnya (100% normal tanpa animasi).
 */
export function useAppleScrollFade() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Proteksi ketat: Hanya aktif di mobile (< 1024px)
    if (typeof window === 'undefined' || window.innerWidth >= 1024) return;

    // Hormati preferensi reduced-motion
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (prefersReducedMotion) return;

    const revealElement = (el: HTMLElement, immediate = false) => {
      if (el.getAttribute('data-apple-revealed') === 'true') {
        // Pastikan class tidak hilang jika tertimpa re-render React
        if (!el.classList.contains('apple-fade-in')) {
          el.classList.add('apple-fade-in');
        }
        return;
      }

      el.setAttribute('data-apple-revealed', 'true');
      el.classList.add('apple-fade-in');

      if (immediate) {
        el.classList.add('apple-fade-done');
      } else {
        // Lepas beban GPU setelah transisi selesai agar memori ponsel tidak drop
        setTimeout(() => {
          el.classList.add('apple-fade-done');
        }, 900);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            revealElement(target);
            observer.unobserve(target);
          }
        });
      },
      {
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.08,
      },
    );

    const checkAndObserveElements = () => {
      if (window.innerWidth >= 1024) return;

      const elements =
        document.querySelectorAll<HTMLElement>('[data-apple-fade]');
      const windowHeight = window.innerHeight;
      const isAtBottom =
        window.scrollY + windowHeight >=
        document.documentElement.scrollHeight - 60;

      elements.forEach((el) => {
        // Jika sudah ditandai terungkap, pertahankan statusnya
        if (el.getAttribute('data-apple-revealed') === 'true') {
          if (!el.classList.contains('apple-fade-in')) {
            el.classList.add('apple-fade-in');
          }
          return;
        }

        // Jika halaman sudah di paling bawah, pastikan SEMUA elemen langsung terungkap
        if (isAtBottom) {
          revealElement(el, true);
          return;
        }

        const rect = el.getBoundingClientRect();

        // Jika elemen berada di atas viewport (sudah dilewati pengguna saat scroll)
        // ATAU berada di area awal (25% atas viewport), langsung tampilkan agar tidak pernah hilang!
        if (
          rect.bottom <= windowHeight * 0.35 ||
          rect.top < windowHeight * 0.25
        ) {
          revealElement(el, true);
        } else {
          observer.observe(el);
        }
      });
    };

    // Jalankan segera dan amati mutasi DOM (misal data React Query masuk)
    checkAndObserveElements();
    const timer = setTimeout(checkAndObserveElements, 50);

    const mutationObserver = new MutationObserver(() => {
      checkAndObserveElements();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Event listener scroll pasif untuk memastikan tidak ada elemen yang tertinggal
    // saat scrolling cepat / momentum flick di ponsel
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.innerWidth < 1024) {
            const unrevealed = document.querySelectorAll<HTMLElement>(
              '[data-apple-fade]:not([data-apple-revealed="true"])',
            );
            const windowHeight = window.innerHeight;
            const isNearBottom =
              window.scrollY + windowHeight >=
              document.documentElement.scrollHeight - 80;

            unrevealed.forEach((el) => {
              if (isNearBottom) {
                revealElement(el, true);
                observer.unobserve(el);
                return;
              }
              const rect = el.getBoundingClientRect();
              if (rect.top < windowHeight * 0.88) {
                revealElement(el);
                observer.unobserve(el);
              }
            });
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        observer.disconnect();
        mutationObserver.disconnect();
        window.removeEventListener('scroll', handleScroll);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [pathname]);
}
