import { useCallback, useEffect, useState } from 'react';
import type { Story } from '@/types';
import { storybookApi } from '@/features/book-studio/api/storybookApi';
import { isAbortError } from '@/features/book-studio/helpers/asyncOperation';
import { inferPipelineStatus } from '@/features/book-studio/helpers/storyDraft';
import type {
  StoryAiControllerOptions,
  StoryAiOperationCoordinator,
  StoryEnhancementMode,
} from '@/features/book-studio/types/storyAi';

interface StoryEnhancementControllerOptions extends StoryAiControllerOptions {
  coordinator: StoryAiOperationCoordinator;
}

export function useStoryEnhancementController({
  editingStory,
  setEditingStory,
  adminPin,
  showToast,
  coordinator,
}: StoryEnhancementControllerOptions) {
  const [generatingEnhancement, setGeneratingEnhancement] = useState<StoryEnhancementMode | null>(null);

  useEffect(() => setGeneratingEnhancement(null), [editingStory?.id]);

  const handleGenerateEnhancement = useCallback(async (
    mode: StoryEnhancementMode,
    pageNumber?: number,
  ) => {
    if (!editingStory) return;
    if (!adminPin) {
      showToast('PIN admin tidak tersedia untuk generate enhancement.');
      return;
    }

    const sourcePages = pageNumber !== undefined
      ? editingStory.pages.filter((page) => page.pageNumber === pageNumber)
      : editingStory.pages;
    if (sourcePages.length === 0) {
      showToast('Tidak ada halaman untuk diproses.');
      return;
    }

    const operation = coordinator.start();
    if (!operation) {
      showToast('Tunggu proses AI yang sedang berjalan selesai.');
      return;
    }

    const sourceStory = editingStory;
    setGeneratingEnhancement(mode);
    try {
      const data = await storybookApi.generateEnhancement(
        adminPin,
        sourceStory,
        mode,
        sourcePages,
        operation.signal,
      );
      if (!coordinator.isCurrent(operation.id)) return;

      if (mode === 'glossary') {
        const glossary = Array.isArray(data.glossary) ? data.glossary : [];
        setEditingStory((currentStory) => currentStory?.id === sourceStory.id ? {
          ...currentStory,
          glossary,
          vocabularyQuiz: data.vocabularyQuiz || currentStory.vocabularyQuiz,
          pipelineStatus: 'enhanced',
        } : currentStory);
        showToast(`Glosarium AI dibuat: ${glossary.length} kata.`);
        return;
      }

      const enhancedPages = Array.isArray(data.pages) ? data.pages : [];
      setEditingStory((currentStory) => {
        if (!currentStory || currentStory.id !== sourceStory.id) return currentStory;
        const nextPages = currentStory.pages.map((page) => {
          const match = enhancedPages.find((item) => item.pageNumber === page.pageNumber);
          if (!match) return page;
          return mode === 'illustration'
            ? {
                ...page,
                illustrationType: match.illustrationType || page.illustrationType,
                illustrationPrompt: match.illustrationPrompt || page.illustrationPrompt,
              }
            : {
                ...page,
                interactiveElements: match.interactiveElements || page.interactiveElements || [],
                quizQuestion: match.quizQuestion || page.quizQuestion,
              };
        });
        const nextStory: Story = { ...currentStory, pages: nextPages };
        return {
          ...nextStory,
          pipelineStatus: mode === 'illustration' ? inferPipelineStatus(nextStory) : 'enhanced',
        };
      });
      showToast(`Enhancement AI diperbarui untuk ${enhancedPages.length} halaman.`);
    } catch (error) {
      if (!isAbortError(error) && coordinator.isCurrent(operation.id)) {
        console.error('Enhancement generation failed:', error);
        showToast(error instanceof Error ? error.message : 'Gagal membuat enhancement.');
      }
    } finally {
      if (coordinator.isCurrent(operation.id)) {
        setGeneratingEnhancement(null);
        coordinator.finish(operation.id);
      }
    }
  }, [adminPin, coordinator, editingStory, setEditingStory, showToast]);

  return { generatingEnhancement, handleGenerateEnhancement };
}
