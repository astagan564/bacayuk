import {
  fetchAdminSettings,
  persistAdminSettings,
} from '@/features/admin/api/adminPersistence';
import { ADMIN_SETTINGS_KEY } from '@/features/admin/stores/adminStorageKeys';
import type { AdminSettings } from '@/features/admin/types/adminStore';

const DEFAULT_SETTINGS: AdminSettings = {
  eyeRestIntervalMinutes: 20,
  downloadLinkExpireHours: 24,
  defaultEbookPrice: 15000,
  enableGlobalWatermark: true,
  allowGuestFreeBookCount: 1,
  enableCopyProtection: true,
  promoBannerText: '',
  promoBannerActive: false,
};

function readCachedSettings(): AdminSettings {
  if (typeof localStorage === 'undefined') return DEFAULT_SETTINGS;
  try {
    const data = localStorage.getItem(ADMIN_SETTINGS_KEY);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

let currentSettings = readCachedSettings();
let loadPromise: Promise<AdminSettings> | null = null;
const listeners = new Set<() => void>();

function publish(settings: AdminSettings): AdminSettings {
  currentSettings = settings;
  try {
    localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // The local value is only an offline cache; Supabase remains authoritative.
  }
  listeners.forEach((listener) => listener());
  return settings;
}

export const adminSettingsStore = {
  getSettings(): AdminSettings {
    return currentSettings;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  async loadSettings(): Promise<AdminSettings> {
    if (!loadPromise) {
      loadPromise = fetchAdminSettings()
        .then(publish)
        .finally(() => {
          loadPromise = null;
        });
    }
    return loadPromise;
  },

  async saveSettings(settings: AdminSettings, adminPin: string): Promise<AdminSettings> {
    const savedSettings = await persistAdminSettings(settings, adminPin);
    return publish(savedSettings);
  },
};
