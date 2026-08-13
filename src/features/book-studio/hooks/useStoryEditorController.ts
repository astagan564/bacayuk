import { useCallback, useEffect, useState } from 'react';
import type { FormEvent, MouseEvent } from 'react';
import type { InteractiveElement, Story, StoryPage } from '@/types';
import { extractGlossaryCandidates } from '@/features/book-studio/helpers/storyDraft';
import {
  buildManualStoryDraft,
  cloneStoryForEditing,
  normalizeStoryForSave,
  validateStory,
} from '@/features/book-studio/helpers/storyMapping';
import { useStoryAiController } from '@/features/book-studio/hooks/useStoryAiController';

type EditorRouteAction = 'new' | 'edit' | 'canvas';

interface StoryEditorControllerOptions {
  stories: Story[];
  onUpdateStories: (stories: Story[]) => void | Promise<void>;
  defaultEbookPrice: number;
  adminPin?: string;
  routeAction?: EditorRouteAction;
  routeStoryId?: string;
  onCloseRouteAction?: () => void;
  onOpenStoryEditor?: (storyId: string, mode: 'edit' | 'canvas') => void;
  showToast: (message: string) => void;
}

export function useStoryEditorController({
  stories,
  onUpdateStories,
  defaultEbookPrice,
  adminPin,
  routeAction,
  routeStoryId,
  onCloseRouteAction,
  onOpenStoryEditor,
  showToast,
}: StoryEditorControllerOptions) {
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [isNewStory, setIsNewStory] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [previewPageIndex, setPreviewPageIndex] = useState(0);
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
  const [interactionPlaceMode, setInteractionPlaceMode] = useState(false);

  const prepareEditor = useCallback((story: Story, isNew: boolean, showAdvanced = false) => {
    setEditingStory(cloneStoryForEditing(story));
    setIsNewStory(isNew);
    setErrors([]);
    setPreviewPageIndex(0);
    setShowAdvancedEditor(showAdvanced);
    setInteractionPlaceMode(false);
  }, []);

  const openDraftInEditor = useCallback((story: Story) => {
    prepareEditor(story, true);
  }, [prepareEditor]);

  const openManualStory = useCallback(() => {
    prepareEditor(buildManualStoryDraft(defaultEbookPrice), true);
  }, [defaultEbookPrice, prepareEditor]);

  const openExistingStory = useCallback((story: Story, mode: 'edit' | 'canvas' = 'edit') => {
    prepareEditor(story, false, mode === 'canvas');
    onOpenStoryEditor?.(story.id, mode);
  }, [onOpenStoryEditor, prepareEditor]);

  const closeEditor = useCallback(() => {
    setEditingStory(null);
    setErrors([]);
    setInteractionPlaceMode(false);
    onCloseRouteAction?.();
  }, [onCloseRouteAction]);

  useEffect(() => {
    if (!routeStoryId || (routeAction !== 'edit' && routeAction !== 'canvas')) return;
    const story = stories.find((candidate) => candidate.id === routeStoryId);
    if (story) prepareEditor(story, false, routeAction === 'canvas');
  }, [prepareEditor, routeAction, routeStoryId, stories]);

  const updateEditingPage = useCallback((pageIndex: number, nextPage: StoryPage) => {
    setEditingStory((currentStory) => {
      if (!currentStory) return currentStory;
      const pages = [...currentStory.pages];
      pages[pageIndex] = nextPage;
      return { ...currentStory, pages };
    });
  }, []);

  const refreshGlossaryCandidates = useCallback(() => {
    if (!editingStory) return;
    const manuscript = editingStory.pages
      .map((page) => `${page.title || ''}\n${page.text}`)
      .join('\n\n');
    const candidates = extractGlossaryCandidates(manuscript);
    const existing = editingStory.glossary || [];
    const merged = [
      ...existing,
      ...candidates.filter((candidate) =>
        !existing.some((item) => item.wordEn.toLowerCase() === candidate.wordEn.toLowerCase())
      ),
    ];
    setEditingStory({ ...editingStory, glossary: merged });
    showToast(`Glosarium terdeteksi: ${merged.length} kata.`);
  }, [editingStory, showToast]);

  const handleCanvasInteractionClick = useCallback((
    event: MouseEvent<HTMLDivElement>,
    page: StoryPage,
    pageIndex: number,
  ) => {
    if (!interactionPlaceMode) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 100);
    const nextElement: InteractiveElement = {
      id: `elem_${Date.now()}`,
      type: 'character',
      label: 'Interaksi baru',
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
      animation: 'bounce',
      soundType: 'pop',
      dialogue: 'Halo!',
      emoji: '✨',
    };

    updateEditingPage(pageIndex, {
      ...page,
      interactiveElements: [...(page.interactiveElements || []), nextElement],
    });
    setInteractionPlaceMode(false);
    showToast('Interaksi ditaruh di canvas.');
  }, [interactionPlaceMode, showToast, updateEditingPage]);

  const handleSaveStory = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    if (!editingStory) return;

    const validationErrors = validateStory(editingStory);
    if (isNewStory && stories.some((story) => story.id === editingStory.id.trim())) {
      validationErrors.push('ID buku sudah dipakai buku lain.');
    }
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      showToast('Periksa kembali data buku.');
      return;
    }

    const normalizedStory = normalizeStoryForSave(editingStory);
    let updatedStories = isNewStory
      ? [normalizedStory, ...stories]
      : stories.map((story) => story.id === normalizedStory.id ? normalizedStory : story);
    if (normalizedStory.accessStatus === 'free_guest') {
      updatedStories = updatedStories.map((story) => story.id === normalizedStory.id
        ? story
        : story.accessStatus === 'free_guest'
          ? { ...story, accessStatus: 'free_member' }
          : story
      );
    }
    const successMessage = isNewStory
      ? `Buku "${normalizedStory.title}" ditambahkan.`
      : `Perubahan "${normalizedStory.title}" disimpan.`;

    try {
      await onUpdateStories(updatedStories);
      showToast(successMessage);
    } catch {
      showToast('Tersimpan lokal, tetapi belum tersinkron ke Supabase. Periksa service role key/server.');
    }
    closeEditor();
  }, [closeEditor, editingStory, isNewStory, onUpdateStories, showToast, stories]);

  const handleDeleteStory = useCallback(async (story: Story) => {
    if (!window.confirm(`Hapus buku "${story.title}" dari katalog?`)) return;
    try {
      await onUpdateStories(stories.filter((item) => item.id !== story.id));
      showToast(`Buku "${story.title}" dihapus.`);
    } catch {
      showToast('Buku dihapus dari data lokal, tetapi sinkron Supabase belum berhasil.');
    }
  }, [onUpdateStories, showToast, stories]);

  const aiController = useStoryAiController({
    editingStory,
    setEditingStory,
    adminPin,
    showToast,
  });

  return {
    editingStory,
    isNewStory,
    errors,
    previewPageIndex,
    showAdvancedEditor,
    interactionPlaceMode,
    setEditingStory,
    setPreviewPageIndex,
    setShowAdvancedEditor,
    setInteractionPlaceMode,
    openDraftInEditor,
    openManualStory,
    openExistingStory,
    closeEditor,
    refreshGlossaryCandidates,
    handleCanvasInteractionClick,
    handleSaveStory,
    handleDeleteStory,
    ...aiController,
  };
}
