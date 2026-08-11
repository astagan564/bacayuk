export type StoryPageBookmarks = Record<string, number>;
export type StoryReadingTimes = Record<string, number>;
export type CompletedStories = Record<string, boolean>;

const BOOKMARKS_KEY = 'buku_cerita_bookmarks';
const READING_TIMES_KEY = 'buku_cerita_reading_times';
const COMPLETED_STORIES_KEY = 'buku_cerita_completed_stories';

function loadRecord<T extends number | boolean>(
  key: string,
  isValidValue: (value: unknown) => value is T,
): Record<string, T> {
  try {
    const rawValue = localStorage.getItem(key);
    if (!rawValue) return {};
    const parsedValue: unknown = JSON.parse(rawValue);
    if (!parsedValue || typeof parsedValue !== 'object' || Array.isArray(parsedValue)) return {};

    return Object.fromEntries(
      Object.entries(parsedValue).filter(([, value]) => isValidValue(value))
    ) as Record<string, T>;
  } catch {
    return {};
  }
}

function saveRecord<T extends number | boolean>(key: string, value: Record<string, T>): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to save reading progress for ${key}:`, error);
  }
}

export const readingProgressStore = {
  getBookmarks(): StoryPageBookmarks {
    return loadRecord(BOOKMARKS_KEY, (value): value is number =>
      typeof value === 'number' && Number.isInteger(value) && value >= 0
    );
  },

  saveBookmarks(bookmarks: StoryPageBookmarks): void {
    saveRecord(BOOKMARKS_KEY, bookmarks);
  },

  getReadingTimes(): StoryReadingTimes {
    return loadRecord(READING_TIMES_KEY, (value): value is number =>
      typeof value === 'number' && Number.isFinite(value) && value >= 0
    );
  },

  saveReadingTimes(readingTimes: StoryReadingTimes): void {
    saveRecord(READING_TIMES_KEY, readingTimes);
  },

  clearReadingTimes(): void {
    try {
      localStorage.removeItem(READING_TIMES_KEY);
    } catch (error) {
      console.warn('Failed to reset reading times:', error);
    }
  },

  getCompletedStories(): CompletedStories {
    return loadRecord(COMPLETED_STORIES_KEY, (value): value is boolean => typeof value === 'boolean');
  },

  saveCompletedStories(completedStories: CompletedStories): void {
    saveRecord(COMPLETED_STORIES_KEY, completedStories);
  },
};
