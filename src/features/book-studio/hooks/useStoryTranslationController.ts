import { useCallback, useEffect, useState } from 'react';
import { storybookApi } from '@/features/book-studio/api/storybookApi';
import { isAbortError } from '@/features/book-studio/helpers/asyncOperation';
import type {
  StoryAiControllerOptions,
  StoryAiOperationCoordinator,
} from '@/features/book-studio/types/storyAi';

interface StoryTranslationControllerOptions extends StoryAiControllerOptions {
  coordinator: StoryAiOperationCoordinator;
}

export function useStoryTranslationController({
  editingStory,
  setEditingStory,
  adminPin,
  showToast,
  coordinator,
}: StoryTranslationControllerOptions) {
  const [isGeneratingTranslation, setIsGeneratingTranslation] = useState(false);

  useEffect(() => setIsGeneratingTranslation(false), [editingStory?.id]);

  const handleGenerateTranslation = useCallback(async () => {
    if (!editingStory) return;
    if (!adminPin) {
      showToast('PIN admin tidak tersedia untuk generate translation.');
      return;
    }

    const operation = coordinator.start();
    if (!operation) {
      showToast('Tunggu proses AI yang sedang berjalan selesai.');
      return;
    }

    const sourceStory = editingStory;
    setIsGeneratingTranslation(true);
    try {
      const data = await storybookApi.translateStory(adminPin, sourceStory, operation.signal);
      if (!coordinator.isCurrent(operation.id)) return;

      const translations = Array.isArray(data.translations) ? data.translations : [];
      setEditingStory((currentStory) => {
        if (!currentStory || currentStory.id !== sourceStory.id) return currentStory;
        return {
          ...currentStory,
          titleEn: data.titleEn || currentStory.titleEn,
          pages: currentStory.pages.map((page) => {
            const match = translations.find((item) => item.pageNumber === page.pageNumber);
            return match?.textEn
              ? { ...page, titleEn: match.titleEn || page.titleEn, textEn: match.textEn }
              : page;
          }),
          pipelineStatus: 'enhanced',
        };
      });
      showToast(`Translation dibuat untuk ${translations.length} halaman.`);
    } catch (error) {
      if (!isAbortError(error) && coordinator.isCurrent(operation.id)) {
        console.error('Translation generation failed:', error);
        showToast(error instanceof Error ? error.message : 'Gagal membuat translation.');
      }
    } finally {
      if (coordinator.isCurrent(operation.id)) {
        setIsGeneratingTranslation(false);
        coordinator.finish(operation.id);
      }
    }
  }, [adminPin, coordinator, editingStory, setEditingStory, showToast]);

  return { isGeneratingTranslation, handleGenerateTranslation };
}
