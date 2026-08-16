import type { UserReadingActivity } from '@/utils/adminStore';
import type { UserAccount } from '@/utils/userAuthStore';

interface AdminUsersResponse {
  users?: UserAccount[];
  readingLogs?: UserReadingActivity[];
  error?: string;
}

export interface AdminUsersData {
  users: UserAccount[];
  readingLogs: UserReadingActivity[];
}

export async function fetchAdminUsers(adminPin: string): Promise<AdminUsersData> {
  const response = await fetch('/api/admin/users', {
    headers: { 'x-admin-pin': adminPin },
  });
  const data = await response.json() as AdminUsersResponse;
  if (!response.ok) throw new Error(data.error || 'Data pengguna belum dapat dimuat.');
  return {
    users: data.users || [],
    readingLogs: data.readingLogs || [],
  };
}
