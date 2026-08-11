import type { MouseEvent } from 'react';
import type { StoryPage } from '@/types';
import type { UpdateStoryPage } from '@/features/book-studio/types/pageCanvas';

interface PageCanvasWorkspaceProps {
  page: StoryPage;
  pageIndex: number;
  interactionPlaceMode: boolean;
  onUpdatePage: UpdateStoryPage;
  onCanvasInteractionClick: (
    event: MouseEvent<HTMLDivElement>,
    page: StoryPage,
    pageIndex: number,
  ) => void;
}

export function PageCanvasWorkspace({
  page,
  pageIndex,
  interactionPlaceMode,
  onUpdatePage,
  onCanvasInteractionClick,
}: PageCanvasWorkspaceProps) {
  return (
    <div className="min-w-0 bg-background p-4 sm:p-5">
      <div className="flex h-full min-h-[38rem] flex-col gap-4 rounded-2xl border border-default bg-surface p-4 sm:p-6">
        <div className="shrink-0">
          <input
            value={page.title || ''}
            onChange={(event) => onUpdatePage({ ...page, title: event.target.value })}
            className="w-full bg-transparent text-xl font-black outline-none placeholder:text-muted/70 sm:text-2xl"
            placeholder={`Judul halaman ${pageIndex + 1}`}
            aria-label={`Judul halaman ${pageIndex + 1}`}
          />
          <textarea
            value={page.text}
            onChange={(event) => onUpdatePage({ ...page, text: event.target.value })}
            rows={5}
            className="mt-4 w-full resize-none rounded-2xl border border-default bg-background p-4 text-sm font-bold leading-7 text-primary outline-none"
            placeholder="Teks cerita halaman ini"
            aria-label={`Teks cerita halaman ${pageIndex + 1}`}
          />
        </div>

        <div
          onClick={(event) => onCanvasInteractionClick(event, page, pageIndex)}
          className={`relative min-h-[20rem] flex-1 overflow-hidden rounded-2xl border border-default bg-background ${
            interactionPlaceMode ? 'cursor-crosshair ring-2 ring-[var(--story-green)]' : ''
          }`}
        >
          {page.imageUrl && (
            <img
              src={page.imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-95"
              loading="lazy"
            />
          )}
          {page.imageUrl && <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />}
          <div className="relative z-10 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-black text-brand-green dark:text-brand-green">
                Illustration canvas
              </span>
              <span className="text-[10px] font-black text-secondary">{page.illustrationType}</span>
            </div>
            <p className={`text-xs leading-5 ${page.imageUrl ? 'font-bold text-white drop-shadow' : 'text-secondary'}`}>
              {page.illustrationPrompt || `Scene ${page.illustrationType} untuk halaman ini.`}
            </p>
          </div>
          {(page.interactiveElements || []).map((element) => (
            <button
              key={element.id}
              type="button"
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-green px-2 py-1 text-xs font-black text-white shadow-md"
              style={{ left: `${element.x}%`, top: `${element.y}%` }}
              title={`${element.label} (${element.x}%, ${element.y}%)`}
              onClick={(event) => event.stopPropagation()}
            >
              {element.emoji || '✨'}
            </button>
          ))}
          {interactionPlaceMode && (
            <div className="absolute inset-x-3 bottom-3 rounded-xl bg-brand-green px-3 py-2 text-[11px] font-black text-white shadow-lg">
              Klik area canvas untuk menaruh interaksi.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
