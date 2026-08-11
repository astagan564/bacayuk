import type { Story } from '@/types';

export type StoryLibraryView = 'all' | 'continue' | 'favorites' | 'recent' | 'completed';

export interface StoryProgress {
  savedPage?: number;
  isCompleted: boolean;
  hasSavedBookmark: boolean;
}

export interface StorySelectorProps {
  stories: Story[];
  bookmarks?: Record<string, number>;
  completedStories?: Record<string, boolean>;
  readingTimes?: Record<string, number>;
  favoriteStoryIds?: string[];
  recentStoryIds?: string[];
  onSelectStory: (story: Story, pageIndex?: number) => void;
  onToggleFavorite: (storyId: string) => void;
  onOpenStoryMaker: () => void;
  onOpenStatsModal?: () => void;
  onOpenPaymentModal: (story: Story) => void;
  onOpenOfflineDownloadModal: (story: Story) => void;
  onTestRestReminder?: () => void;
}
