import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

const BISA_FOKUS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [contenteditable="true"], [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: ModalProps) {
  const kotak = useRef<HTMLDivElement>(null);
  const isiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const sebelumnya = document.activeElement;
    const scrollAsli = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    kotak.current?.focus({ preventScroll: true });

    if (isiRef.current) {
      isiRef.current.scrollTop = 0;
    }
    const timer = setTimeout(() => {
      if (isiRef.current) {
        isiRef.current.scrollTop = 0;
      }
    }, 50);

    return () => {
      document.body.style.overflow = scrollAsli;
      clearTimeout(timer);
      if (sebelumnya instanceof HTMLElement) sebelumnya.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !kotak.current) return;

      const isi = kotak.current.querySelectorAll<HTMLElement>(BISA_FOKUS);
      if (isi.length === 0) return;
      const pertama = isi[0];
      const terakhir = isi[isi.length - 1];

      if (e.shiftKey && document.activeElement === pertama) {
        e.preventDefault();
        terakhir.focus();
      } else if (!e.shiftKey && document.activeElement === terakhir) {
        e.preventDefault();
        pertama.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={kotak}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col rounded-xl border-1 border-black bg-surface shadow-xl sm:max-h-[90vh]',
          className,
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b-1 border-black px-4 py-3 sm:px-5">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-md p-1 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Tutup modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div ref={isiRef} className="flex-1 overflow-y-auto p-4 sm:p-5">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
