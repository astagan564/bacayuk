import { personalLibraryStore } from '@/features/account/stores/personalLibraryStore';
import { readingProgressStore } from '@/features/reader/stores/readingProgressStore';
import { paymentStore } from '@/utils/paymentStore';
import { userSettingsStore } from '@/utils/userSettingsStore';
import { voiceRecordingsStore } from '@/utils/voiceRecordings';

const LOCAL_KEYS = [
  'buku_cerita_free_read_history_v1',
  'bacayuk_pending_login_story_v1',
  'bacayuk_reader_settings_v1',
  'bacayuk_last_seen_version',
];

export async function getLocalAccountData(userId: string) {
  return {
    note: 'Rekaman suara tidak diunggah ke server dan tidak disertakan sebagai audio dalam berkas JSON ini.',
    parentSettings: userSettingsStore.getSettings(),
    personalLibrary: personalLibraryStore.load(userId),
    readingProgress: {
      bookmarks: readingProgressStore.getBookmarks(),
      readingTimesSeconds: readingProgressStore.getReadingTimes(),
      completedStories: readingProgressStore.getCompletedStories(),
    },
    localVoiceRecordingCount: await voiceRecordingsStore.countRecordings(),
  };
}

export async function clearLocalAccountData(userId: string): Promise<void> {
  userSettingsStore.clearSettings();
  personalLibraryStore.clear(userId);
  readingProgressStore.clearAll();
  paymentStore.clearVerifiedPurchases();
  LOCAL_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  await voiceRecordingsStore.clearAll();
}
