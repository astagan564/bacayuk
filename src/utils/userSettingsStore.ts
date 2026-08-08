export interface UserSettings {
  restIntervalMinutes: number | null; // null means use admin default
  securityQuestionType: 'math' | 'custom';
  customQuestion: string;
  customAnswer: string;
  enableNotifications: boolean;
}

const USER_SETTINGS_KEY = 'buku_cerita_user_settings_v1';

const DEFAULT_USER_SETTINGS: UserSettings = {
  restIntervalMinutes: null,
  securityQuestionType: 'math',
  customQuestion: '',
  customAnswer: '',
  enableNotifications: true,
};

export const userSettingsStore = {
  getSettings(): UserSettings {
    try {
      const data = localStorage.getItem(USER_SETTINGS_KEY);
      return data ? { ...DEFAULT_USER_SETTINGS, ...JSON.parse(data) } : DEFAULT_USER_SETTINGS;
    } catch {
      return DEFAULT_USER_SETTINGS;
    }
  },

  saveSettings(settings: UserSettings): void {
    localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));
    // Usually we would also sync this to Supabase, but since user auth is simple for now, 
    // local storage is fine.
  }
};
