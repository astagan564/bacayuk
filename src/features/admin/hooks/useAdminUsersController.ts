import { useCallback, useState } from 'react';
import { adminStore, LEGACY_DEMO_USER_IDS } from '@/utils/adminStore';
import type { UserReadingActivity } from '@/utils/adminStore';
import { userAuthStore } from '@/utils/userAuthStore';
import type { UserAccount } from '@/utils/userAuthStore';
import { exportUsersCsv } from '@/features/admin/helpers/exportUsersCsv';

interface AdminUsersControllerOptions {
  showToast: (message: string) => void;
}

export function useAdminUsersController({ showToast }: AdminUsersControllerOptions) {
  const [readingLogs] = useState<UserReadingActivity[]>(() => adminStore.getReadingLogs());
  const [users] = useState<UserAccount[]>(() => {
    const currentUser = userAuthStore.getUser();
    return currentUser && !LEGACY_DEMO_USER_IDS.has(currentUser.id) ? [currentUser] : [];
  });
  const [searchQuery, setSearchQuery] = useState('');

  const handleExportCsv = useCallback(() => {
    exportUsersCsv(users);
    showToast('Data orang tua diekspor ke CSV.');
  }, [showToast, users]);

  return {
    users,
    readingLogs,
    searchQuery,
    setSearchQuery,
    handleExportCsv,
  };
}
