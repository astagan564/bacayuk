export interface PersonalLibrary {
  favoriteStoryIds: string[];
  recentStoryIds: string[];
}

const STORAGE_PREFIX = 'buku_cerita_personal_library_v1';
const MAX_RECENT_STORIES = 12;

const getStorageKey = (userId?: string): string => `${STORAGE_PREFIX}_${userId || 'guest'}`;
const emptyLibrary = (): PersonalLibrary => ({ favoriteStoryIds: [], recentStoryIds: [] });

function validStoryIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string =>
    typeof item === 'string' && Boolean(item.trim())
  ))];
}

export const personalLibraryStore = {
  load(userId?: string): PersonalLibrary {
    try {
      const rawValue = localStorage.getItem(getStorageKey(userId));
      if (!rawValue) return emptyLibrary();
      const parsedValue = JSON.parse(rawValue) as Record<string, unknown>;
      return {
        favoriteStoryIds: validStoryIds(parsedValue.favoriteStoryIds),
        recentStoryIds: validStoryIds(parsedValue.recentStoryIds).slice(0, MAX_RECENT_STORIES),
      };
    } catch {
      return emptyLibrary();
    }
  },

  save(library: PersonalLibrary, userId?: string): void {
    try {
      localStorage.setItem(getStorageKey(userId), JSON.stringify(library));
    } catch (error) {
      console.warn('Failed to save personal library:', error);
    }
  },

  clear(userId?: string): void {
    try {
      localStorage.removeItem(getStorageKey(userId));
    } catch {
      // Storage cleanup is best-effort on restricted browsers.
    }
  },

  toggleFavorite(library: PersonalLibrary, storyId: string): PersonalLibrary {
    const favoriteStoryIds = library.favoriteStoryIds.includes(storyId)
      ? library.favoriteStoryIds.filter((id) => id !== storyId)
      : [storyId, ...library.favoriteStoryIds];
    return { ...library, favoriteStoryIds };
  },

  recordRecent(library: PersonalLibrary, storyId: string): PersonalLibrary {
    return {
      ...library,
      recentStoryIds: [
        storyId,
        ...library.recentStoryIds.filter((id) => id !== storyId),
      ].slice(0, MAX_RECENT_STORIES),
    };
  },
};
