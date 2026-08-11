import { persistReadingActivity } from '@/features/admin/api/adminPersistence';
import {
  LEGACY_DEMO_USER_IDS,
  READING_LOGS_KEY,
} from '@/features/admin/stores/adminStorageKeys';
import type {
  DropoffAnalytics,
  StoryAnalyticsInput,
  UserReadingActivity,
} from '@/features/admin/types/adminStore';

export const adminReadingAnalyticsStore = {
  getReadingLogs(): UserReadingActivity[] {
    try {
      const data = localStorage.getItem(READING_LOGS_KEY);
      const logs = data ? JSON.parse(data) as UserReadingActivity[] : [];
      const cleanedLogs = logs.filter((log) => !LEGACY_DEMO_USER_IDS.has(log.userId));
      if (cleanedLogs.length !== logs.length) {
        localStorage.setItem(READING_LOGS_KEY, JSON.stringify(cleanedLogs));
      }
      return cleanedLogs;
    } catch {
      return [];
    }
  },

  async logUserReading(activity: UserReadingActivity): Promise<void> {
    const logs = adminReadingAnalyticsStore.getReadingLogs();
    const logIndex = logs.findIndex(
      (log) => log.userId === activity.userId && log.storyId === activity.storyId,
    );
    const updatedAt = new Date().toISOString();
    if (logIndex === -1) logs.unshift({ ...activity, updatedAt });
    else logs[logIndex] = { ...logs[logIndex], ...activity, updatedAt };
    localStorage.setItem(READING_LOGS_KEY, JSON.stringify(logs));

    try {
      await persistReadingActivity(activity);
    } catch (error) {
      console.error('Failed to log user reading', error);
    }
  },

  getDropoffAnalytics(stories: StoryAnalyticsInput[]): DropoffAnalytics[] {
    const logs = adminReadingAnalyticsStore.getReadingLogs();
    return stories.map((story) => {
      const storyLogs = logs.filter((log) => log.storyId === story.id);
      const totalReadersForRate = storyLogs.length || 1;
      const pageCounts = new Array<number>(story.pages.length).fill(0);
      let completedCount = 0;

      storyLogs.forEach((log) => {
        const lastPage = Math.min(log.lastPageRead, story.pages.length);
        for (let pageIndex = 0; pageIndex < lastPage; pageIndex += 1) {
          pageCounts[pageIndex] += 1;
        }
        if (log.isCompleted || lastPage >= story.pages.length) completedCount += 1;
      });

      let biggestDropPage = 1;
      let maxDropCount = 0;
      for (let pageIndex = 0; pageIndex < story.pages.length - 1; pageIndex += 1) {
        const droppedReaders = pageCounts[pageIndex] - pageCounts[pageIndex + 1];
        if (droppedReaders > maxDropCount) {
          maxDropCount = droppedReaders;
          biggestDropPage = pageIndex + 1;
        }
      }

      return {
        storyId: story.id,
        storyTitle: story.title,
        totalPages: story.pages.length,
        totalReaders: storyLogs.length,
        completedCount,
        completionRate: Math.round((completedCount / totalReadersForRate) * 100),
        biggestDropPage,
        pageCounts,
      };
    });
  },
};
