import { useCallback, useEffect, useState } from 'react';
import type { Story } from '@/types';
import type { UserAccount } from '@/utils/userAuthStore';
import { adminStore } from '@/utils/adminStore';
import { userSettingsStore } from '@/utils/userSettingsStore';
import {
  readingProgressStore,
} from '@/features/reader/stores/readingProgressStore';

interface ReadingProgressControllerOptions {
  selectedStory: Story | null;
  currentPageIndex: number;
  currentUser: UserAccount | null;
  isReaderOpen: boolean;
  showToast: (message: string) => void;
}

export function useReadingProgressController({
  selectedStory,
  currentPageIndex,
  currentUser,
  isReaderOpen,
  showToast,
}: ReadingProgressControllerOptions) {
  const [bookmarks, setBookmarks] = useState(() => readingProgressStore.getBookmarks());
  const [readingTimes, setReadingTimes] = useState(() => readingProgressStore.getReadingTimes());
  const [completedStories, setCompletedStories] = useState(() =>
    readingProgressStore.getCompletedStories()
  );
  const [continuousReadingSeconds, setContinuousReadingSeconds] = useState(0);
  const [showRestReminder, setShowRestReminder] = useState(false);
  const [showRestParentalGate, setShowRestParentalGate] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  useEffect(() => {
    if (!selectedStory || showRestReminder || !isReaderOpen) return;

    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;

      const userSettings = userSettingsStore.getSettings();
      const eyeRestMinutes = userSettings.restIntervalMinutes
        || adminStore.getSettings().eyeRestIntervalMinutes
        || 20;
      const targetSeconds = eyeRestMinutes * 60;

      setReadingTimes((currentTimes) => {
        const updatedTimes = {
          ...currentTimes,
          [selectedStory.id]: (currentTimes[selectedStory.id] || 0) + 1,
        };
        readingProgressStore.saveReadingTimes(updatedTimes);
        return updatedTimes;
      });
      setContinuousReadingSeconds((currentSeconds) => {
        const updatedSeconds = currentSeconds + 1;
        if (updatedSeconds >= targetSeconds) setShowRestReminder(true);
        return updatedSeconds;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isReaderOpen, selectedStory, showRestReminder]);

  useEffect(() => {
    if (!selectedStory || !currentUser || !isReaderOpen) return;
    const timer = window.setTimeout(() => {
      void adminStore.logUserReading({
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
      storyId: selectedStory.id,
      storyTitle: selectedStory.title,
      lastPageRead: currentPageIndex + 1,
      totalPages: selectedStory.pages.length,
      isCompleted: completedStories[selectedStory.id] || false,
      updatedAt: new Date().toISOString(),
      });
    }, 2_000);
    return () => window.clearTimeout(timer);
  }, [completedStories, currentPageIndex, currentUser, isReaderOpen, selectedStory]);

  const saveBookmark = useCallback((storyId: string, pageIndex: number) => {
    setBookmarks((currentBookmarks) => {
      const updatedBookmarks = { ...currentBookmarks, [storyId]: pageIndex };
      readingProgressStore.saveBookmarks(updatedBookmarks);
      return updatedBookmarks;
    });
  }, []);

  const toggleCurrentBookmark = useCallback(() => {
    if (!selectedStory) return;
    setBookmarks((currentBookmarks) => {
      const updatedBookmarks = { ...currentBookmarks };
      if (currentBookmarks[selectedStory.id] === currentPageIndex) {
        delete updatedBookmarks[selectedStory.id];
        showToast('🔖 Penanda halaman dihapus');
      } else {
        updatedBookmarks[selectedStory.id] = currentPageIndex;
        showToast(`🔖 Halaman ${currentPageIndex + 1} ditandai!`);
      }
      readingProgressStore.saveBookmarks(updatedBookmarks);
      return updatedBookmarks;
    });
  }, [currentPageIndex, selectedStory, showToast]);

  const completeStory = useCallback((storyId: string) => {
    setCompletedStories((currentStories) => {
      const updatedStories = { ...currentStories, [storyId]: true };
      readingProgressStore.saveCompletedStories(updatedStories);
      return updatedStories;
    });
    setBookmarks((currentBookmarks) => {
      const updatedBookmarks = { ...currentBookmarks };
      delete updatedBookmarks[storyId];
      readingProgressStore.saveBookmarks(updatedBookmarks);
      return updatedBookmarks;
    });
    setShowCompletionModal(true);
  }, []);

  const resetStats = useCallback(() => {
    setReadingTimes({});
    readingProgressStore.clearReadingTimes();
    showToast('📊 Catatan statistik membaca telah direset');
  }, [showToast]);

  const requestRestReminder = useCallback(() => setShowRestReminder(true), []);
  const requestRestContinuation = useCallback(() => setShowRestParentalGate(true), []);
  const cancelRestContinuation = useCallback(() => setShowRestParentalGate(false), []);
  const continueAfterRest = useCallback(() => {
    setShowRestParentalGate(false);
    setShowRestReminder(false);
    setContinuousReadingSeconds(0);
    showToast('✅ Berhasil diverifikasi. Silakan lanjutkan membaca!');
  }, [showToast]);
  const dismissRestReminder = useCallback(() => {
    setShowRestReminder(false);
    setContinuousReadingSeconds(0);
  }, []);
  const closeCompletionModal = useCallback(() => setShowCompletionModal(false), []);

  return {
    bookmarks,
    readingTimes,
    completedStories,
    showRestReminder,
    showRestParentalGate,
    showCompletionModal,
    saveBookmark,
    toggleCurrentBookmark,
    completeStory,
    resetStats,
    requestRestReminder,
    requestRestContinuation,
    cancelRestContinuation,
    continueAfterRest,
    dismissRestReminder,
    closeCompletionModal,
  };
}
