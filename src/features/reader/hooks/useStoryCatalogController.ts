import { useCallback, useMemo, useState } from 'react';
import type { Story } from '@/types';
import { adminStore } from '@/utils/adminStore';
import { paymentStore } from '@/utils/paymentStore';
import { userAuthStore } from '@/utils/userAuthStore';
import {
  getStoryProgress,
  storyMatchesCategory,
} from '@/features/reader/helpers/storyCatalog';
import type {
  StoryLibraryView,
  StorySelectorProps,
} from '@/features/reader/types/storyCatalog';

type StoryCatalogControllerOptions = Pick<
  StorySelectorProps,
  'stories' | 'bookmarks' | 'completedStories' | 'readingTimes' | 'favoriteStoryIds' | 'recentStoryIds'
>;

export function useStoryCatalogController({
  stories,
  bookmarks = {},
  completedStories = {},
  readingTimes = {},
  favoriteStoryIds = [],
  recentStoryIds = [],
}: StoryCatalogControllerOptions) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [libraryView, setLibraryView] = useState<StoryLibraryView>('all');

  const publicStories = useMemo(
    () => stories.filter((story) => story.status !== 'draft'),
    [stories],
  );
  const storyById = useMemo(
    () => new Map(publicStories.map((story) => [story.id, story])),
    [publicStories],
  );
  const favoriteStoryIdSet = useMemo(() => new Set(favoriteStoryIds), [favoriteStoryIds]);
  const favoriteStories = useMemo(
    () => publicStories.filter((story) => favoriteStoryIdSet.has(story.id)),
    [favoriteStoryIdSet, publicStories],
  );
  const recentStories = useMemo(
    () => recentStoryIds
      .map((storyId) => storyById.get(storyId))
      .filter((story): story is Story => Boolean(story)),
    [recentStoryIds, storyById],
  );
  const continueStories = useMemo(
    () => publicStories.filter((story) =>
      getStoryProgress(story, bookmarks, completedStories).hasSavedBookmark),
    [bookmarks, completedStories, publicStories],
  );
  const completedStoryList = useMemo(
    () => publicStories.filter((story) =>
      getStoryProgress(story, bookmarks, completedStories).isCompleted),
    [bookmarks, completedStories, publicStories],
  );
  const libraryStories = {
    all: publicStories,
    continue: continueStories,
    favorites: favoriteStories,
    recent: recentStories,
    completed: completedStoryList,
  }[libraryView];
  const filteredStories = useMemo(
    () => libraryStories.filter((story) => storyMatchesCategory(story, selectedCategory)),
    [libraryStories, selectedCategory],
  );
  const totalReadSeconds = useMemo(
    () => Object.values(readingTimes).reduce((total, seconds) => total + seconds, 0),
    [readingTimes],
  );

  const adminSettings = adminStore.getSettings();
  const isVipUser = userAuthStore.isVip();
  const selectCategory = useCallback((category: string) => setSelectedCategory(category), []);
  const selectLibraryView = useCallback((view: StoryLibraryView) => setLibraryView(view), []);
  const showAllStories = useCallback(() => setLibraryView('all'), []);
  const progressForStory = useCallback(
    (story: Story) => getStoryProgress(story, bookmarks, completedStories),
    [bookmarks, completedStories],
  );
  const isFavorite = useCallback(
    (storyId: string) => favoriteStoryIdSet.has(storyId),
    [favoriteStoryIdSet],
  );
  const hasDownloadAccess = useCallback(
    (storyId: string) => isVipUser || paymentStore.isStoryPurchased(storyId),
    [isVipUser],
  );

  return {
    selectedCategory,
    libraryView,
    publicStories,
    favoriteStories,
    recentStories,
    continueStories,
    completedStoryList,
    filteredStories,
    totalReadSeconds,
    adminSettings,
    isVipUser,
    selectCategory,
    selectLibraryView,
    showAllStories,
    progressForStory,
    isFavorite,
    hasDownloadAccess,
  };
}

export type StoryCatalogController = ReturnType<typeof useStoryCatalogController>;
