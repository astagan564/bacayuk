import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface QrisImageLightboxProps {
  imageUrl: string;
  amount: number;
  onClose: () => void;
}

export function QrisImageLightbox({ imageUrl, amount, onClose }: QrisImageLightboxProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const keepDialogFocused = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };
    closeButtonRef.current?.focus();
    window.addEventListener('keydown', keepDialogFocused);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', keepDialogFocused);
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qris-preview-title"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-fade-in sm:p-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-full w-full max-w-2xl flex-col items-center rounded-3xl bg-white p-4 text-slate-950 shadow-2xl sm:p-6">
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-slate-900 p-2.5 text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-brand-blue/40"
          aria-label="Tutup tampilan QRIS"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-3 pr-12 text-center">
          <p className="text-xs font-extrabold uppercase tracking-wider text-brand-blue">QRIS BacaYuk</p>
          <h3 id="qris-preview-title" className="mb-0 mt-1 text-xl font-black text-slate-950">
            Scan untuk membayar Rp {amount.toLocaleString('id-ID')}
          </h3>
        </div>
        <img
          src={imageUrl}
          alt={`QRIS BacaYuk senilai Rp ${amount.toLocaleString('id-ID')}`}
          className="max-h-[calc(100dvh-10rem)] min-h-0 w-auto max-w-full rounded-2xl object-contain"
        />
        <p className="mt-3 text-center text-xs font-semibold text-slate-600">
          Tekan tombol tutup, area gelap, atau tombol Escape untuk kembali.
        </p>
      </div>
    </div>,
    document.body,
  );
}
