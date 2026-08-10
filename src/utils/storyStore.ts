import { Story } from '../types';
import { INITIAL_STORIES, mergeBundledCatalogStories } from '../data/stories';

const STORIES_KEY = 'buku_cerita_admin_stories_v1';

const normalizeStory = (story: Story): Story => ({
  ...story,
  status: story.status || 'published',
  pages: story.pages.map((page, index) => ({
    ...page,
    pageNumber: index + 1,
  })),
});

const normalizeList = (stories: Story[]): Story[] => stories.map(normalizeStory);

export const storyStore = {
  getLocalStories(): Story[] {
    try {
      const saved = localStorage.getItem(STORIES_KEY);
      return saved
        ? normalizeList(mergeBundledCatalogStories(JSON.parse(saved)))
        : normalizeList(INITIAL_STORIES);
    } catch {
      return normalizeList(INITIAL_STORIES);
    }
  },

  saveLocalStories(stories: Story[]): void {
    localStorage.setItem(STORIES_KEY, JSON.stringify(normalizeList(stories)));
  },

  async loadStories(): Promise<Story[]> {
    const localStories = this.getLocalStories();

    try {
      const response = await fetch('/api/stories');
      if (!response.ok) {
        return localStories;
      }

      const data = await response.json();
      const remoteStories = Array.isArray(data.stories)
        ? normalizeList(mergeBundledCatalogStories(data.stories))
        : localStories;
      this.saveLocalStories(remoteStories);
      return remoteStories;
    } catch (error) {
      console.warn('Failed to load stories from Supabase, using local stories:', error);
      return localStories;
    }
  },

  async loadAdminStories(adminPin: string): Promise<Story[]> {
    const localStories = this.getLocalStories();

    try {
      const response = await fetch('/api/admin/stories', {
        headers: {
          'x-admin-pin': adminPin,
        },
      });

      if (!response.ok) {
        return localStories;
      }

      const data = await response.json();
      const remoteStories = Array.isArray(data.stories)
        ? normalizeList(mergeBundledCatalogStories(data.stories))
        : localStories;
      this.saveLocalStories(remoteStories);
      return remoteStories;
    } catch (error) {
      console.warn('Failed to load admin stories from Supabase, using local stories:', error);
      return localStories;
    }
  },

  async saveStories(stories: Story[], adminPin?: string): Promise<Story[]> {
    const normalized = normalizeList(stories);
    this.saveLocalStories(normalized);

    if (!adminPin) {
      return normalized;
    }

    try {
      const response = await fetch('/api/admin/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': adminPin,
        },
        body: JSON.stringify({ stories: normalized }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to sync stories to Supabase.');
      }
    } catch (error) {
      console.error('Failed to sync stories to Supabase:', error);
      throw error;
    }

    return normalized;
  },
};
