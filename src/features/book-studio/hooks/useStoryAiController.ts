import type { StoryAiControllerOptions } from '@/features/book-studio/types/storyAi';
import { useStoryAiOperationCoordinator } from '@/features/book-studio/hooks/useStoryAiOperationCoordinator';
import { useStoryEnhancementController } from '@/features/book-studio/hooks/useStoryEnhancementController';
import { useStoryImageGenerationController } from '@/features/book-studio/hooks/useStoryImageGenerationController';
import { useStoryTranslationController } from '@/features/book-studio/hooks/useStoryTranslationController';

export function useStoryAiController(options: StoryAiControllerOptions) {
  const coordinator = useStoryAiOperationCoordinator(options.editingStory?.id);
  const translation = useStoryTranslationController({ ...options, coordinator });
  const enhancement = useStoryEnhancementController({ ...options, coordinator });
  const images = useStoryImageGenerationController({ ...options, coordinator });

  return {
    isGeneratingTranslation: translation.isGeneratingTranslation,
    generatingEnhancement: enhancement.generatingEnhancement,
    generatingImagePageNumber: images.generatingImagePageNumber,
    imageGenerationProgress: images.imageGenerationProgress,
    handleGenerateTranslation: translation.handleGenerateTranslation,
    handleGenerateEnhancement: enhancement.handleGenerateEnhancement,
    handleGeneratePageImage: images.handleGeneratePageImage,
    handleGenerateAllImages: images.handleGenerateAllImages,
  };
}

export type StoryAiController = ReturnType<typeof useStoryAiController>;
