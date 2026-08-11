import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Story, StoryPage } from '@/types';
import { inferPipelineStatus, isPlaceholderCover } from '@/features/book-studio/helpers/storyDraft';
import { storybookApi } from '@/features/book-studio/api/storybookApi';

type EnhancementMode = 'illustration' | 'glossary' | 'quiz_interactions';

interface StoryAiControllerOptions {
  editingStory: Story | null;
  setEditingStory: Dispatch<SetStateAction<Story | null>>;
  adminPin?: string;
  showToast: (message: string) => void;
}

export function useStoryAiController({
  editingStory,
  setEditingStory,
  adminPin,
  showToast,
}: StoryAiControllerOptions) {
  const [isGeneratingTranslation, setIsGeneratingTranslation] = useState(false);
  const [generatingEnhancement, setGeneratingEnhancement] = useState<EnhancementMode | null>(null);
  const [generatingImagePageNumber, setGeneratingImagePageNumber] = useState<number | null>(null);
  const [imageGenerationProgress, setImageGenerationProgress] = useState<{
    completed: number;
    total: number;
    label: string;
  } | null>(null);

  const handleGenerateTranslation = async () => {
    if (!editingStory) return;
    if (!adminPin) {
      showToast('PIN admin tidak tersedia untuk generate translation.');
      return;
    }

    setIsGeneratingTranslation(true);
    try {
      const data = await storybookApi.translateStory(adminPin, editingStory);

      const translations = Array.isArray(data.translations) ? data.translations : [];
      const translatedPages = editingStory.pages.map((page) => {
        const match = translations.find((item: { pageNumber?: number; titleEn?: string; textEn?: string }) => item.pageNumber === page.pageNumber);
        return match?.textEn
          ? { ...page, titleEn: match.titleEn || page.titleEn, textEn: match.textEn }
          : page;
      });

      setEditingStory({
        ...editingStory,
        titleEn: data.titleEn || editingStory.titleEn,
        pages: translatedPages,
        pipelineStatus: 'enhanced',
      });
      showToast(`Translation dibuat untuk ${translations.length} halaman.`);
    } catch (error) {
      console.error('Translation generation failed:', error);
      showToast(error instanceof Error ? error.message : 'Gagal membuat translation.');
    } finally {
      setIsGeneratingTranslation(false);
    }
  };

  const handleGenerateEnhancement = async (
    mode: 'illustration' | 'glossary' | 'quiz_interactions',
    pageNumber?: number
  ) => {
    if (!editingStory) return;
    if (!adminPin) {
      showToast('PIN admin tidak tersedia untuk generate enhancement.');
      return;
    }

    const sourcePages = pageNumber
      ? editingStory.pages.filter((page) => page.pageNumber === pageNumber)
      : editingStory.pages;

    if (sourcePages.length === 0) {
      showToast('Tidak ada halaman untuk diproses.');
      return;
    }

    setGeneratingEnhancement(mode);
    try {
      const data = await storybookApi.generateEnhancement(adminPin, editingStory, mode, sourcePages);

      if (mode === 'glossary') {
        setEditingStory({
          ...editingStory,
          glossary: Array.isArray(data.glossary) ? data.glossary : [],
          vocabularyQuiz: data.vocabularyQuiz || editingStory.vocabularyQuiz,
          pipelineStatus: 'enhanced',
        });
        showToast(`Glosarium AI dibuat: ${Array.isArray(data.glossary) ? data.glossary.length : 0} kata.`);
        return;
      }

      const enhancedPages = Array.isArray(data.pages) ? data.pages : [];
      const nextPages = editingStory.pages.map((page) => {
        const match = enhancedPages.find((item: { pageNumber?: number }) => item.pageNumber === page.pageNumber);
        if (!match) return page;

        if (mode === 'illustration') {
          return {
            ...page,
            illustrationType: match.illustrationType || page.illustrationType,
            illustrationPrompt: match.illustrationPrompt || page.illustrationPrompt,
          };
        }

        return {
          ...page,
          interactiveElements: match.interactiveElements || page.interactiveElements || [],
          quizQuestion: match.quizQuestion || page.quizQuestion,
        };
      });

      const nextStory: Story = {
        ...editingStory,
        pages: nextPages,
        pipelineStatus: mode === 'illustration' ? inferPipelineStatus(editingStory) : 'enhanced',
      };
      setEditingStory(nextStory);
      showToast(`Enhancement AI diperbarui untuk ${enhancedPages.length} halaman.`);
    } catch (error) {
      console.error('Enhancement generation failed:', error);
      showToast(error instanceof Error ? error.message : 'Gagal membuat enhancement.');
    } finally {
      setGeneratingEnhancement(null);
    }
  };

  const requestGeneratedStoryImage = async (
    story: Story,
    request: { imageKind: 'cover' } | { imageKind: 'page'; page: StoryPage }
  ): Promise<string> => {
    if (!adminPin) throw new Error('PIN admin tidak tersedia untuk generate gambar.');
    return storybookApi.generateImage(adminPin, story, request);
  };

  const handleGeneratePageImage = async (page: StoryPage, pageIndex: number) => {
    if (!editingStory) return;
    if (!adminPin) {
      showToast('PIN admin tidak tersedia untuk generate gambar.');
      return;
    }

    setGeneratingImagePageNumber(page.pageNumber);
    try {
      const imageUrl = await requestGeneratedStoryImage(editingStory, { imageKind: 'page', page });
      setEditingStory((currentStory) => {
        if (!currentStory) return currentStory;
        const nextPages = currentStory.pages.map((item, index) => index === pageIndex
          ? { ...item, imageUrl, illustrationType: 'custom' as const }
          : item
        );
        const hasAllImages = !isPlaceholderCover(currentStory.coverImage)
          && nextPages.every((item) => Boolean(item.imageUrl?.trim()));

        return {
          ...currentStory,
          pages: nextPages,
          pipelineStatus: hasAllImages ? 'illustrated' : 'story_complete',
        };
      });
      showToast(`Gambar halaman ${page.pageNumber} berhasil dibuat.`);
    } catch (error) {
      console.error('Page image generation failed:', error);
      showToast(error instanceof Error ? error.message : 'Gagal generate gambar halaman.');
    } finally {
      setGeneratingImagePageNumber(null);
    }
  };

  const handleGenerateAllImages = async () => {
    if (!editingStory) return;
    if (!adminPin) {
      showToast('PIN admin tidak tersedia untuk generate gambar.');
      return;
    }

    const shouldGenerateCover = isPlaceholderCover(editingStory.coverImage);
    const missingPages = editingStory.pages.filter((page) => !page.imageUrl?.trim());
    const total = (shouldGenerateCover ? 1 : 0) + missingPages.length;

    if (total === 0) {
      showToast('Cover dan semua gambar halaman sudah tersedia.');
      return;
    }

    let nextCoverImage = editingStory.coverImage;
    let nextPages = [...editingStory.pages];
    let completed = 0;
    setImageGenerationProgress({ completed, total, label: shouldGenerateCover ? 'Menyiapkan cover' : `Menyiapkan halaman ${missingPages[0].pageNumber}` });

    try {
      if (shouldGenerateCover) {
        nextCoverImage = await requestGeneratedStoryImage(editingStory, { imageKind: 'cover' });
        completed += 1;
        setEditingStory((currentStory) => currentStory ? {
          ...currentStory,
          coverImage: nextCoverImage,
          pipelineStatus: 'story_complete',
        } : currentStory);
        setImageGenerationProgress({ completed, total, label: 'Cover selesai' });
      }

      for (const page of missingPages) {
        setImageGenerationProgress({ completed, total, label: `Membuat halaman ${page.pageNumber} dari ${editingStory.pages.length}` });
        const imageUrl = await requestGeneratedStoryImage(editingStory, { imageKind: 'page', page });
        nextPages = nextPages.map((item) => item.pageNumber === page.pageNumber
          ? { ...item, imageUrl, illustrationType: 'custom' as const }
          : item
        );
        completed += 1;
        setEditingStory((currentStory) => currentStory ? {
          ...currentStory,
          coverImage: nextCoverImage,
          pages: currentStory.pages.map((item) => item.pageNumber === page.pageNumber
            ? { ...item, imageUrl, illustrationType: 'custom' as const }
            : item
          ),
          pipelineStatus: 'story_complete',
        } : currentStory);
        setImageGenerationProgress({ completed, total, label: `Halaman ${page.pageNumber} selesai` });
      }

      const allImagesReady = !isPlaceholderCover(nextCoverImage) && nextPages.every((page) => Boolean(page.imageUrl?.trim()));
      setEditingStory((currentStory) => currentStory ? {
        ...currentStory,
        coverImage: nextCoverImage,
        pipelineStatus: allImagesReady ? 'illustrated' : 'story_complete',
      } : currentStory);
      showToast(allImagesReady ? 'Cover dan semua gambar halaman selesai dibuat.' : `${completed} gambar selesai dibuat.`);
    } catch (error) {
      console.error('Bulk story image generation failed:', error);
      setEditingStory((currentStory) => currentStory ? {
        ...currentStory,
        coverImage: nextCoverImage,
        pipelineStatus: 'story_complete',
      } : currentStory);
      showToast(`${completed} dari ${total} gambar selesai. Klik lagi untuk melanjutkan.`);
    } finally {
      setImageGenerationProgress(null);
    }
  };


  return {
    isGeneratingTranslation,
    generatingEnhancement,
    generatingImagePageNumber,
    imageGenerationProgress,
    handleGenerateTranslation,
    handleGenerateEnhancement,
    handleGeneratePageImage,
    handleGenerateAllImages,
  };
}
