import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import type { Story } from '@/types';
import { storybookApi } from '@/features/book-studio/api/storybookApi';
import { createStoryId, resolvedVisualPreset } from '@/features/book-studio/helpers/storyDraft';
import {
  buildDraftStoryFromAiDraft,
  buildDraftStoryFromQuickCreate,
} from '@/features/book-studio/helpers/storyMapping';
import type { QuickCreateForm } from '@/features/book-studio/types';

interface QuickCreateDraftGenerationOptions {
  adminPin?: string;
  defaultEbookPrice: number;
  form: QuickCreateForm;
  onErrorsChange: Dispatch<SetStateAction<string[]>>;
  onDraftReady: (story: Story, message: string) => void;
}

function normalizeForm(form: QuickCreateForm): QuickCreateForm {
  return {
    ...form,
    storyId: form.storyId || createStoryId(form.title || 'buku-ai'),
    brief: form.brief.trim(),
    title: form.title.trim(),
    moralMessage: form.moralMessage.trim(),
    characterHints: form.characterHints.trim(),
    tabooContent: form.tabooContent.trim(),
  };
}

export function useQuickCreateDraftGeneration({
  adminPin,
  defaultEbookPrice,
  form,
  onErrorsChange,
  onDraftReady,
}: QuickCreateDraftGenerationOptions) {
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const cancelGeneration = useCallback((): void => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    if (isMountedRef.current) setIsGenerating(false);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cancelGeneration();
    };
  }, [cancelGeneration]);

  const handleSubmit = useCallback(async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (abortControllerRef.current) return;
    if (form.brief.trim().length < 12) {
      onErrorsChange(['Tuliskan sedikitnya satu ide cerita yang jelas.']);
      return;
    }

    const normalizedForm = normalizeForm(form);
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setIsGenerating(true);
    onErrorsChange([]);

    try {
      if (!adminPin) throw new Error('PIN admin tidak tersedia untuk AI draft.');
      const draft = await storybookApi.generateDraft(
        adminPin,
        { ...normalizedForm, visualPreset: resolvedVisualPreset(normalizedForm) },
        abortController.signal,
      );
      if (!isMountedRef.current || abortController.signal.aborted) return;
      const draftStory = buildDraftStoryFromAiDraft(normalizedForm, draft, defaultEbookPrice);
      onDraftReady(draftStory, `Draft AI "${draftStory.title}" siap direview.`);
    } catch (error) {
      if (abortController.signal.aborted) return;
      console.error('AI book draft failed:', error);
      if (!isMountedRef.current) return;
      if (normalizedForm.brief.length >= 120) {
        const draftStory = buildDraftStoryFromQuickCreate(normalizedForm, defaultEbookPrice);
        onDraftReady(draftStory, 'AI belum tersedia. Naskah tetap dipecah menjadi draft lokal untuk direview.');
      } else {
        onErrorsChange([
          error instanceof Error ? error.message : 'Buku belum berhasil dibuat. Coba kembali beberapa saat lagi.',
        ]);
      }
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
        if (isMountedRef.current) setIsGenerating(false);
      }
    }
  }, [adminPin, defaultEbookPrice, form, onDraftReady, onErrorsChange]);

  return { isGenerating, handleSubmit, cancelGeneration };
}

export type QuickCreateDraftGenerationController = ReturnType<typeof useQuickCreateDraftGeneration>;
