import type { ReadingSettings, Story } from '@/types';
import { useFlipbookAutoplay } from '@/features/reader/hooks/useFlipbookAutoplay';
import { useFlipbookInteractionController } from '@/features/reader/hooks/useFlipbookInteractionController';
import { useFlipbookPageNavigation } from '@/features/reader/hooks/useFlipbookPageNavigation';
import { useReaderNarrationController } from '@/features/reader/hooks/useReaderNarrationController';

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
  const totalPages = story.pages.length;
  const activePage = story.pages[currentPageIndex];
  const languageMode = settings.languageMode || 'id';

  const narration = useReaderNarrationController({
    storyId: story.id,
    languageMode,
    speechRate: settings.speechRate,
    speechPitch: settings.speechPitch,
  });
  const navigation = useFlipbookPageNavigation({
    storyId: story.id,
    currentPageIndex,
    totalPages,
    onPageChange,
    pageAudioFx: settings.pageAudioFx,
    stopActiveAudio: narration.stopActiveAudio,
  });
  const interaction = useFlipbookInteractionController({
    story,
    currentPageIndex,
    settings,
  });

  useFlipbookAutoplay({
    activePage,
    currentPageIndex,
    totalPages,
    isEnabled: settings.autoPlay,
    delaySeconds: settings.autoPlayDelay,
    speakPage: narration.speakPage,
    stopActiveAudio: narration.stopActiveAudio,
    goNext: navigation.goNext,
  });

  return {
    totalPages,
    activePage,
    isBackCover: currentPageIndex >= totalPages,
    isNight: settings.themeMode === 'night',
    languageMode,
    isFlipping: navigation.isFlipping,
    activeInteractive: interaction.activeInteractive,
    animatedElementId: interaction.animatedElementId,
    selectedVocab: interaction.selectedVocab,
    selectedGlossary: interaction.selectedGlossary,
    isVocabularyQuizOpen: interaction.isVocabularyQuizOpen,
    fallbackVocabularyQuiz: interaction.fallbackVocabularyQuiz,
    hasVocabularyQuiz: interaction.hasVocabularyQuiz,
    setSelectedVocab: interaction.setSelectedVocab,
    setSelectedGlossary: interaction.setSelectedGlossary,
    handleInteractiveTap: interaction.handleInteractiveTap,
    handlePageClick: navigation.handlePageClick,
    handleTouchStart: navigation.handleTouchStart,
    handleTouchMove: navigation.handleTouchMove,
    handleTouchEnd: navigation.handleTouchEnd,
    speakPage: narration.speakPage,
    openVocabularyQuiz: interaction.openVocabularyQuiz,
    closeVocabularyQuiz: interaction.closeVocabularyQuiz,
    closeVocab: interaction.closeVocab,
    closeGlossary: interaction.closeGlossary,
  };
}

export type FlipbookController = ReturnType<typeof useFlipbookController>;
