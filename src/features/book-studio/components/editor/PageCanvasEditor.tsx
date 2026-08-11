import type { Dispatch, MouseEvent, SetStateAction } from 'react';
import type { Story, StoryPage } from '@/types';
import { createBlankPage, sentenceCaseTitle } from '@/features/book-studio/helpers/storyDraft';

interface PageCanvasEditorProps {
  story: Story;
  previewPageIndex: number;
  interactionPlaceMode: boolean;
  isGeneratingTranslation: boolean;
  generatingEnhancement: 'illustration' | 'glossary' | 'quiz_interactions' | null;
  generatingImagePageNumber: number | null;
  imageGenerationProgress: { completed: number; total: number; label: string } | null;
  onStoryChange: Dispatch<SetStateAction<Story | null>>;
  onPreviewPageChange: Dispatch<SetStateAction<number>>;
  onInteractionPlaceModeChange: Dispatch<SetStateAction<boolean>>;
  onGenerateTranslation: () => Promise<void>;
  onGenerateEnhancement: (mode: 'illustration' | 'glossary' | 'quiz_interactions', pageNumber?: number) => Promise<void>;
  onGeneratePageImage: (page: StoryPage, pageIndex: number) => Promise<void>;
  onCanvasInteractionClick: (event: MouseEvent<HTMLDivElement>, page: StoryPage, pageIndex: number) => void;
}

