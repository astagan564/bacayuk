import React from 'react';
import { Story } from '../types';
import { StoryIllustration } from './Illustrations';
import { X, Sparkles, BookOpen } from 'lucide-react';

interface ThumbnailGridProps {
  story: Story;
  currentPageIndex: number;
  onSelectPage: (index: number) => void;
  onClose: () => void;
}

export const ThumbnailGrid: React.FC<ThumbnailGridProps> = ({
  story,
  currentPageIndex,
  onSelectPage,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-amber-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-amber-900 border-2 border-amber-600 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-amber-950/60 border-b border-amber-800 flex items-center justify-between text-amber-100">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-amber-400" />
            <div>
              <h3 className="text-lg font-bold text-amber-200">Daftar Halaman Cerita</h3>
              <p className="text-xs text-amber-400/80">{story.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-amber-800 hover:bg-amber-700 text-amber-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Thumbnail Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {story.pages.map((page, idx) => {
            const isCurrent = idx === currentPageIndex;
            return (
              <div
                key={page.pageNumber}
                onClick={() => {
                  onSelectPage(idx);
                  onClose();
                }}
                className={`group relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-200 transform hover:scale-105 shadow-md flex flex-col ${
                  isCurrent
                    ? 'border-amber-400 ring-4 ring-amber-400/50 scale-105'
                    : 'border-amber-700/50 hover:border-amber-400'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${page.colors.bgGradFrom}, ${page.colors.bgGradTo})`,
                }}
              >
                {/* Number Badge */}
                <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-200 text-xs font-bold border border-amber-700/50">
                  Hal {page.pageNumber}
                </div>

                {/* Thumbnail Illustration */}
                <div className="w-full aspect-[4/3] relative overflow-hidden">
                  <StoryIllustration type={page.illustrationType} />
                </div>

                {/* Page Title / Text Preview */}
                <div className="p-2.5 bg-amber-950/90 text-amber-100 text-xs">
                  <h4 className="font-bold text-amber-300 truncate">{page.title || `Halaman ${page.pageNumber}`}</h4>
                  <p className="text-[10px] text-amber-200/80 line-clamp-2 mt-0.5">{page.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
