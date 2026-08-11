import type { Dispatch, FormEvent, MouseEvent, ReactNode, SetStateAction } from 'react';
import type { AdminSettings } from '@/utils/adminStore';
import type { InteractiveElement, Story, StoryPage } from '@/types';
import { PIPELINE_STEPS, createBlankPage, hasCompleteStoryImages, inferPipelineStatus, isPlaceholderCover, sentenceCaseTitle, visualPresetLabel } from '../index';
import { AlertCircle, BookOpen, Eye, Languages, Megaphone, RefreshCw, Sparkles, X } from 'lucide-react';

interface StoryEditorDialogProps {
  story: Story;
  isNewStory: boolean;
  settings: AdminSettings;
  errors: string[];
  previewPageIndex: number;
  showAdvanced: boolean;
  interactionPlaceMode: boolean;
  isGeneratingTranslation: boolean;
  generatingEnhancement: 'illustration' | 'glossary' | 'quiz_interactions' | null;
  generatingImagePageNumber: number | null;
  imageGenerationProgress: { completed: number; total: number; label: string } | null;
  onStoryChange: Dispatch<SetStateAction<Story | null>>;
  onPreviewPageChange: Dispatch<SetStateAction<number>>;
  onAdvancedChange: Dispatch<SetStateAction<boolean>>;
  onInteractionPlaceModeChange: Dispatch<SetStateAction<boolean>>;
  onGenerateTranslation: () => Promise<void>;
  onGenerateEnhancement: (mode: 'illustration' | 'glossary' | 'quiz_interactions', pageNumber?: number) => Promise<void>;
  onGeneratePageImage: (page: StoryPage, pageIndex: number) => Promise<void>;
  onGenerateAllImages: () => Promise<void>;
  onCanvasInteractionClick: (event: MouseEvent<HTMLDivElement>, page: StoryPage, pageIndex: number) => void;
  onRefreshGlossary: () => void;
  renderPageImagePreview: (page: StoryPage, className?: string) => ReactNode;
  onSubmit: (event: FormEvent) => void;
  onClose: () => void;
}

