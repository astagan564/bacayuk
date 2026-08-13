import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import type { Story } from '@/types';
import type { FlipbookHandle } from '@/features/reader/types/flipbook';
import type { UserAccount } from '@/utils/userAuthStore';
import { speechEngine } from '@/utils/speechEngine';
import { storyStore } from '@/utils/storyStore';
import { userAuthStore } from '@/utils/userAuthStore';
import { useReadingProgressController } from '@/features/reader/hooks/useReadingProgressController';

interface ReaderSessionControllerOptions {
  stories: Story[];
  onStoriesChange: Dispatch<SetStateAction<Story[]>>;
  currentUser: UserAccount | null;
  readyStory: Story | null;
  clearReadyStory: () => void;
  requestLogin: (story?: Story) => void;
  recordRecentStory: (storyId: string) => void;
  showToast: (message: string) => void;
  adminPin?: string;
}

export function useReaderSessionController({
  stories,
  onStoriesChange,
  currentUser,
  readyStory,
  clearReadyStory,
  requestLogin,
  recordRecentStory,
  showToast,
  adminPin,
}: ReaderSessionControllerOptions) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const encodedStoryId = pathname.match(/^\/read\/([^/]+)$/)?.[1];
  const routeStoryId = encodedStoryId ? decodeURIComponent(encodedStoryId) : undefined;
  const flipbookRef = useRef<FlipbookHandle>(null);
  const readingViewRef = useRef<HTMLDivElement>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const progress = useReadingProgressController({
    selectedStory,
    currentPageIndex,
    currentUser,
    isReaderOpen: Boolean(routeStoryId),
    showToast,
  });

  const openStory = useCallback((story: Story, targetPage?: number) => {
    if (!userAuthStore.canReadStoryOnline(story.accessStatus)) {
      requestLogin(story);
      return;
    }

    void userAuthStore.recordStoryRead(story.id, story.title);
    recordRecentStory(story.id);
    speechEngine.stop();
    setSelectedStory(story);

    const savedPage = targetPage ?? progress.bookmarks[story.id];
    const initialPage = typeof savedPage === 'number'
      && savedPage > 0
      && savedPage < story.pages.length
      ? savedPage
      : 0;
    setCurrentPageIndex(initialPage);
    if (initialPage > 0) showToast(`📖 Melanjutkan dari Halaman ${initialPage + 1}`);
    if (routeStoryId !== story.id) {
      void navigate({ to: '/read/$storyId', params: { storyId: story.id } });
    }
  }, [navigate, progress.bookmarks, recordRecentStory, requestLogin, routeStoryId, showToast]);

  useEffect(() => {
    if (!routeStoryId) {
      if (pathname === '/' && selectedStory) setSelectedStory(null);
      return;
    }
    if (selectedStory?.id === routeStoryId) return;
    const routeStory = stories.find((story) => story.id === routeStoryId);
    if (routeStory) openStory(routeStory);
  }, [openStory, pathname, routeStoryId, selectedStory, stories]);

  useEffect(() => {
    if (!readyStory) return;
    speechEngine.stop();
    setSelectedStory(readyStory);
    setCurrentPageIndex(0);
    clearReadyStory();
    void navigate({ to: '/read/$storyId', params: { storyId: readyStory.id } });
  }, [clearReadyStory, navigate, readyStory]);

  const backToLibrary = useCallback(() => {
    setSelectedStory(null);
    speechEngine.stop();
    void navigate({ to: '/' });
  }, [navigate]);

  const changePage = useCallback((newIndex: number) => {
    speechEngine.stop();
    setCurrentPageIndex(newIndex);

    if (window.matchMedia('(max-width: 1023px)').matches) {
      window.requestAnimationFrame(() => {
        readingViewRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
      });
    }

    if (selectedStory && newIndex < selectedStory.pages.length) {
      progress.saveBookmark(selectedStory.id, newIndex);
    }
  }, [progress.saveBookmark, selectedStory]);

  const createStory = useCallback((newStory: Story) => {
    onStoriesChange((currentStories) => {
      const updatedStories = [newStory, ...currentStories];
      void storyStore.saveStories(updatedStories, adminPin);
      return updatedStories;
    });
    setSelectedStory(newStory);
    setCurrentPageIndex(0);
    void navigate({ to: '/read/$storyId', params: { storyId: newStory.id } });
  }, [adminPin, navigate, onStoriesChange]);

  return {
    selectedStory,
    currentPageIndex,
    flipbookRef,
    readingViewRef,
    isReaderOpen: Boolean(routeStoryId),
    openStory,
    backToLibrary,
    changePage,
    createStory,
    ...progress,
  };
}

export type ReaderSessionController = ReturnType<typeof useReaderSessionController>;