export function PageCanvasEditor({
  story,
  previewPageIndex,
  interactionPlaceMode,
  isGeneratingTranslation,
  generatingEnhancement,
  generatingImagePageNumber,
  imageGenerationProgress,
  onStoryChange,
  onPreviewPageChange,
  onInteractionPlaceModeChange,
  onGenerateTranslation,
  onGenerateEnhancement,
  onGeneratePageImage,
  onCanvasInteractionClick,
}: PageCanvasEditorProps) {
  if (story.pages.length === 0) return null;

  const pageIndex = Math.min(previewPageIndex, story.pages.length - 1);
  const page = story.pages[pageIndex];
  const updatePage = (nextPage: StoryPage) => {
    const newPages = [...story.pages];
    newPages[pageIndex] = nextPage;
    onStoryChange({ ...story, pages: newPages });
  };

  return (
          <section className="reader-soft-panel rounded-2xl overflow-hidden border border-default">
            <div className="grid grid-cols-1 xl:grid-cols-[14rem_minmax(32rem,1fr)_18rem] min-h-[42rem] xl:h-[calc(100dvh-15rem)]">
              <aside className="border-b xl:border-b-0 xl:border-r border-default bg-surface p-3 overflow-hidden">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-black text-[11px] text-secondary">
                    Halaman
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextPage = createBlankPage(story.pages.length + 1);
                      onStoryChange({ ...story, pages: [...story.pages, nextPage] });
                      onPreviewPageChange(story.pages.length);
                    }}
                    className="px-2 py-1 rounded-lg bg-brand-green text-white font-black text-[10px]"
                  >
                    + Halaman
                  </button>
                </div>
                <div className="flex xl:flex-col gap-2 overflow-x-auto xl:overflow-x-hidden xl:overflow-y-auto xl:max-h-[calc(100dvh-20rem)] pr-1">
                  {story.pages.map((pageItem, idx) => (
                    <button
                      key={`${pageItem.pageNumber}-${idx}`}
                      type="button"
                      onClick={() => onPreviewPageChange(idx)}
                      className={`min-w-32 lg:min-w-0 text-left rounded-xl p-2 transition-all ${
                        pageIndex === idx
                          ? 'bg-brand-green text-white shadow-sm'
                          : 'hover:bg-surface-hover text-primary'
                      }`}
                    >
                      <span className="block text-[10px] font-black opacity-75">
                        {idx === 0 ? 'Cover' : `Halaman ${idx + 1}`}
                      </span>
                      <span className="mt-1 block text-[11px] font-black line-clamp-2">
                        {pageItem.title || sentenceCaseTitle(pageItem.text, `Halaman ${idx + 1}`)}
                      </span>
                    </button>
                  ))}
                </div>
              </aside>

              <div className="p-4 sm:p-5 bg-background min-w-0">
                <div className="h-full min-h-[38rem] rounded-2xl border border-default bg-surface p-4 sm:p-6 flex flex-col gap-4">
                  <div className="shrink-0">
                    <input
                      value={page.title || ''}
                      onChange={(e) => updatePage({ ...page, title: e.target.value })}
                      className="w-full bg-transparent text-xl sm:text-2xl font-black outline-none placeholder:text-muted/70"
                      placeholder={`Judul halaman ${pageIndex + 1}`}
                    />
                    <textarea
                      value={page.text}
                      onChange={(e) => updatePage({ ...page, text: e.target.value })}
                      rows={5}
                      className="mt-4 w-full resize-none rounded-2xl bg-background p-4 text-sm leading-7 font-bold text-primary outline-none border border-default"
                      placeholder="Teks cerita halaman ini"
                    />
                  </div>
                  <div
                    onClick={(e) => onCanvasInteractionClick(e, page, pageIndex)}
                    className={`relative flex-1 min-h-[20rem] rounded-2xl bg-background overflow-hidden border border-default ${
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
                      <span className="text-[10px] font-black text-secondary">
                        {page.illustrationType}
                      </span>
                    </div>
                    <p className={`text-xs leading-5 ${page.imageUrl ? 'text-white font-bold drop-shadow' : 'text-secondary'}`}>
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

              <aside className="border-t xl:border-t-0 xl:border-l border-default bg-surface p-4 flex flex-col gap-3 overflow-y-auto">
                <div>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <label className="block text-[10px] font-black text-secondary">
                      Illustration
                    </label>
                    <button
                      type="button"
                      onClick={() => onGenerateEnhancement('illustration', page.pageNumber)}
                      disabled={generatingEnhancement === 'illustration' || Boolean(imageGenerationProgress)}
                      className="rounded-lg bg-brand-green/12 px-2 py-1 text-[10px] font-black text-brand-green disabled:opacity-50 dark:text-brand-green"
                    >
                      {generatingEnhancement === 'illustration' ? 'Generating...' : 'Regenerate'}
                    </button>
                  </div>
                  <select
                    value={page.illustrationType}
                    onChange={(e) => updatePage({ ...page, illustrationType: e.target.value as StoryPage['illustrationType'] })}
                    className="reader-field w-full p-2 text-[11px] rounded-lg"
                  >
                    <option value="forest">Forest</option>
                    <option value="dragon">Dragon / magic</option>
                    <option value="space">Space</option>
                    <option value="sea">Sea</option>
                    <option value="castle">Castle</option>
                    <option value="garden">Garden</option>
                    <option value="custom">Custom</option>
                  </select>
                  <input
                    type="url"
                    value={page.imageUrl || ''}
                    onChange={(e) => updatePage({ ...page, imageUrl: e.target.value })}
                    className="reader-field mt-2 w-full p-2 text-[11px] rounded-lg"
                    placeholder="Image URL hasil generate / asset"
                  />
                  <button
                    type="button"
                    onClick={() => onGeneratePageImage(page, pageIndex)}
                     disabled={generatingImagePageNumber === page.pageNumber || Boolean(imageGenerationProgress)}
                    className="mt-2 w-full rounded-lg bg-brand-blue px-3 py-2 text-[11px] font-black text-white disabled:opacity-60 disabled:cursor-wait"
                  >
                    {generatingImagePageNumber === page.pageNumber ? 'Generate gambar...' : 'Generate gambar halaman'}
                  </button>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <label className="block text-[10px] font-black text-secondary">
                      Translation
                    </label>
                    <button
                      type="button"
                      onClick={onGenerateTranslation}
                      disabled={isGeneratingTranslation}
                      className="rounded-lg bg-brand-blue/12 px-2 py-1 text-[10px] font-black text-brand-blue disabled:opacity-50 dark:text-brand-blue"
                    >
                      {isGeneratingTranslation ? 'Generating...' : 'Generate'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={page.titleEn || ''}
                    onChange={(e) => updatePage({ ...page, titleEn: e.target.value })}
                    className="reader-field mb-2 w-full p-2 text-[11px] rounded-lg"
                    placeholder="English page title"
                  />
                  <textarea
                    value={page.textEn || ''}
                    onChange={(e) => updatePage({ ...page, textEn: e.target.value })}
                    rows={5}
                    className="reader-field w-full p-2 text-[11px] rounded-lg leading-5"
                    placeholder="Draft English translation"
                  />
                </div>
                <div className="reader-soft-panel rounded-xl p-3 flex flex-col gap-2 text-[11px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black">Enhancements</span>
                    <span className="font-black text-brand-green dark:text-brand-green">
                      Review
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>Interaksi</span>
                    <span>{page.interactiveElements?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>Kuis</span>
                    <span>{page.quizQuestion ? 'Ada' : '-'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onGenerateEnhancement('quiz_interactions', page.pageNumber)}
                    disabled={generatingEnhancement === 'quiz_interactions'}
                    className="mt-1 rounded-lg bg-brand-blue/12 px-2 py-2 text-[10px] font-black text-brand-blue disabled:opacity-50 dark:text-brand-blue"
                  >
                    {generatingEnhancement === 'quiz_interactions' ? 'Generating...' : 'Regenerate kuis & interaksi'}
                  </button>
                </div>
                <p className="text-[11px] leading-5 text-secondary">
                  Pengaturan detail tetap tersedia di bagian Advanced di bawah.
                </p>
                <button
                  type="button"
                  onClick={() => onInteractionPlaceModeChange((value) => !value)}
                  className={`rounded-xl px-3 py-2 text-[11px] font-black transition-all ${
                    interactionPlaceMode
                      ? 'bg-brand-green text-white'
                      : 'reader-field text-primary'
                  }`}
                >
                  {interactionPlaceMode ? 'Batal taruh interaksi' : '+ Klik canvas untuk interaction'}
                </button>
              </aside>
            </div>
          </section>

  );
}