export function StoryEditorDialog(props: StoryEditorDialogProps) {
  const {
    story, isNewStory, settings, errors, previewPageIndex, showAdvanced, interactionPlaceMode,
    isGeneratingTranslation, generatingEnhancement, generatingImagePageNumber, imageGenerationProgress,
    onStoryChange, onPreviewPageChange, onAdvancedChange, onInteractionPlaceModeChange,
    onGenerateTranslation, onGenerateEnhancement, onGeneratePageImage, onGenerateAllImages,
    onCanvasInteractionClick, onRefreshGlossary, renderPageImagePreview, onSubmit, onClose,
  } = props;

  return (
<div className="fixed inset-0 z-50 flex items-stretch justify-center bg-[var(--color-overlay)] backdrop-blur-md animate-fade-in overflow-hidden">
  <div
    className="reader-modal w-full max-w-none h-[100dvh] rounded-none p-4 sm:p-6 relative flex flex-col gap-5 overflow-y-auto"
  >
    <div className="flex items-start sm:items-center justify-between gap-3 pb-3 border-b reader-divider">
      <h3 className="text-lg font-black">
        {isNewStory ? 'Tambah buku cerita' : `Edit buku: "${story.title}"`}
      </h3>
      <button
        onClick={onClose}
        disabled={Boolean(imageGenerationProgress)}
        className="p-2 rounded-full hover:bg-surface-hover transition-colors disabled:opacity-40 disabled:cursor-wait"
        aria-label="Tutup editor buku"
      >
        <X className="w-5 h-5" />
      </button>
    </div>

    <form onSubmit={onSubmit} className="flex flex-col gap-4 text-xs font-semibold">
      {errors.length > 0 && (
        <div className="rounded-2xl border border-error bg-error/10 p-3 text-error dark:border-error dark:bg-error/40 dark:text-error">
          <div className="flex items-center gap-2 font-black mb-2">
            <AlertCircle className="w-4 h-4" />
            <span>Perlu diperbaiki sebelum disimpan</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 font-semibold">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="reader-soft-panel rounded-2xl p-3.5 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-black uppercase text-secondary">
              Status produksi buku
            </span>
            <p className="mt-1 text-[11px] leading-5 text-secondary">
              Buku tetap draft sampai kamu publish, tetapi pipeline ini membantu melacak kesiapan konten.
            </p>
          </div>
          <select
            value={inferPipelineStatus(story)}
            onChange={(e) =>
              onStoryChange({
                ...story,
                pipelineStatus: e.target.value as NonNullable<Story['pipelineStatus']>,
              })
            }
            className="reader-field rounded-xl px-3 py-2 text-[11px] font-black"
          >
            {PIPELINE_STEPS.map((step) => (
              <option
                key={step.id}
                value={step.id}
                disabled={
                  !hasCompleteStoryImages(story)
                  && ['illustrated', 'enhanced', 'ready_to_publish'].includes(step.id)
                }
              >
                {step.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {PIPELINE_STEPS.map((step) => {
            const activeIndex = PIPELINE_STEPS.findIndex((item) => item.id === inferPipelineStatus(story));
            const stepIndex = PIPELINE_STEPS.findIndex((item) => item.id === step.id);
            return (
              <div
                key={step.id}
                className={`rounded-xl px-2.5 py-2 text-[10px] font-black border ${
                  stepIndex <= activeIndex
                    ? 'bg-brand-green/12 border-brand-green/35 text-brand-green'
                    : 'bg-surface border-default text-secondary'
                }`}
              >
                {step.label}
              </div>
            );
          })}
        </div>
      </section>

      {story.productionGuide && (
        <section className="rounded-2xl border border-brand-green/25 bg-brand-green/7 p-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="text-xs font-black">Acuan visual buku</span>
              <p className="mt-1 text-[11px] leading-5 text-secondary">
                Acuan ini otomatis dipakai setiap kali gambar halaman dibuat.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] font-black">
              <span className="rounded-lg bg-surface/70 px-2.5 py-1.5">
                {visualPresetLabel(story.productionGuide.visualPreset)}
              </span>
              <span className="rounded-lg bg-surface/70 px-2.5 py-1.5">
                {story.productionGuide.characterBible.length} karakter
              </span>
              <span className="rounded-lg bg-surface/70 px-2.5 py-1.5">
                {story.productionGuide.aspectRatio}
              </span>
            </div>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {story.productionGuide.characterBible.map((character) => (
              <article key={character.id} className="reader-field min-w-[15rem] max-w-[19rem] rounded-xl p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black text-xs">{character.name}</span>
                  <span className="text-[9px] font-black text-brand-green dark:text-brand-green">
                    {character.role === 'main' ? 'Tokoh utama' : character.role === 'supporting' ? 'Pendukung' : 'Latar'}
                  </span>
                </div>
                <p className="mt-1.5 text-[10px] leading-4 text-secondary">
                  {[character.speciesOrIdentity, character.outfit].filter(Boolean).join(' · ')}
                </p>
                {character.immutableTraits.length > 0 && (
                  <p className="mt-2 text-[10px] leading-4 font-bold">
                    Tetap: {character.immutableTraits.slice(0, 2).join(' · ')}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {(() => {
        const generatedPageCount = story.pages.filter((page) => Boolean(page.imageUrl?.trim())).length;
        const coverReady = !isPlaceholderCover(story.coverImage);
        const allImagesReady = coverReady && generatedPageCount === story.pages.length;
        const completedAssetCount = generatedPageCount + (coverReady ? 1 : 0);
        const totalAssetCount = story.pages.length + 1;

        return (
          <section className="reader-soft-panel rounded-2xl p-3.5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black">Produksi ilustrasi</span>
                  <span className={`rounded-lg px-2 py-1 text-[9px] font-black ${
                    allImagesReady
                      ? 'bg-brand-green/12 text-success'
                      : 'bg-warning/12 text-warning'
                  }`}>
                    {allImagesReady ? 'Semua siap' : `${completedAssetCount}/${totalAssetCount} gambar`}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-5 text-secondary">
                  {imageGenerationProgress
                    ? imageGenerationProgress.label
                    : allImagesReady
                      ? 'Cover dan seluruh halaman sudah memiliki gambar.'
                      : `Cover ${coverReady ? 'siap' : 'belum dibuat'} · ${generatedPageCount} dari ${story.pages.length} halaman siap.`}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-hover">
                  <div
                    className="h-full rounded-full bg-brand-green transition-all duration-300"
                    style={{
                      width: `${Math.round(((imageGenerationProgress?.completed ?? completedAssetCount) / Math.max(1, imageGenerationProgress?.total ?? totalAssetCount)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={onGenerateAllImages}
                disabled={Boolean(imageGenerationProgress) || allImagesReady || generatingImagePageNumber !== null}
                className="btn-primary min-w-[12rem] px-4 py-3 text-xs flex items-center justify-center gap-2 disabled:opacity-55 disabled:cursor-not-allowed"
              >
                {imageGenerationProgress ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span>
                  {imageGenerationProgress
                    ? `${imageGenerationProgress.completed}/${imageGenerationProgress.total} selesai`
                    : allImagesReady
                      ? 'Semua gambar siap'
                      : completedAssetCount > 0
                        ? 'Lanjutkan gambar'
                        : 'Generate semua gambar'}
                </span>
              </button>
            </div>
          </section>
        );
      })()}

      {story.pages.length > 0 && (() => {
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
                    {renderPageImagePreview(page, 'absolute inset-0 opacity-95')}
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
      })()}

      <section className="reader-soft-panel rounded-2xl p-3.5 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="font-black text-xs text-secondary">
              Glosarium terdeteksi — {story.glossary?.length || 0} kata
            </span>
            <p className="mt-1 text-[11px] leading-5 text-secondary">
              Approve kata yang layak masuk kamus sentuh. Kata yang dihapus tidak ikut tersimpan.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onGenerateEnhancement('glossary')}
              disabled={generatingEnhancement === 'glossary'}
              className="rounded-xl bg-brand-green/12 px-3 py-2 text-[11px] font-black text-brand-green disabled:opacity-50 dark:text-brand-green"
            >
              {generatingEnhancement === 'glossary' ? 'Generating...' : 'Generate AI'}
            </button>
            <button
              type="button"
              onClick={onRefreshGlossary}
              className="rounded-xl bg-brand-blue/12 px-3 py-2 text-[11px] font-black text-info"
            >
              Generate ulang
            </button>
            <button
              type="button"
              onClick={() => onStoryChange({ ...story, glossary: [] })}
              className="rounded-xl bg-error/10 px-3 py-2 text-[11px] font-black text-error"
            >
              Kosongkan
            </button>
          </div>
        </div>
        {(story.glossary || []).length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {(story.glossary || []).map((item) => (
              <label
                key={item.id}
                className="reader-field rounded-xl p-2.5 flex items-center gap-2 text-[11px] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked
                  onChange={() =>
                    onStoryChange({
                      ...story,
                      glossary: (story.glossary || []).filter((entry) => entry.id !== item.id),
                    })
                  }
                />
                <span className="text-base leading-none">{item.emoji || '•'}</span>
                <span className="min-w-0">
                  <span className="block font-black truncate">{item.wordEn}</span>
                  <span className="block text-secondary truncate">
                    {item.translationId}
                  </span>
                </span>
              </label>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-default p-4 text-center text-[11px] font-bold text-secondary">
            Belum ada kandidat glosarium. Klik Generate ulang setelah teks halaman siap.
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={() => onAdvancedChange((value) => !value)}
        className="reader-soft-panel rounded-2xl p-3.5 flex items-center justify-between gap-3 text-left"
      >
        <span>
          <span className="block text-xs font-black text-primary">
            Advanced editor
          </span>
          <span className="mt-1 block text-[11px] font-bold text-secondary">
            Metadata, akses, halaman detail, kuis, koordinat X/Y, glosarium manual, dan narasi.
          </span>
        </span>
        <span className="rounded-lg bg-surface/70 px-3 py-1 text-[11px] font-black">
          {showAdvanced ? 'Sembunyikan' : 'Buka'}
        </span>
      </button>

      {showAdvanced && (
        <>
      <div>
        <label className="block font-bold mb-1">Judul Buku Cerita</label>
        <input
          type="text"
          value={story.title}
          onChange={(e) => onStoryChange({ ...story, title: e.target.value })}
          className="reader-field w-full px-3 py-2 rounded-xl font-bold"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block font-bold mb-1">Penulis</label>
          <input
            type="text"
            value={story.author}
            onChange={(e) => onStoryChange({ ...story, author: e.target.value })}
            className="reader-field w-full px-3 py-2 rounded-xl"
            required
          />
        </div>
        <div>
          <label className="block font-bold mb-1">Status Publikasi</label>
          <select
            value={story.status || 'draft'}
            onChange={(e) => onStoryChange({ ...story, status: e.target.value as Story['status'] })}
            className="reader-field w-full px-3 py-2 rounded-xl"
          >
            <option value="draft">Draft - belum tampil di katalog</option>
            <option value="published">Published - tampil di katalog</option>
          </select>
        </div>
        <div>
          <label className="block font-bold mb-1">ID Buku</label>
          <input
            type="text"
            value={story.id}
            onChange={(e) => onStoryChange({ ...story, id: e.target.value.trim() })}
            className="reader-field w-full px-3 py-2 rounded-xl"
            disabled={!isNewStory}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-bold mb-1">Kategori / Genrenya</label>
          <input
            type="text"
            value={story.category}
            onChange={(e) => onStoryChange({ ...story, category: e.target.value })}
            className="reader-field w-full px-3 py-2 rounded-xl"
            required
          />
        </div>
        <div>
          <label className="block font-bold mb-1">Usia Target Anak</label>
          <input
            type="text"
            value={story.targetAge}
            onChange={(e) => onStoryChange({ ...story, targetAge: e.target.value })}
            className="reader-field w-full px-3 py-2 rounded-xl"
            required
          />
        </div>
      </div>

      <div>
        <label className="block font-bold mb-1">URL Gambar Cover</label>
        <input
          type="text"
          value={story.coverImage}
          onChange={(e) => onStoryChange({ ...story, coverImage: e.target.value })}
          className="reader-field w-full px-3 py-2 rounded-xl"
          required
        />
        <div className="mt-2 flex items-center gap-3 rounded-2xl reader-soft-panel p-3">
          <img
            src={story.coverImage}
            alt={story.title}
            className="h-28 w-20 rounded-xl object-cover border border-default dark:border-brand-blue bg-card"
          />
          <div className="min-w-0">
            <p className="font-black text-sm truncate">{story.title || 'Judul buku'}</p>
            <p className="mt-1 text-[11px] text-[var(--muted-ink)] text-secondary line-clamp-3">
              {story.description || 'Deskripsi buku akan tampil di kartu katalog.'}
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block font-bold mb-1">Deskripsi Singkat Katalog</label>
        <textarea
          rows={2}
          value={story.description}
          onChange={(e) => onStoryChange({ ...story, description: e.target.value })}
          className="reader-field w-full px-3 py-2 rounded-xl"
          required
        />
      </div>

      <div>
        <label className="block font-bold mb-1">Pesan Moral Cerita</label>
        <textarea
          rows={2}
          value={story.moralMessage}
          onChange={(e) => onStoryChange({ ...story, moralMessage: e.target.value })}
          className="reader-field w-full px-3 py-2 rounded-xl"
          required
        />
      </div>

      {/* STATUS AKSES BUKU */}
      <div className="reader-soft-panel p-3 rounded-2xl flex flex-col gap-2">
        <label className="font-black text-xs text-secondary">
          Akses membaca online
        </label>
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="accessStatus"
              value="free_guest"
              checked={story.accessStatus === 'free_guest'}
              onChange={() => onStoryChange({ ...story, accessStatus: 'free_guest' })}
            />
            <span>Gratis tanpa login untuk buku pertama</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="accessStatus"
              value="free_member"
              checked={story.accessStatus === 'free_member' || !story.accessStatus}
              onChange={() => onStoryChange({ ...story, accessStatus: 'free_member' })}
            />
            <span>Gratis setelah orang tua login</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="accessStatus"
              value="paid"
              checked={story.accessStatus === 'paid'}
              onChange={() => onStoryChange({ ...story, accessStatus: 'paid' })}
            />
            <span>Berbayar</span>
          </label>
        </div>
      </div>

      {/* PENGUNCI FITUR UNDUHAN & HARGA */}
      <div className="reader-soft-panel p-3 rounded-2xl flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="font-bold text-xs text-secondary">
            Unduhan offline
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={story.downloadEnabled !== false}
              onChange={(e) => onStoryChange({ ...story, downloadEnabled: e.target.checked })}
            />
            <span className="font-bold text-xs">Aktifkan Unduh</span>
          </label>
        </div>

        {story.downloadEnabled !== false && (
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div>
              <label className="block text-[11px] font-bold">Harga E-Book (Rp)</label>
              <input
                type="number"
                step={1000}
                value={story.ebookPrice || settings.defaultEbookPrice}
                onChange={(e) =>
                  onStoryChange({ ...story, ebookPrice: Number(e.target.value) })
                }
                className="reader-field w-full px-3 py-1.5 rounded-xl font-bold"
              />
            </div>

            <div className="flex items-center gap-2 pt-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={story.watermarkEnabled !== false}
                  onChange={(e) =>
                    onStoryChange({ ...story, watermarkEnabled: e.target.checked })
                  }
                />
                <span className="text-[11px] font-bold">Stempel otomatis</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* --- 1. MANAJEMEN HALAMAN BILINGUAL (TEKS GANDA INDONESIA ⇄ INGGRIS) --- */}
      <div className="reader-soft-panel p-3.5 rounded-2xl flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="font-black text-xs uppercase text-brand-blue dark:text-brand-blue flex items-center gap-1.5">
            <Languages className="w-4 h-4 text-brand-blue shrink-0" />
            <span>Teks dua bahasa</span>
          </span>
          <span className="text-[10px] bg-brand-blue text-brand-blue font-bold px-2 py-0.5 rounded-full">
            {story.pages.length} Halaman
          </span>
          <button
            type="button"
            onClick={() => {
              const nextPage = createBlankPage(story.pages.length + 1);
              onStoryChange({ ...story, pages: [...story.pages, nextPage] });
              onPreviewPageChange(story.pages.length);
            }}
            className="px-2.5 py-1 rounded-lg bg-brand-blue hover:bg-brand-blue text-white font-bold text-[11px]"
          >
            + Tambah Halaman
          </button>
        </div>

        <div className="flex flex-col gap-3 max-h-[28rem] overflow-y-auto pr-1">
          {story.pages.map((pg, idx) => (
            <div
              key={idx}
              className="reader-soft-panel p-3 rounded-xl flex flex-col gap-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onPreviewPageChange(idx)}
                  className={`text-left font-extrabold text-xs ${
                    previewPageIndex === idx ? 'text-brand-green' : 'text-brand-blue dark:text-brand-blue'
                  }`}
                >
                  Halaman {idx + 1}
                </button>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const newPages = [...story.pages];
                      const copy = {
                        ...pg,
                        pageNumber: idx + 2,
                        title: `${pg.title || `Halaman ${idx + 1}`} (salinan)`,
                      };
                      newPages.splice(idx + 1, 0, copy);
                      onStoryChange({ ...story, pages: newPages });
                      onPreviewPageChange(idx + 1);
                    }}
                    className="px-2 py-1 rounded-lg bg-card text-[10px] font-bold"
                  >
                    Duplikat
                  </button>
                  <button
                    type="button"
                    disabled={story.pages.length <= 1}
                    onClick={() => {
                      const newPages = story.pages.filter((_, pageIdx) => pageIdx !== idx);
                      onStoryChange({ ...story, pages: newPages });
                      onPreviewPageChange(Math.max(0, Math.min(previewPageIndex, newPages.length - 1)));
                    }}
                    className="px-2 py-1 rounded-lg bg-error/10 text-error disabled:opacity-40 text-[10px] font-bold"
                  >
                    Hapus
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_12rem] gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--muted-ink)] text-secondary">
                    Judul halaman
                  </label>
                  <input
                    type="text"
                    value={pg.title || ''}
                    onChange={(e) => {
                      const newPages = [...story.pages];
                      newPages[idx] = { ...newPages[idx], title: e.target.value };
                      onStoryChange({ ...story, pages: newPages });
                    }}
                    className="reader-field w-full p-2 text-[11px] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--muted-ink)] text-secondary">
                    Ilustrasi
                  </label>
                  <select
                    value={pg.illustrationType}
                    onChange={(e) => {
                      const newPages = [...story.pages];
                      newPages[idx] = { ...newPages[idx], illustrationType: e.target.value as StoryPage['illustrationType'] };
                      onStoryChange({ ...story, pages: newPages });
                    }}
                    className="reader-field w-full p-2 text-[11px] rounded-lg"
                  >
                    <option value="forest">Forest</option>
                    <option value="dragon">Dragon</option>
                    <option value="space">Space</option>
                    <option value="sea">Sea</option>
                    <option value="castle">Castle</option>
                    <option value="garden">Garden</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-warning dark:text-warning">
                    🇮🇩 Teks Bahasa Indonesia
                  </label>
                  <textarea
                    rows={2}
                    value={pg.text}
                    onChange={(e) => {
                      const newPages = [...story.pages];
                      newPages[idx] = { ...newPages[idx], text: e.target.value };
                      onStoryChange({ ...story, pages: newPages });
                    }}
                    className="reader-field w-full p-2 text-[11px] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-brand-blue dark:text-brand-blue">
                    🇬🇧 English Translation (Edisi Belajar)
                  </label>
                  <input
                    type="text"
                    value={pg.titleEn || ''}
                    placeholder="English page title"
                    onChange={(e) => {
                      const newPages = [...story.pages];
                      newPages[idx] = { ...newPages[idx], titleEn: e.target.value };
                      onStoryChange({ ...story, pages: newPages });
                    }}
                    className="reader-field mb-2 w-full p-2 text-[11px] rounded-lg"
                  />
                  <textarea
                    rows={2}
                    value={pg.textEn || ''}
                    placeholder="Masukkan teks versi bahasa Inggris..."
                    onChange={(e) => {
                      const newPages = [...story.pages];
                      newPages[idx] = { ...newPages[idx], textEn: e.target.value };
                      onStoryChange({ ...story, pages: newPages });
                    }}
                    className="reader-field w-full p-2 text-[11px] rounded-lg"
                  />
                </div>
              </div>

              {pg.illustrationType === 'custom' && (
                <div>
                  <label className="block text-[10px] font-bold text-[var(--muted-ink)] text-secondary">
                    Prompt ilustrasi custom / catatan aset
                  </label>
                  <textarea
                    rows={2}
                    value={pg.illustrationPrompt || ''}
                    onChange={(e) => {
                      const newPages = [...story.pages];
                      newPages[idx] = { ...newPages[idx], illustrationPrompt: e.target.value };
                      onStoryChange({ ...story, pages: newPages });
                    }}
                    className="reader-field w-full p-2 text-[11px] rounded-lg"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {story.pages.length > 0 && (
        <div className="reader-soft-panel p-3.5 rounded-2xl flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-black text-xs uppercase text-secondary flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-brand-green" />
              Preview halaman
            </span>
            <select
              value={Math.min(previewPageIndex, story.pages.length - 1)}
              onChange={(e) => onPreviewPageChange(Number(e.target.value))}
              className="reader-field px-2 py-1 rounded-lg text-[11px]"
            >
              {story.pages.map((page, idx) => (
                <option key={`${page.pageNumber}-${idx}`} value={idx}>
                  Halaman {idx + 1}
                </option>
              ))}
            </select>
          </div>
          {(() => {
            const page = story.pages[Math.min(previewPageIndex, story.pages.length - 1)];
            return (
              <div className="rounded-2xl border border-default overflow-hidden bg-background">
                <div className="p-4 bg-surface">
                  <div className="min-h-36 rounded-2xl bg-card/70 p-4 flex flex-col justify-end">
                    <p className="text-[11px] font-black text-brand-green uppercase">
                      {page.illustrationType}
                    </p>
                    <h4 className="text-base font-black mb-1">{page.title || `Halaman ${page.pageNumber}`}</h4>
                    <p className="text-sm leading-relaxed font-bold text-primary">
                      {page.text || 'Teks cerita halaman ini belum diisi.'}
                    </p>
                    {page.textEn && (
                      <p className="mt-2 text-xs leading-relaxed text-brand-blue dark:text-brand-blue">
                        {page.textEn}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {story.pages.length > 0 && (() => {
        const pageIndex = Math.min(previewPageIndex, story.pages.length - 1);
        const page = story.pages[pageIndex];
        const updatePage = (nextPage: StoryPage) => {
          const newPages = [...story.pages];
          newPages[pageIndex] = nextPage;
          onStoryChange({ ...story, pages: newPages });
        };

        return (
          <div className="reader-soft-panel p-3.5 rounded-2xl flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-black text-xs uppercase text-secondary">
                Interaksi & kuis halaman {pageIndex + 1}
              </span>
              <button
                type="button"
                onClick={() => {
                  const nextElement: InteractiveElement = {
                    id: `elem_${Date.now()}`,
                    type: 'character',
                    label: 'Tokoh',
                    x: 50,
                    y: 50,
                    animation: 'bounce',
                    soundType: 'pop',
                    dialogue: 'Halo!',
                    emoji: '⭐',
                  };
                  updatePage({ ...page, interactiveElements: [...(page.interactiveElements || []), nextElement] });
                }}
                className="px-2.5 py-1 rounded-lg bg-brand-green hover:bg-brand-green/80 text-white font-bold text-[11px]"
              >
                + Elemen Interaktif
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {(page.interactiveElements || []).map((element, elemIdx) => (
                <div key={element.id || elemIdx} className="grid grid-cols-1 sm:grid-cols-[1fr_4rem_4rem_4rem_auto] gap-2 items-end rounded-xl bg-surface p-2">
                  <div>
                    <label className="block text-[10px] font-bold">Label & dialog</label>
                    <input
                      value={element.label}
                      onChange={(e) => {
                        const updated = [...(page.interactiveElements || [])];
                        updated[elemIdx] = { ...updated[elemIdx], label: e.target.value };
                        updatePage({ ...page, interactiveElements: updated });
                      }}
                      className="reader-field w-full p-2 text-[11px] rounded-lg"
                    />
                    <input
                      value={element.dialogue || ''}
                      onChange={(e) => {
                        const updated = [...(page.interactiveElements || [])];
                        updated[elemIdx] = { ...updated[elemIdx], dialogue: e.target.value };
                        updatePage({ ...page, interactiveElements: updated });
                      }}
                      className="reader-field w-full p-2 text-[11px] rounded-lg mt-1"
                      placeholder="Dialog saat disentuh"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold">Emoji</label>
                    <input
                      value={element.emoji || ''}
                      onChange={(e) => {
                        const updated = [...(page.interactiveElements || [])];
                        updated[elemIdx] = { ...updated[elemIdx], emoji: e.target.value };
                        updatePage({ ...page, interactiveElements: updated });
                      }}
                      className="reader-field w-full p-2 text-[11px] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold">X%</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={element.x}
                      onChange={(e) => {
                        const updated = [...(page.interactiveElements || [])];
                        updated[elemIdx] = { ...updated[elemIdx], x: Number(e.target.value) };
                        updatePage({ ...page, interactiveElements: updated });
                      }}
                      className="reader-field w-full p-2 text-[11px] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold">Y%</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={element.y}
                      onChange={(e) => {
                        const updated = [...(page.interactiveElements || [])];
                        updated[elemIdx] = { ...updated[elemIdx], y: Number(e.target.value) };
                        updatePage({ ...page, interactiveElements: updated });
                      }}
                      className="reader-field w-full p-2 text-[11px] rounded-lg"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (page.interactiveElements || []).filter((_, i) => i !== elemIdx);
                      updatePage({ ...page, interactiveElements: updated });
                    }}
                    className="px-2 py-2 rounded-lg bg-error/10 text-error text-[10px] font-bold"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-surface p-3 flex flex-col gap-2">
              <label className="flex items-center gap-2 font-bold">
                <input
                  type="checkbox"
                  checked={Boolean(page.quizQuestion)}
                  onChange={(e) => {
                    updatePage({
                      ...page,
                      quizQuestion: e.target.checked
                        ? {
                            question: 'Apa pesan dari halaman ini?',
                            options: ['Berani mencoba', 'Menyerah', 'Tidak peduli', 'Marah-marah'],
                            answerIndex: 0,
                            explanation: 'Jawaban terbaik adalah berani mencoba dengan hati baik.',
                          }
                        : undefined,
                    });
                  }}
                />
                Kuis mini di halaman ini
              </label>
              {page.quizQuestion && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <textarea
                    rows={2}
                    value={page.quizQuestion.question}
                    onChange={(e) =>
                      updatePage({ ...page, quizQuestion: { ...page.quizQuestion!, question: e.target.value } })
                    }
                    className="reader-field w-full p-2 text-[11px] rounded-lg sm:col-span-2"
                    placeholder="Pertanyaan"
                  />
                  {page.quizQuestion.options.map((option, optionIdx) => (
                    <input
                      key={optionIdx}
                      value={option}
                      onChange={(e) => {
                        const options = [...page.quizQuestion!.options];
                        options[optionIdx] = e.target.value;
                        updatePage({ ...page, quizQuestion: { ...page.quizQuestion!, options } });
                      }}
                      className="reader-field w-full p-2 text-[11px] rounded-lg"
                      placeholder={`Pilihan ${optionIdx + 1}`}
                    />
                  ))}
                  <select
                    value={page.quizQuestion.answerIndex}
                    onChange={(e) =>
                      updatePage({ ...page, quizQuestion: { ...page.quizQuestion!, answerIndex: Number(e.target.value) } })
                    }
                    className="reader-field w-full p-2 text-[11px] rounded-lg"
                  >
                    {page.quizQuestion.options.map((_, optionIdx) => (
                      <option key={optionIdx} value={optionIdx}>
                        Jawaban benar: pilihan {optionIdx + 1}
                      </option>
                    ))}
                  </select>
                  <input
                    value={page.quizQuestion.explanation}
                    onChange={(e) =>
                      updatePage({ ...page, quizQuestion: { ...page.quizQuestion!, explanation: e.target.value } })
                    }
                    className="reader-field w-full p-2 text-[11px] rounded-lg"
                    placeholder="Penjelasan jawaban"
                  />
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* --- 2. MANAJEMEN GLOSARIUM KAMUS SENTUH --- */}
      <div className="p-3.5 rounded-2xl bg-purple-50  border-2 border-purple-200 dark:border-purple-800 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="font-black text-xs uppercase text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Glosarium sentuh</span>
          </span>
          <button
            type="button"
            onClick={() => {
              const currentGlossary = story.glossary || [];
              const newItem = {
                id: `g_${Date.now()}`,
                wordEn: 'Friend',
                translationId: 'Sahabat',
                phonetic: 'frend',
                emoji: '🤝',
              };
              onStoryChange({
                ...story,
                glossary: [...currentGlossary, newItem],
              });
            }}
            className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px]"
          >
            + Tambah Kata
          </button>
        </div>

        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
          {(story.glossary || []).map((item, gIdx) => (
            <div
              key={item.id || gIdx}
              className="p-2.5 rounded-xl bg-card border border-purple-200 dark:border-purple-700/60 grid grid-cols-1 sm:grid-cols-5 gap-2 items-center text-[11px]"
            >
              <input
                type="text"
                placeholder="Kata EN (Mis: Rabbit)"
                value={item.wordEn}
                onChange={(e) => {
                  const updated = [...(story.glossary || [])];
                  updated[gIdx] = { ...updated[gIdx], wordEn: e.target.value };
                  onStoryChange({ ...story, glossary: updated });
                }}
                className="px-2 py-1 rounded border border-purple-300 font-bold"
              />
              <input
                type="text"
                placeholder="Arti ID (Mis: Kelinci)"
                value={item.translationId}
                onChange={(e) => {
                  const updated = [...(story.glossary || [])];
                  updated[gIdx] = { ...updated[gIdx], translationId: e.target.value };
                  onStoryChange({ ...story, glossary: updated });
                }}
                className="px-2 py-1 rounded border border-purple-300"
              />
              <input
                type="text"
                placeholder="Fonetik (Mis: rab-it)"
                value={item.phonetic || ''}
                onChange={(e) => {
                  const updated = [...(story.glossary || [])];
                  updated[gIdx] = { ...updated[gIdx], phonetic: e.target.value };
                  onStoryChange({ ...story, glossary: updated });
                }}
                className="px-2 py-1 rounded border border-purple-300"
              />
              <input
                type="text"
                placeholder="Emoji (Mis: 🐰)"
                value={item.emoji || ''}
                onChange={(e) => {
                  const updated = [...(story.glossary || [])];
                  updated[gIdx] = { ...updated[gIdx], emoji: e.target.value };
                  onStoryChange({ ...story, glossary: updated });
                }}
                className="px-2 py-1 rounded border border-purple-300 text-center"
              />
              <button
                type="button"
                onClick={() => {
                  const updated = (story.glossary || []).filter((_, i) => i !== gIdx);
                  onStoryChange({ ...story, glossary: updated });
                }}
                className="px-2 py-1 rounded bg-error hover:bg-error text-white font-bold text-[10px]"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* --- 3. PUSTAKA SUARA (AUDIO LIBRARY NATIVE NARRATION) --- */}
      <div className="p-3.5 rounded-2xl bg-warning/10  border-2 border-warning dark:border-warning flex flex-col gap-2">
        <span className="font-black text-xs uppercase text-warning dark:text-warning flex items-center gap-1.5">
          <Megaphone className="w-4 h-4 text-warning" />
          <span>Pustaka suara narator</span>
        </span>
        <p className="text-[11px] text-warning/80 dark:text-brand-blue">
          Audio otomatis memakai suara perangkat. Orang tua juga dapat merekam narasi per halaman.
        </p>
      </div>
        </>
      )}

      <button
        type="submit"
        disabled={Boolean(imageGenerationProgress)}
        className="btn-primary w-full py-3 px-5 text-xs mt-2 disabled:opacity-55 disabled:cursor-wait"
      >
        Simpan buku
      </button>
    </form>
  </div>
</div>
  );
}
