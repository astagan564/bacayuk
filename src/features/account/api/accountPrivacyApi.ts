import { getAuthenticatedHeaders } from '@/utils/authenticatedFetch';

export interface AccountDataExport {
  exportedAt: string;
  account: Record<string, unknown>;
  readingActivity: unknown[];
  commerce: Record<string, unknown[]>;
}

async function readError(response: Response): Promise<string> {
  const body = await response.json().catch(() => ({})) as { error?: string };
  return body.error || 'Permintaan akun gagal diproses.';
}

export async function fetchAccountDataExport(): Promise<AccountDataExport> {
  const response = await fetch('/api/account/export', {
    headers: await getAuthenticatedHeaders(),
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<AccountDataExport>;
}

export async function deleteAccount(email: string, confirmation: string): Promise<void> {
  const response = await fetch('/api/account', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...await getAuthenticatedHeaders(),
    },
    body: JSON.stringify({ email, confirmation }),
  });
  if (!response.ok) throw new Error(await readError(response));
}
