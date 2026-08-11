import { useCallback, useEffect, useState } from 'react';
import type { StoryPage } from '@/types';
import { storybookApi } from '@/features/book-studio/api/storybookApi';
import { isAbortError } from '@/features/book-studio/helpers/asyncOperation';
import { isPlaceholderCover } from '@/features/book-studio/helpers/storyDraft';
import type {
  StoryAiControllerOptions,
  StoryAiOperationCoordinator,
  StoryImageGenerationProgress,
} from '@/features/book-studio/types/storyAi';

interface StoryImageGenerationControllerOptions extends StoryAiControllerOptions {
  coordinator: StoryAiOperationCoordinator;
}

export function useStoryImageGenerationController({
  editingStory,
  setEditingStory,
  adminPin,
  showToast,
  coordinator,
}: StoryImageGenerationControllerOptions) {
  const [generatingImagePageNumber, setGeneratingImagePageNumber] = useState<number | null>(null);
  const [imageGenerationProgress, setImageGenerationProgress] = useState<StoryImageGenerationProgress | null>(null);

  useEffect(() => {
    setGeneratingImagePageNumber(null);
    setImageGenerationProgress(null);
  }, [editingStory?.id]);

  const handleGeneratePageImage = useCallback(async (page: StoryPage, pageIndex: number) => {
    if (!editingStory) return;
    if (!adminPin) {
      showToast('PIN admin tidak tersedia untuk generate gambar.');
      return;
    }

    const operation = coordinator.start();
    if (!operation) {
      showToast('Tunggu proses AI yang sedang berjalan selesai.');
      return;
    }

    const sourceStory = editingStory;
    setGeneratingImagePageNumber(page.pageNumber);
    try {
      const imageUrl = await storybookApi.generateImage(
        adminPin,
        sourceStory,
        { imageKind: 'page', page },
        operation.signal,
      );
      if (!coordinator.isCurrent(operation.id)) return;

      setEditingStory((currentStory) => {
        if (!currentStory || currentStory.id !== sourceStory.id) return currentStory;
        const matchingPageIndex = currentStory.pages.findIndex(
          (item) => item.pageNumber === page.pageNumber,
        );
        const targetPageIndex = matchingPageIndex >= 0 ? matchingPageIndex : pageIndex;
        const nextPages = currentStory.pages.map((item, index) => (
          index === targetPageIndex
            ? { ...item, imageUrl, illustrationType: 'custom' as const }
            : item
        ));
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
      if (!isAbortError(error) && coordinator.isCurrent(operation.id)) {
        console.error('Page image generation failed:', error);
        showToast(error instanceof Error ? error.message : 'Gagal generate gambar halaman.');
      }
    } finally {
      if (coordinator.isCurrent(operation.id)) {
        setGeneratingImagePageNumber(null);
        coordinator.finish(operation.id);
      }
    }
  }, [adminPin, coordinator, editingStory, setEditingStory, showToast]);

  const handleGenerateAllImages = useCallback(async () => {
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

    const operation = coordinator.start();
    if (!operation) {
      showToast('Tunggu proses AI yang sedang berjalan selesai.');
      return;
    }

    const sourceStory = editingStory;
    let nextCoverImage = sourceStory.coverImage;
    let nextPages = [...sourceStory.pages];
    let completed = 0;
    setImageGenerationProgress({
      completed,
      total,
      label: shouldGenerateCover ? 'Menyiapkan cover' : `Menyiapkan halaman ${missingPages[0].pageNumber}`,
    });

    try {
      if (shouldGenerateCover) {
        nextCoverImage = await storybookApi.generateImage(
          adminPin,
          sourceStory,
          { imageKind: 'cover' },
          operation.signal,
        );
        if (!coordinator.isCurrent(operation.id)) return;
        completed += 1;
        setEditingStory((currentStory) => currentStory?.id === sourceStory.id ? {
          ...currentStory,
          coverImage: nextCoverImage,
          pipelineStatus: 'story_complete',
        } : currentStory);
        setImageGenerationProgress({ completed, total, label: 'Cover selesai' });
      }

      for (const page of missingPages) {
        if (!coordinator.isCurrent(operation.id)) return;
        setImageGenerationProgress({
          completed,
          total,
          label: `Membuat halaman ${page.pageNumber} dari ${sourceStory.pages.length}`,
        });
        const imageUrl = await storybookApi.generateImage(
          adminPin,
          sourceStory,
          { imageKind: 'page', page },
          operation.signal,
        );
        if (!coordinator.isCurrent(operation.id)) return;

        nextPages = nextPages.map((item) => item.pageNumber === page.pageNumber
          ? { ...item, imageUrl, illustrationType: 'custom' as const }
          : item);
        completed += 1;
        setEditingStory((currentStory) => currentStory?.id === sourceStory.id ? {
          ...currentStory,
          coverImage: nextCoverImage,
          pages: currentStory.pages.map((item) => item.pageNumber === page.pageNumber
            ? { ...item, imageUrl, illustrationType: 'custom' as const }
            : item),
          pipelineStatus: 'story_complete',
        } : currentStory);
        setImageGenerationProgress({ completed, total, label: `Halaman ${page.pageNumber} selesai` });
      }

      const allImagesReady = !isPlaceholderCover(nextCoverImage)
        && nextPages.every((page) => Boolean(page.imageUrl?.trim()));
      setEditingStory((currentStory) => currentStory?.id === sourceStory.id ? {
        ...currentStory,
        coverImage: nextCoverImage,
        pipelineStatus: allImagesReady ? 'illustrated' : 'story_complete',
      } : currentStory);
      showToast(allImagesReady
        ? 'Cover dan semua gambar halaman selesai dibuat.'
        : `${completed} gambar selesai dibuat.`);
    } catch (error) {
      if (!isAbortError(error) && coordinator.isCurrent(operation.id)) {
        console.error('Bulk story image generation failed:', error);
        setEditingStory((currentStory) => currentStory?.id === sourceStory.id ? {
          ...currentStory,
          coverImage: nextCoverImage,
          pipelineStatus: 'story_complete',
        } : currentStory);
        showToast(`${completed} dari ${total} gambar selesai. Klik lagi untuk melanjutkan.`);
      }
    } finally {
      if (coordinator.isCurrent(operation.id)) {
        setImageGenerationProgress(null);
        coordinator.finish(operation.id);
      }
    }
  }, [adminPin, coordinator, editingStory, setEditingStory, showToast]);

  return {
    generatingImagePageNumber,
    imageGenerationProgress,
    handleGeneratePageImage,
    handleGenerateAllImages,
  };
}
