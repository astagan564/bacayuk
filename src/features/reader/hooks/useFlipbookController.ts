import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent, TouchEvent } from 'react';
import type { GlossaryItem, InteractiveElement, ReadingSettings, Story, StoryPage } from '@/types';
import type { VocabDefinition } from '@/data/vocabulary';
import { createFallbackVocabularyQuiz } from '@/utils/quizOptions';
import { playInteractionSound, playPageFlipSound } from '@/utils/soundEngine';
import { speechEngine } from '@/utils/speechEngine';
import { voiceRecordingsStore } from '@/utils/voiceRecordings';
import { getPageNarration } from '@/features/reader/helpers/readerPageContent';
import { revokeAudioBlobUrl } from '@/features/reader/helpers/audioResource';

interface FlipbookControllerOptions {
  story: Story;
  currentPageIndex: number;
  onPageChange: (newIndex: number) => void;
  settings: ReadingSettings;
}

export function useFlipbookController({
  story,
  currentPageIndex,
  onPageChange,
  settings,
}: FlipbookControllerOptions) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [activeInteractive, setActiveInteractive] = useState<InteractiveElement | null>(null);
  const [animatedElementId, setAnimatedElementId] = useState<string | null>(null);
  const [selectedVocab, setSelectedVocab] = useState<VocabDefinition | null>(null);
  const [selectedGlossary, setSelectedGlossary] = useState<GlossaryItem | null>(null);
  const [isVocabularyQuizOpen, setIsVocabularyQuizOpen] = useState(false);

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeAudioUrlRef = useRef<string | null>(null);
  const activeResolveRef = useRef<(() => void) | null>(null);
  const audioRequestIdRef = useRef(0);
  const flipTimerRef = useRef<number | null>(null);
  const interactionTimerRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number } | null>(null);

  const totalPages = story.pages.length;
  const activePage = story.pages[currentPageIndex];
  const isBackCover = currentPageIndex >= totalPages;
  const isNight = settings.themeMode === 'night';
  const languageMode = settings.languageMode || 'id';
  const fallbackVocabularyQuiz = useMemo(
    () => createFallbackVocabularyQuiz(story.title, story.glossary || []),
    [story.glossary, story.title],
  );
  const hasVocabularyQuiz = Boolean(story.vocabularyQuiz || story.glossary?.length);

  const stopActiveAudio = useCallback(() => {
    audioRequestIdRef.current += 1;
    speechEngine.stop();
    activeAudioRef.current?.pause();
    activeAudioRef.current = null;
    revokeAudioBlobUrl(activeAudioUrlRef.current);
    activeAudioUrlRef.current = null;
    activeResolveRef.current?.();
    activeResolveRef.current = null;
  }, []);

  const changePageWithAnimation = useCallback((nextPageIndex: number) => {
    setIsFlipping(true);
    playPageFlipSound(settings.pageAudioFx);
    stopActiveAudio();
    if (flipTimerRef.current !== null) window.clearTimeout(flipTimerRef.current);
    flipTimerRef.current = window.setTimeout(() => {
      onPageChange(nextPageIndex);
      setIsFlipping(false);
      flipTimerRef.current = null;
    }, 240);
  }, [onPageChange, settings.pageAudioFx, stopActiveAudio]);

  const goNext = useCallback(() => {
    if (isFlipping || currentPageIndex >= totalPages) return;
    changePageWithAnimation(currentPageIndex + 1);
  }, [changePageWithAnimation, currentPageIndex, isFlipping, totalPages]);

  const goPrevious = useCallback(() => {
    if (isFlipping || currentPageIndex <= 0) return;
    changePageWithAnimation(currentPageIndex - 1);
  }, [changePageWithAnimation, currentPageIndex, isFlipping]);

  const handlePageClick = useCallback((event: MouseEvent<HTMLElement>) => {
    if (isFlipping || window.matchMedia('(max-width: 767px)').matches) return;
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select, [role="button"]')) return;
    if (window.getSelection()?.toString().trim()) return;

    const pageBounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < pageBounds.left + pageBounds.width / 2) goPrevious();
    else goNext();
  }, [goNext, goPrevious, isFlipping]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === 'PageDown') goNext();
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') goPrevious();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrevious]);

  const handleInteractiveTap = useCallback((element: InteractiveElement) => {
    setActiveInteractive(element);
    setAnimatedElementId(element.id);
    playInteractionSound(element.soundType || 'pop', settings.soundFx);
    if (element.dialogue) {
      speechEngine.speak(element.dialogue, settings.speechRate, settings.speechPitch);
    }
    if (interactionTimerRef.current !== null) window.clearTimeout(interactionTimerRef.current);
    interactionTimerRef.current = window.setTimeout(() => {
      setAnimatedElementId(null);
      interactionTimerRef.current = null;
    }, 1200);
  }, [settings.soundFx, settings.speechPitch, settings.speechRate]);

  const speakPage = useCallback(async (page: StoryPage): Promise<void> => {
    const narration = getPageNarration(page, languageMode);
    if (!narration.text) return;

    stopActiveAudio();
    const requestId = audioRequestIdRef.current;
    const customAudioUrl = narration.allowCustomRecording
      ? await voiceRecordingsStore.getRecordingUrl(story.id, page.pageNumber)
      : null;
    if (requestId !== audioRequestIdRef.current) {
      revokeAudioBlobUrl(customAudioUrl);
      return;
    }

    await new Promise<void>((resolve) => {
      activeResolveRef.current = resolve;
      const finish = () => {
        activeAudioRef.current = null;
        revokeAudioBlobUrl(activeAudioUrlRef.current);
        activeAudioUrlRef.current = null;
        if (activeResolveRef.current !== resolve) return;
        activeResolveRef.current = null;
        resolve();
      };

      if (customAudioUrl) {
        const audio = new Audio(customAudioUrl);
        activeAudioRef.current = audio;
        activeAudioUrlRef.current = customAudioUrl;
        audio.onended = finish;
        audio.onerror = () => {
          activeAudioRef.current = null;
          revokeAudioBlobUrl(activeAudioUrlRef.current);
          activeAudioUrlRef.current = null;
          speechEngine.speak(narration.text, settings.speechRate, settings.speechPitch, {
            onEnd: finish,
            language: narration.language,
          });
        };
        void audio.play().catch(finish);
        return;
      }

      speechEngine.speak(narration.text, settings.speechRate, settings.speechPitch, {
        onEnd: finish,
        language: narration.language,
      });
    });
  }, [languageMode, settings.speechPitch, settings.speechRate, stopActiveAudio, story.id]);

  useEffect(() => {
    setActiveInteractive(null);
    setAnimatedElementId(null);
    if (interactionTimerRef.current !== null) {
      window.clearTimeout(interactionTimerRef.current);
      interactionTimerRef.current = null;
    }
    let isCancelled = false;
    let delayTimer: number | null = null;

    const playSequence = async () => {
      if (!settings.autoPlay || !activePage) return;
      await speakPage(activePage);
      if (isCancelled || !settings.autoPlay) return;
      await new Promise<void>((resolve) => {
        delayTimer = window.setTimeout(resolve, (settings.autoPlayDelay || 3) * 1000);
      });
      if (!isCancelled && settings.autoPlay && currentPageIndex < totalPages) goNext();
    };

    if (settings.autoPlay && activePage) void playSequence();
    else stopActiveAudio();

    return () => {
      isCancelled = true;
      if (delayTimer !== null) window.clearTimeout(delayTimer);
    };
  }, [activePage, currentPageIndex, goNext, settings.autoPlay, settings.autoPlayDelay, speakPage, stopActiveAudio, totalPages]);

  useEffect(() => {
    if (flipTimerRef.current === null) return;
    window.clearTimeout(flipTimerRef.current);
    flipTimerRef.current = null;
    setIsFlipping(false);
  }, [currentPageIndex, story.id]);

  useEffect(() => {
    setSelectedVocab(null);
    setSelectedGlossary(null);
    setIsVocabularyQuizOpen(false);
  }, [story.id]);

  useEffect(() => () => {
    stopActiveAudio();
    if (flipTimerRef.current !== null) window.clearTimeout(flipTimerRef.current);
    if (interactionTimerRef.current !== null) window.clearTimeout(interactionTimerRef.current);
  }, [stopActiveAudio]);

  const handleTouchStart = useCallback((event: TouchEvent<HTMLElement>) => {
    touchStartRef.current = {
      x: event.targetTouches[0].clientX,
      y: event.targetTouches[0].clientY,
    };
    touchEndRef.current = null;
  }, []);

  const handleTouchMove = useCallback((event: TouchEvent<HTMLElement>) => {
    touchEndRef.current = {
      x: event.targetTouches[0].clientX,
      y: event.targetTouches[0].clientY,
    };
  }, []);

  const handleTouchEnd = useCallback((event: TouchEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select, [role="button"]')) return;
    if (!touchStartRef.current || !touchEndRef.current) return;

    const horizontalDistance = touchStartRef.current.x - touchEndRef.current.x;
    const verticalDistance = touchStartRef.current.y - touchEndRef.current.y;
    const isHorizontalSwipe = Math.abs(horizontalDistance) > 64
      && Math.abs(horizontalDistance) > Math.abs(verticalDistance) * 1.5;
    if (!isHorizontalSwipe) return;
    if (horizontalDistance > 0) goNext();
    else goPrevious();
  }, [goNext, goPrevious]);

  const openVocabularyQuiz = useCallback(() => setIsVocabularyQuizOpen(true), []);
  const closeVocabularyQuiz = useCallback(() => setIsVocabularyQuizOpen(false), []);
  const closeVocab = useCallback(() => setSelectedVocab(null), []);
  const closeGlossary = useCallback(() => setSelectedGlossary(null), []);

  return {
    totalPages,
    activePage,
    isBackCover,
    isNight,
    languageMode,
    fallbackVocabularyQuiz,
    hasVocabularyQuiz,
    isFlipping,
    activeInteractive,
    animatedElementId,
    selectedVocab,
    selectedGlossary,
    isVocabularyQuizOpen,
    setSelectedVocab,
    setSelectedGlossary,
    handleInteractiveTap,
    handlePageClick,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    speakPage,
    openVocabularyQuiz,
    closeVocabularyQuiz,
    closeVocab,
    closeGlossary,
  };
}

export type FlipbookController = ReturnType<typeof useFlipbookController>;
