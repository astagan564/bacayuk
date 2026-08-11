import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReaderNavigationController } from '@/features/reader/hooks/useReaderNavigationController';

interface DesktopReaderPageNavigationProps {
  controller: ReaderNavigationController;
  title: string;
  currentPageIndex: number;
  totalPages: number;
  onBackToLibrary: () => void;
}

export function DesktopReaderPageNavigation({
  controller,
  title,
  currentPageIndex,
  totalPages,
  onBackToLibrary,
}: DesktopReaderPageNavigationProps) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onBackToLibrary}
          className="btn-secondary flex w-full items-center gap-2 bg-surface px-3 py-2 text-xs text-secondary"
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
          Koleksi buku
        </button>
        <h2 className="mb-0 line-clamp-2 px-1 text-center font-sans text-sm font-bold leading-snug" title={title}>
          {title}
        </h2>
      </div>

      <div className="flex flex-col gap-1.5">
        <input
          type="range"
          min={0}
          max={totalPages}
          value={currentPageIndex}
          onChange={controller.selectPage}
          className="h-2 w-full cursor-pointer rounded-lg accent-brand-green"
          aria-label="Pilih halaman"
        />
        <div className="flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={controller.goPrevious}
            disabled={!controller.canGoPrevious}
            className="reader-soft-panel rounded-lg p-1 transition-colors disabled:opacity-30"
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="flex-1 text-center text-[11px] font-bold text-info" aria-live="polite">
            {controller.pageLabel}
          </span>
          <button
            type="button"
            onClick={controller.goNext}
            disabled={!controller.canGoNext}
            className="reader-soft-panel rounded-lg p-1 transition-colors disabled:opacity-30"
            aria-label="Halaman berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}
