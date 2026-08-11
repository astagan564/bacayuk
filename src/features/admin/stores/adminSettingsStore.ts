import { persistAdminSettings } from '@/features/admin/api/adminPersistence';
import { ADMIN_SETTINGS_KEY } from '@/features/admin/stores/adminStorageKeys';
import type { AdminSettings } from '@/features/admin/types/adminStore';

const DEFAULT_SETTINGS: AdminSettings = {
  eyeRestIntervalMinutes: 20,
  downloadLinkExpireHours: 24,
  defaultEbookPrice: 15000,
  enableGlobalWatermark: true,
  allowGuestFreeBookCount: 1,
  enableCopyProtection: true,
  promoBannerText: '🎉 Promo Hari Anak Nasional: Gunakan kode kupon BUKUANAK20 untuk diskon 20% unduhan e-book!',
  promoBannerActive: true,
};

export const adminSettingsStore = {
  getSettings(): AdminSettings {
    try {
      const data = localStorage.getItem(ADMIN_SETTINGS_KEY);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: AdminSettings): Promise<void> {
    localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settings));
    try {
      await persistAdminSettings(settings);
    } catch (error) {
      console.error('Failed to sync admin settings', error);
    }
  },
};
