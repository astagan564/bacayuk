import { useCallback, useEffect, useState } from 'react';
import type { ReadingActivityFilters, ReadingActivityMetrics, UserReadingActivity } from '@/utils/adminStore';
import type { UserAccount } from '@/utils/userAuthStore';
import { fetchAdminUsers } from '@/features/admin/api/adminUsersApi';
import { exportUsersCsv } from '@/features/admin/helpers/exportUsersCsv';

interface AdminUsersControllerOptions {
  adminPin: string;
  showToast: (message: string) => void;
}

export function useAdminUsersController({ adminPin, showToast }: AdminUsersControllerOptions) {
  const [readingLogs, setReadingLogs] = useState<UserReadingActivity[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activityFilters, setActivityFilters] = useState<ReadingActivityFilters>({ search: '', status: 'all', period: '7d', page: 1 });
  const [activityMetrics, setActivityMetrics] = useState<ReadingActivityMetrics>({ total: 0, activeReaders7d: 0, completed: 0 });
  const [activityPageSize, setActivityPageSize] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshUsers = useCallback(async () => {
    if (!adminPin) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAdminUsers(adminPin, activityFilters);
      setUsers(data.users);
      setReadingLogs(data.readingLogs);
      setActivityMetrics(data.readingActivity.metrics);
      setActivityPageSize(data.readingActivity.pageSize);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Data pengguna belum dapat dimuat.');
    } finally {
      setIsLoading(false);
    }
  }, [activityFilters, adminPin]);

  useEffect(() => {
    void refreshUsers();
  }, [refreshUsers]);

  const handleExportCsv = useCallback(() => {
    exportUsersCsv(users);
    showToast('Data orang tua diekspor ke CSV.');
  }, [showToast, users]);

  return {
    users,
    readingLogs,
    error,
    isLoading,
    searchQuery,
    setSearchQuery,
    activityFilters,
    setActivityFilters,
    activityMetrics,
    activityPageSize,
    refreshUsers,
    handleExportCsv,
  };
}
