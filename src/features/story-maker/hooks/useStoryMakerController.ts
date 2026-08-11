import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { userAuthStore } from '@/utils/userAuthStore';
import { generateStory } from '@/features/story-maker/api/storyMakerApi';
import {
  DEFAULT_STORY_MAKER_FORM,
  STORY_MAKER_MAX_QUOTA,
} from '@/features/story-maker/constants';
import { createFallbackStory } from '@/features/story-maker/helpers/createFallbackStory';
import type {
  StoryMakerFormState,
  StoryMakerModalProps,
} from '@/features/story-maker/types';

export function useStoryMakerController({
  onClose,
  onStoryCreated,
}: StoryMakerModalProps) {
  const [form, setForm] = useState<StoryMakerFormState>(DEFAULT_STORY_MAKER_FORM);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const generationRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const aiQuotaUsed = userAuthStore.getUser()?.aiStoriesUsed || 0;
  const quotaRemaining = Math.max(0, STORY_MAKER_MAX_QUOTA - aiQuotaUsed);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      generationRef.current?.abort();
      generationRef.current = null;
    };
  }, []);

  const updateField = useCallback(<Key extends keyof StoryMakerFormState>(
    field: Key,
    value: StoryMakerFormState[Key],
  ): void => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }, []);

  const submit = useCallback(async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (generationRef.current || quotaRemaining <= 0) return;

    const abortController = new AbortController();
    generationRef.current = abortController;
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      let story;
      try {
        story = await generateStory(form, abortController.signal);
      } catch (error) {
        if (abortController.signal.aborted) return;
        console.warn('AI Story Generation error, generating local fallback story:', error);
        story = createFallbackStory(form);
      }

      if (!isMountedRef.current || abortController.signal.aborted) return;
      await userAuthStore.recordAiStoryUsed();
      if (!isMountedRef.current || abortController.signal.aborted) return;
      onStoryCreated(story);
      onClose();
    } catch (error) {
      console.error('Story creation failed:', error);
      if (isMountedRef.current && !abortController.signal.aborted) {
        setErrorMessage('Cerita belum berhasil dibuat. Silakan coba kembali.');
      }
    } finally {
      if (generationRef.current === abortController) generationRef.current = null;
      if (isMountedRef.current) setIsGenerating(false);
    }
  }, [form, onClose, onStoryCreated, quotaRemaining]);

  return {
    form,
    isGenerating,
    errorMessage,
    quotaRemaining,
    maxQuota: STORY_MAKER_MAX_QUOTA,
    updateField,
    submit,
  };
}

export type StoryMakerController = ReturnType<typeof useStoryMakerController>;
