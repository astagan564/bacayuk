export interface PersonalLibrary {
  favoriteStoryIds: string[];
  recentStoryIds: string[];
}

const STORAGE_PREFIX = 'buku_cerita_personal_library_v1';
const MAX_RECENT_STORIES = 12;

const getStorageKey = (userId?: string) => `${STORAGE_PREFIX}_${userId || 'guest'}`;

const emptyLibrary = (): PersonalLibrary => ({ favoriteStoryIds: [], recentStoryIds: [] });

export const personalLibraryStore = {
  load(userId?: string): PersonalLibrary {
    try {
      const raw = localStorage.getItem(getStorageKey(userId));
      if (!raw) return emptyLibrary();

      const parsed = JSON.parse(raw) as Partial<PersonalLibrary>;
      return {
        favoriteStoryIds: Array.isArray(parsed.favoriteStoryIds) ? parsed.favoriteStoryIds : [],
        recentStoryIds: Array.isArray(parsed.recentStoryIds) ? parsed.recentStoryIds : [],
      };
    } catch {
      return emptyLibrary();
    }
  },

  save(library: PersonalLibrary, userId?: string): void {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(library));
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
      recentStoryIds: [storyId, ...library.recentStoryIds.filter((id) => id !== storyId)].slice(0, MAX_RECENT_STORIES),
    };
  },
};
