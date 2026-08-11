import { useCallback, useState } from 'react';
import type { Story, StoryPage } from '@/types';

interface VoiceRecorderTarget {
  storyId: string;
  storyTitle: string;
  pageNumber: number;
  pageText: string;
}

export function useReaderOverlayController() {
  const [isThumbnailsOpen, setIsThumbnailsOpen] = useState(false);
  const [isStoryMakerOpen, setIsStoryMakerOpen] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [activeQuizPage, setActiveQuizPage] = useState<StoryPage | null>(null);
  const [voiceRecorderTarget, setVoiceRecorderTarget] = useState<VoiceRecorderTarget | null>(null);

  const toggleThumbnails = useCallback(() => setIsThumbnailsOpen((isOpen) => !isOpen), []);
  const closeThumbnails = useCallback(() => setIsThumbnailsOpen(false), []);
  const openStoryMaker = useCallback(() => setIsStoryMakerOpen(true), []);
  const closeStoryMaker = useCallback(() => setIsStoryMakerOpen(false), []);
  const openStats = useCallback(() => setShowStatsModal(true), []);
  const closeStats = useCallback(() => setShowStatsModal(false), []);
  const closeQuiz = useCallback(() => setActiveQuizPage(null), []);
  const closeVoiceRecorder = useCallback(() => setVoiceRecorderTarget(null), []);

  const openQuiz = useCallback((story: Story, pageIndex: number) => {
    const page = story.pages[pageIndex];
    if (page?.quizQuestion) setActiveQuizPage(page);
  }, []);

  const openQuizPage = useCallback((page?: StoryPage) => {
    if (page?.quizQuestion) setActiveQuizPage(page);
  }, []);

  const openVoiceRecorder = useCallback((story: Story, pageIndex: number) => {
    const page = story.pages[pageIndex];
    if (!page) return;
    setVoiceRecorderTarget({
      storyId: story.id,
      storyTitle: story.title,
      pageNumber: page.pageNumber,
      pageText: page.text,
    });
  }, []);

  return {
    isThumbnailsOpen,
    isStoryMakerOpen,
    showStatsModal,
    activeQuizPage,
    voiceRecorderTarget,
    toggleThumbnails,
    closeThumbnails,
    openStoryMaker,
    closeStoryMaker,
    openStats,
    closeStats,
    openQuiz,
    openQuizPage,
    closeQuiz,
    openVoiceRecorder,
    closeVoiceRecorder,
  };
}

export type ReaderOverlayController = ReturnType<typeof useReaderOverlayController>;
