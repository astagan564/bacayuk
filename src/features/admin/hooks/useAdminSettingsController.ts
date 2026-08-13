import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { adminStore } from '@/utils/adminStore';
import type { AdminSettings } from '@/utils/adminStore';

interface AdminSettingsControllerOptions {
  adminPin: string;
  onTransactionsRefresh: () => void;
  showToast: (message: string) => void;
}

export function useAdminSettingsController({
  adminPin,
  onTransactionsRefresh,
  showToast,
}: AdminSettingsControllerOptions) {
  const [settings, setSettings] = useState<AdminSettings>(() => adminStore.getSettings());
  const [cronStatus, setCronStatus] = useState<string | null>(null);

  useEffect(() => {
    void adminStore.loadSettings().then(setSettings).catch((error) => {
      showToast(error instanceof Error ? error.message : 'Pengaturan global gagal dimuat.');
    });
  }, [showToast]);

  const handleSaveSettings = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    try {
      setSettings(await adminStore.saveSettings(settings, adminPin));
      showToast('Pengaturan berhasil disimpan ke database.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Pengaturan gagal disimpan.');
    }
  }, [adminPin, settings, showToast]);

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
