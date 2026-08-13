import type { Story } from '@/types';
import type { StoryProgress } from '@/features/reader/types/storyCatalog';

export const ALL_STORIES_CATEGORY = 'Semua';

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
  return selectedCategory === ALL_STORIES_CATEGORY
    || story.category.trim().localeCompare(selectedCategory.trim(), 'id', { sensitivity: 'base' }) === 0;
}

export function getStoryCategories(stories: Story[]): string[] {
  const categories = new Map<string, string>();
  for (const story of stories) {
    const category = story.category.trim();
    if (!category) continue;
    const normalizedCategory = category.toLocaleLowerCase('id');
    if (!categories.has(normalizedCategory)) categories.set(normalizedCategory, category);
  }
  return [ALL_STORIES_CATEGORY, ...categories.values()];
}
