import { useCallback } from 'react';
import type { Dispatch, MouseEvent, SetStateAction } from 'react';
import type { Story, StoryPage } from '@/types';
import type {
  ImageGenerationProgress,
  PageEnhancementMode,
} from '@/features/book-studio/types/pageCanvas';
import { createBlankPage } from '@/features/book-studio/helpers/storyDraft';
import { PageCanvasInspector } from '@/features/book-studio/components/editor/PageCanvasInspector';
import { PageCanvasPageList } from '@/features/book-studio/components/editor/PageCanvasPageList';
import { PageCanvasWorkspace } from '@/features/book-studio/components/editor/PageCanvasWorkspace';

interface PageCanvasEditorProps {
  story: Story;
  previewPageIndex: number;
  interactionPlaceMode: boolean;
  isGeneratingTranslation: boolean;
  generatingEnhancement: PageEnhancementMode | null;
  generatingImagePageNumber: number | null;
  imageGenerationProgress: ImageGenerationProgress | null;
  onStoryChange: Dispatch<SetStateAction<Story | null>>;
  onPreviewPageChange: Dispatch<SetStateAction<number>>;
  onInteractionPlaceModeChange: Dispatch<SetStateAction<boolean>>;
  onGenerateTranslation: () => Promise<void>;
  onGenerateEnhancement: (mode: PageEnhancementMode, pageNumber?: number) => Promise<void>;
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
  const pageIndex = Math.min(previewPageIndex, Math.max(story.pages.length - 1, 0));
  const page = story.pages[pageIndex];

  const updatePage = useCallback((nextPage: StoryPage) => {
    const nextPages = [...story.pages];
    nextPages[pageIndex] = nextPage;
    onStoryChange({ ...story, pages: nextPages });
  }, [onStoryChange, pageIndex, story]);

  const addPage = useCallback(() => {
    const nextPage = createBlankPage(story.pages.length + 1);
    onStoryChange({ ...story, pages: [...story.pages, nextPage] });
    onPreviewPageChange(story.pages.length);
  }, [onPreviewPageChange, onStoryChange, story]);

  return story.pages.length > 0 && page ? (
    <section className="reader-soft-panel overflow-hidden rounded-2xl border border-default">
      <div className="grid min-h-[42rem] grid-cols-1 xl:h-[calc(100dvh-15rem)] xl:grid-cols-[14rem_minmax(32rem,1fr)_18rem]">
        <PageCanvasPageList
          story={story}
          activePageIndex={pageIndex}
          onAddPage={addPage}
          onPreviewPageChange={onPreviewPageChange}
        />
        <PageCanvasWorkspace
          page={page}
          pageIndex={pageIndex}
          interactionPlaceMode={interactionPlaceMode}
          onUpdatePage={updatePage}
          onCanvasInteractionClick={onCanvasInteractionClick}
        />
        <PageCanvasInspector
          page={page}
          pageIndex={pageIndex}
          interactionPlaceMode={interactionPlaceMode}
          isGeneratingTranslation={isGeneratingTranslation}
          generatingEnhancement={generatingEnhancement}
          generatingImagePageNumber={generatingImagePageNumber}
          imageGenerationProgress={imageGenerationProgress}
          onUpdatePage={updatePage}
          onInteractionPlaceModeChange={onInteractionPlaceModeChange}
          onGenerateTranslation={onGenerateTranslation}
          onGenerateEnhancement={onGenerateEnhancement}
          onGeneratePageImage={onGeneratePageImage}
        />
      </div>
    </section>
  ) : null;
}
