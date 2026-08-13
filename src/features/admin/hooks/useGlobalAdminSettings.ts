import { useEffect, useSyncExternalStore } from 'react';
import { adminSettingsStore } from '@/features/admin/stores/adminSettingsStore';

export function useGlobalAdminSettings() {
  const settings = useSyncExternalStore(
    adminSettingsStore.subscribe,
    adminSettingsStore.getSettings,
    adminSettingsStore.getSettings,
  );

  useEffect(() => {
    void adminSettingsStore.loadSettings().catch((error) => {
      console.error('Failed to load global settings:', error);
    });
  }, []);

  return settings;
}
