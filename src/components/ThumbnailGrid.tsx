import React from 'react';
import { Story } from '../types';
import { StoryIllustration } from './Illustrations';
import { X, BookOpen } from 'lucide-react';

interface ThumbnailGridProps {
  story: Story;
  currentPageIndex: number;
  onSelectPage: (index: number) => void;
  onClose: () => void;
  isNight?: boolean;
}

export const ThumbnailGrid: React.FC<ThumbnailGridProps> = ({
  story,
  currentPageIndex,
  onSelectPage,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-overlay)] backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="reader-modal w-full sm:max-w-4xl max-h-[88dvh] sm:max-h-[85vh] rounded-t-[1.35rem] sm:rounded-[1.35rem] flex flex-col overflow-hidden">
        <div className="p-4 sm:p-5 border-b reader-divider flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-brand-green text-white shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-black font-sans mb-0">Daftar halaman</h3>
              <p className="text-xs text-secondary truncate">{story.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl btn-secondary shrink-0"
            aria-label="Tutup daftar halaman"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 sm:p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {story.pages.map((page, idx) => {
            const isCurrent = idx === currentPageIndex;
            return (
              <button
                key={page.pageNumber}
                onClick={() => {
                  onSelectPage(idx);
                  onClose();
                }}
                className={`group relative rounded-2xl overflow-hidden text-left transition-all duration-200 flex min-h-[118px] sm:min-h-0 ${
                  isCurrent
                    ? 'ring-2 ring-brand-green bg-brand-green/10'
                    : 'reader-soft-panel hover:border-brand-blue'
                }`}
              >
                <div className="relative w-28 sm:w-full sm:aspect-[4/3] shrink-0 overflow-hidden">
                  <StoryIllustration type={page.illustrationType} />
                  <div className="absolute top-2 left-2 rounded-lg bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
                    Hal {page.pageNumber}
                  </div>
                </div>

                <div className="flex-1 sm:absolute sm:bottom-0 sm:left-0 sm:right-0 p-3 bg-transparent sm:bg-surface/95 text-primary">
                  <h4 className="font-extrabold text-xs sm:text-sm truncate">
                    {page.title || `Halaman ${page.pageNumber}`}
                  </h4>
                  <p className="text-[11px] sm:text-[10px] text-secondary line-clamp-3 sm:line-clamp-2 mt-1">
                    {page.text}
                  </p>
                  {isCurrent && (
                    <span className="mt-2 inline-flex rounded-md bg-brand-green px-2 py-0.5 text-[10px] font-black text-white">
                      Sedang dibaca
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
