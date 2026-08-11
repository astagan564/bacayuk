import { useCallback, useState } from 'react';
import type { FormEvent } from 'react';
import { adminStore } from '@/utils/adminStore';
import type { AdminSettings } from '@/utils/adminStore';

interface AdminSettingsControllerOptions {
  onTransactionsRefresh: () => void;
  showToast: (message: string) => void;
}

export function useAdminSettingsController({
  onTransactionsRefresh,
  showToast,
}: AdminSettingsControllerOptions) {
  const [settings, setSettings] = useState<AdminSettings>(() => adminStore.getSettings());
  const [cronStatus, setCronStatus] = useState<string | null>(null);

  const handleSaveSettings = useCallback((event: FormEvent) => {
    event.preventDefault();
    void adminStore.saveSettings(settings);
    showToast('Pengaturan berhasil disimpan.');
  }, [settings, showToast]);

  const handleRunCleanup = useCallback(() => {
    const result = adminStore.runCronJobCleanup();
    setCronStatus(`[${result.timestamp}] ${result.message}`);
    showToast(`🧹 Pembersihan Cron Job berhasil! ${result.purgedCount} link kedaluwarsa dibersihkan.`);
    onTransactionsRefresh();
  }, [onTransactionsRefresh, showToast]);

  return {
    settings,
    cronStatus,
    setSettings,
    handleSaveSettings,
    handleRunCleanup,
  };
}
