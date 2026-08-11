import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Menu,
} from 'lucide-react';
import type { ReaderNavigationController } from '@/features/reader/hooks/useReaderNavigationController';

interface MobileReaderNavigationBarProps {
  controller: ReaderNavigationController;
  title: string;
  currentPageIndex: number;
  totalPages: number;
  onToggleThumbnails: () => void;
  onBackToLibrary: () => void;
}

export function MobileReaderNavigationBar({
  controller,
  title,
  currentPageIndex,
  totalPages,
  onToggleThumbnails,
  onBackToLibrary,
}: MobileReaderNavigationBarProps) {
  if (controller.isMobileNavigationHidden) {
    return (
      <div className="fixed bottom-4 right-4 z-40 lg:hidden">
        <button
          type="button"
          onClick={controller.showMobileNavigation}
          className="reader-modal rounded-2xl p-3 transition-all hover:scale-[1.02]"
          aria-label="Tampilkan kontrol baca"
        >
          <Eye className="h-6 w-6" />
        </button>
      </div>
    );
  }

  return (
    <nav
      aria-label="Navigasi baca"
      className="fixed bottom-0 left-0 right-0 z-40 flex flex-col gap-2 border-t border-default bg-card/95 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_34px_rgba(0,0,0,0.22)] backdrop-blur-xl lg:hidden"
    >
      <div className="flex items-center justify-between gap-2 max-[380px]:grid max-[380px]:grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] max-[380px]:gap-2">
        <button
          type="button"
          onClick={onBackToLibrary}
          className="btn-secondary flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl max-[380px]:col-start-1 max-[380px]:row-start-1"
          aria-label="Kembali ke koleksi"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={controller.goPrevious}
          disabled={!controller.canGoPrevious}
          className="flex h-12 w-14 items-center justify-center rounded-2xl bg-primary text-inverse transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 max-[380px]:col-start-1 max-[380px]:row-start-2 max-[380px]:h-14 max-[380px]:w-full"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="h-7 w-7" />
        </button>

        <div className="flex min-w-0 flex-1 flex-col items-center gap-1 max-[380px]:col-start-2 max-[380px]:row-span-2 max-[380px]:self-stretch max-[380px]:justify-center">
          <p className="w-full truncate text-center text-[11px] font-bold text-secondary">{title}</p>
          <button
            type="button"
            onClick={onToggleThumbnails}
            className="reader-soft-panel w-full rounded-xl border border-default px-3 py-2 text-xs font-extrabold text-primary shadow-sm"
          >
            {controller.pageLabel}
          </button>
          <input
            type="range"
            min={0}
            max={totalPages}
            value={currentPageIndex}
            onChange={controller.selectPage}
            className="h-1.5 w-full cursor-pointer accent-brand-green"
            aria-label="Pilih halaman"
          />
        </div>

        <button
          type="button"
          onClick={controller.goNext}
          disabled={!controller.canGoNext}
          className="flex h-12 w-14 items-center justify-center rounded-2xl bg-brand-green text-white transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 max-[380px]:col-start-3 max-[380px]:row-start-2 max-[380px]:h-14 max-[380px]:w-full"
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="h-7 w-7" />
        </button>

        <button
          type="button"
          ref={controller.mobileToolsTriggerRef}
          onClick={controller.openMobileTools}
          aria-expanded={controller.isMobileToolsOpen}
          aria-controls="mobile-reader-tools"
          aria-haspopup="dialog"
          className="btn-secondary flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl max-[380px]:col-start-3 max-[380px]:row-start-1"
          aria-label="Buka alat baca"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <button
        type="button"
        onClick={controller.hideMobileNavigation}
        className="inline-flex items-center gap-1 self-center rounded-lg px-2 py-1 text-[10px] font-bold text-secondary"
      >
        <EyeOff className="h-3.5 w-3.5" />
        Sembunyikan kontrol
      </button>
    </nav>
  );
}
