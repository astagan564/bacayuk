import type { Dispatch, SetStateAction } from 'react';
import type { Story } from '@/types';
import { sentenceCaseTitle } from '@/features/book-studio/helpers/storyDraft';

interface PageCanvasPageListProps {
  story: Story;
  activePageIndex: number;
  onAddPage: () => void;
  onPreviewPageChange: Dispatch<SetStateAction<number>>;
}

export function PageCanvasPageList({
  story,
  activePageIndex,
  onAddPage,
  onPreviewPageChange,
}: PageCanvasPageListProps) {
  return (
    <aside className="overflow-hidden border-b border-default bg-surface p-3 xl:border-b-0 xl:border-r">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[11px] font-black text-secondary">Halaman</span>
        <button
          type="button"
          onClick={onAddPage}
          className="rounded-lg bg-brand-green px-2 py-1 text-[10px] font-black text-white"
        >
          + Halaman
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pr-1 xl:max-h-[calc(100dvh-20rem)] xl:flex-col xl:overflow-x-hidden xl:overflow-y-auto">
        {story.pages.map((page, pageIndex) => (
          <button
            key={`${page.pageNumber}-${pageIndex}`}
            type="button"
            onClick={() => onPreviewPageChange(pageIndex)}
            aria-current={activePageIndex === pageIndex ? 'page' : undefined}
            className={`min-w-32 rounded-xl p-2 text-left transition-all lg:min-w-0 ${
              activePageIndex === pageIndex
                ? 'bg-brand-green text-white shadow-sm'
                : 'text-primary hover:bg-surface-hover'
            }`}
          >
            <span className="block text-[10px] font-black opacity-75">
              {pageIndex === 0 ? 'Cover' : `Halaman ${pageIndex + 1}`}
            </span>
            <span className="mt-1 block line-clamp-2 text-[11px] font-black">
              {page.title || sentenceCaseTitle(page.text, `Halaman ${pageIndex + 1}`)}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}
