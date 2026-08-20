import type { UserReadingActivity } from '@/utils/adminStore';
import type { ReadingActivityFilters, ReadingActivityMetrics } from '@/features/admin/types/adminStore';
import type { UserAccount } from '@/utils/userAuthStore';

interface AdminUsersResponse {
  users?: UserAccount[];
  readingLogs?: UserReadingActivity[];
  error?: string;
  readingActivity?: {
    metrics: ReadingActivityMetrics;
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface AdminUsersData {
  users: UserAccount[];
  readingLogs: UserReadingActivity[];
  readingActivity: {
    metrics: ReadingActivityMetrics;
    page: number;
    pageSize: number;
    total: number;
  };
}

export async function fetchAdminUsers(adminPin: string, activityFilters: ReadingActivityFilters): Promise<AdminUsersData> {
  const params = new URLSearchParams({
    activitySearch: activityFilters.search,
    activityStatus: activityFilters.status,
    activityPeriod: activityFilters.period,
    activityPage: String(activityFilters.page),
  });
  const response = await fetch(`/api/admin/users?${params}`, {
    headers: { 'x-admin-pin': adminPin },
  });
  const data = await response.json() as AdminUsersResponse;
  if (!response.ok) throw new Error(data.error || 'Data pengguna belum dapat dimuat.');
  return {
    users: data.users || [],
    readingLogs: data.readingLogs || [],
    readingActivity: data.readingActivity || {
      metrics: { total: 0, activeReaders7d: 0, completed: 0 },
      page: 1,
      pageSize: 30,
      total: 0,
    },
  };
}
