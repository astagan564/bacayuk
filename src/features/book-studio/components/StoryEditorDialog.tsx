import type { Dispatch, FormEvent, MouseEvent, SetStateAction } from 'react';
import type { AdminSettings } from '@/utils/adminStore';
import type { Story, StoryPage } from '@/types';
import { AlertCircle, X } from 'lucide-react';
import { AdvancedStoryEditor } from './editor/AdvancedStoryEditor';
import { GlossaryReviewSection } from './editor/GlossaryReviewSection';
import { IllustrationProgressSection } from './editor/IllustrationProgressSection';
import { PageCanvasEditor } from './editor/PageCanvasEditor';
import { ProductionStatusSection } from './editor/ProductionStatusSection';

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
  onSubmit: (event: FormEvent) => void;
  onClose: () => void;
}

export function StoryEditorDialog(props: StoryEditorDialogProps) {
  const {
    story, isNewStory, settings, errors, previewPageIndex, showAdvanced, interactionPlaceMode,
    isGeneratingTranslation, generatingEnhancement, generatingImagePageNumber, imageGenerationProgress,
    onStoryChange, onPreviewPageChange, onAdvancedChange, onInteractionPlaceModeChange,
    onGenerateTranslation, onGenerateEnhancement, onGeneratePageImage, onGenerateAllImages,
    onCanvasInteractionClick, onRefreshGlossary, onSubmit, onClose,
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

      <ProductionStatusSection story={story} onStoryChange={onStoryChange} />

      <IllustrationProgressSection
        story={story}
        generatingImagePageNumber={generatingImagePageNumber}
        progress={imageGenerationProgress}
        onGenerateAllImages={onGenerateAllImages}
      />

      <PageCanvasEditor
        story={story}
        previewPageIndex={previewPageIndex}
        interactionPlaceMode={interactionPlaceMode}
        isGeneratingTranslation={isGeneratingTranslation}
        generatingEnhancement={generatingEnhancement}
        generatingImagePageNumber={generatingImagePageNumber}
        imageGenerationProgress={imageGenerationProgress}
        onStoryChange={onStoryChange}
        onPreviewPageChange={onPreviewPageChange}
        onInteractionPlaceModeChange={onInteractionPlaceModeChange}
        onGenerateTranslation={onGenerateTranslation}
        onGenerateEnhancement={onGenerateEnhancement}
        onGeneratePageImage={onGeneratePageImage}
        onCanvasInteractionClick={onCanvasInteractionClick}
      />

      <GlossaryReviewSection
        story={story}
        isGenerating={generatingEnhancement === 'glossary'}
        onStoryChange={onStoryChange}
        onGenerate={() => onGenerateEnhancement('glossary')}
        onRefresh={onRefreshGlossary}
      />

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
        <AdvancedStoryEditor
          story={story}
          isNewStory={isNewStory}
          settings={settings}
          previewPageIndex={previewPageIndex}
          onStoryChange={onStoryChange}
          onPreviewPageChange={onPreviewPageChange}
        />
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
