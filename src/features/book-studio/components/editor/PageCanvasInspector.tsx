import type { Dispatch, SetStateAction } from 'react';
import type { StoryPage } from '@/types';
import type {
  ImageGenerationProgress,
  PageEnhancementMode,
  UpdateStoryPage,
} from '@/features/book-studio/types/pageCanvas';

interface PageCanvasInspectorProps {
  page: StoryPage;
  pageIndex: number;
  interactionPlaceMode: boolean;
  isGeneratingTranslation: boolean;
  generatingEnhancement: PageEnhancementMode | null;
  generatingImagePageNumber: number | null;
  imageGenerationProgress: ImageGenerationProgress | null;
  onUpdatePage: UpdateStoryPage;
  onInteractionPlaceModeChange: Dispatch<SetStateAction<boolean>>;
  onGenerateTranslation: () => Promise<void>;
  onGenerateEnhancement: (mode: PageEnhancementMode, pageNumber?: number) => Promise<void>;
  onGeneratePageImage: (page: StoryPage, pageIndex: number) => Promise<void>;
}

export function PageCanvasInspector({
  page,
  pageIndex,
  interactionPlaceMode,
  isGeneratingTranslation,
  generatingEnhancement,
  generatingImagePageNumber,
  imageGenerationProgress,
  onUpdatePage,
  onInteractionPlaceModeChange,
  onGenerateTranslation,
  onGenerateEnhancement,
  onGeneratePageImage,
}: PageCanvasInspectorProps) {
  const isIllustrationBusy = generatingEnhancement === 'illustration' || Boolean(imageGenerationProgress);
  const isPageImageBusy = generatingImagePageNumber === page.pageNumber || Boolean(imageGenerationProgress);

  return (
    <aside className="flex flex-col gap-3 overflow-y-auto border-t border-default bg-surface p-4 xl:border-l xl:border-t-0">
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <label className="block text-[10px] font-black text-secondary" htmlFor="page-illustration-type">
            Illustration
          </label>
          <button
            type="button"
            onClick={() => void onGenerateEnhancement('illustration', page.pageNumber)}
            disabled={isIllustrationBusy}
            className="rounded-lg bg-brand-green/12 px-2 py-1 text-[10px] font-black text-brand-green disabled:opacity-50 dark:text-brand-green"
          >
            {generatingEnhancement === 'illustration' ? 'Generating...' : 'Regenerate'}
          </button>
        </div>
        <select
          id="page-illustration-type"
          value={page.illustrationType}
          onChange={(event) => onUpdatePage({
            ...page,
            illustrationType: event.target.value as StoryPage['illustrationType'],
          })}
          className="reader-field w-full rounded-lg p-2 text-[11px]"
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
          onChange={(event) => onUpdatePage({ ...page, imageUrl: event.target.value })}
          className="reader-field mt-2 w-full rounded-lg p-2 text-[11px]"
          placeholder="Image URL hasil generate / asset"
          aria-label="URL ilustrasi halaman"
        />
        <button
          type="button"
          onClick={() => void onGeneratePageImage(page, pageIndex)}
          disabled={isPageImageBusy}
          className="mt-2 w-full rounded-lg bg-brand-blue px-3 py-2 text-[11px] font-black text-white disabled:cursor-wait disabled:opacity-60"
        >
          {generatingImagePageNumber === page.pageNumber ? 'Generate gambar...' : 'Generate gambar halaman'}
        </button>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <label className="block text-[10px] font-black text-secondary" htmlFor="page-title-en">
            Translation
          </label>
          <button
            type="button"
            onClick={() => void onGenerateTranslation()}
            disabled={isGeneratingTranslation}
            className="rounded-lg bg-brand-blue/12 px-2 py-1 text-[10px] font-black text-brand-blue disabled:opacity-50 dark:text-brand-blue"
          >
            {isGeneratingTranslation ? 'Generating...' : 'Generate'}
          </button>
        </div>
        <input
          id="page-title-en"
          type="text"
          value={page.titleEn || ''}
          onChange={(event) => onUpdatePage({ ...page, titleEn: event.target.value })}
          className="reader-field mb-2 w-full rounded-lg p-2 text-[11px]"
          placeholder="English page title"
        />
        <textarea
          value={page.textEn || ''}
          onChange={(event) => onUpdatePage({ ...page, textEn: event.target.value })}
          rows={5}
          className="reader-field w-full rounded-lg p-2 text-[11px] leading-5"
          placeholder="Draft English translation"
          aria-label="Draft terjemahan bahasa Inggris"
        />
      </div>

      <div className="reader-soft-panel flex flex-col gap-2 rounded-xl p-3 text-[11px]">
        <div className="flex items-center justify-between gap-2">
          <span className="font-black">Enhancements</span>
          <span className="font-black text-brand-green dark:text-brand-green">Review</span>
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
          onClick={() => void onGenerateEnhancement('quiz_interactions', page.pageNumber)}
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
        aria-pressed={interactionPlaceMode}
        className={`rounded-xl px-3 py-2 text-[11px] font-black transition-all ${
          interactionPlaceMode ? 'bg-brand-green text-white' : 'reader-field text-primary'
        }`}
      >
        {interactionPlaceMode ? 'Batal taruh interaksi' : '+ Klik canvas untuk interaction'}
      </button>
    </aside>
  );
}
