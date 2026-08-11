import type { Story } from '@/types';
import type { StoryProgress } from '@/features/reader/types/storyCatalog';

export const STORY_CATEGORIES = [
  'Semua',
  'Emosi & Keberanian',
  'Kebaikan & Petualangan',
  'Hewan & Petualangan',
  'Fabel Pertumbuhan',
] as const;

export const STORY_SPINE_PALETTE = ['#2f8f6b', '#4a6fa5', '#e7a93b', '#d95d6a'] as const;

export function getStoryProgress(
  story: Story,
  bookmarks: Record<string, number>,
  completedStories: Record<string, boolean>,
): StoryProgress {
  const savedPage = bookmarks[story.id];
  const isCompleted = Boolean(
    completedStories[story.id]
      || (savedPage !== undefined && savedPage >= story.pages.length - 1),
  );
  return {
    savedPage,
    isCompleted,
    hasSavedBookmark: !isCompleted && savedPage !== undefined && savedPage > 0,
  };
}

export function storyMatchesCategory(story: Story, selectedCategory: string): boolean {
  return selectedCategory === 'Semua'
    || story.category.includes(selectedCategory)
    || selectedCategory.includes(story.category);
}
