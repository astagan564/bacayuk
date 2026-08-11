import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GlossaryItem, InteractiveElement, ReadingSettings, Story } from '@/types';
import type { VocabDefinition } from '@/data/vocabulary';
import { createFallbackVocabularyQuiz } from '@/utils/quizOptions';
import { playInteractionSound } from '@/utils/soundEngine';
import { speechEngine } from '@/utils/speechEngine';

interface FlipbookInteractionControllerOptions {
  story: Story;
  currentPageIndex: number;
  settings: Pick<ReadingSettings, 'soundFx' | 'speechRate' | 'speechPitch'>;
}

const INTERACTION_ANIMATION_MS = 1200;

export function useFlipbookInteractionController({
  story,
  currentPageIndex,
  settings,
}: FlipbookInteractionControllerOptions) {
  const [activeInteractive, setActiveInteractive] = useState<InteractiveElement | null>(null);
  const [animatedElementId, setAnimatedElementId] = useState<string | null>(null);
  const [selectedVocab, setSelectedVocab] = useState<VocabDefinition | null>(null);
  const [selectedGlossary, setSelectedGlossary] = useState<GlossaryItem | null>(null);
  const [isVocabularyQuizOpen, setIsVocabularyQuizOpen] = useState(false);
  const interactionTimerRef = useRef<number | null>(null);

  const fallbackVocabularyQuiz = useMemo(
    () => createFallbackVocabularyQuiz(story.title, story.glossary || []),
    [story.glossary, story.title],
  );
  const hasVocabularyQuiz = Boolean(story.vocabularyQuiz || story.glossary?.length);

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
    }, INTERACTION_ANIMATION_MS);
  }, [settings.soundFx, settings.speechPitch, settings.speechRate]);

  const openVocabularyQuiz = useCallback(() => setIsVocabularyQuizOpen(true), []);
  const closeVocabularyQuiz = useCallback(() => setIsVocabularyQuizOpen(false), []);
  const closeVocab = useCallback(() => setSelectedVocab(null), []);
  const closeGlossary = useCallback(() => setSelectedGlossary(null), []);

  useEffect(() => {
    setActiveInteractive(null);
    setAnimatedElementId(null);
    if (interactionTimerRef.current !== null) {
      window.clearTimeout(interactionTimerRef.current);
      interactionTimerRef.current = null;
    }
  }, [currentPageIndex, story.id]);

  useEffect(() => {
    setSelectedVocab(null);
    setSelectedGlossary(null);
    setIsVocabularyQuizOpen(false);
  }, [story.id]);

  useEffect(() => () => {
    if (interactionTimerRef.current !== null) window.clearTimeout(interactionTimerRef.current);
  }, []);

  return {
    fallbackVocabularyQuiz,
    hasVocabularyQuiz,
    activeInteractive,
    animatedElementId,
    selectedVocab,
    selectedGlossary,
    isVocabularyQuizOpen,
    setSelectedVocab,
    setSelectedGlossary,
    handleInteractiveTap,
    openVocabularyQuiz,
    closeVocabularyQuiz,
    closeVocab,
    closeGlossary,
  };
}

export type FlipbookInteractionController = ReturnType<typeof useFlipbookInteractionController>;
