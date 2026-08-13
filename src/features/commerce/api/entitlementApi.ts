import type { PurchaseReceipt } from '@/utils/paymentStore';
import { getAuthenticatedHeaders } from '@/utils/authenticatedFetch';

interface EntitlementResponse {
  vipExpiresAt: string | null;
  purchases: PurchaseReceipt[];
  error?: string;
}

interface ReceiptResponse {
  receipt: PurchaseReceipt;
  error?: string;
}

async function parseResponse<T extends { error?: string }>(response: Response): Promise<T> {
  const data = await response.json() as T;
  if (!response.ok) throw new Error(data.error || 'Hak akses tidak dapat diverifikasi.');
  return data;
}

export async function fetchEntitlements(): Promise<EntitlementResponse> {
  const response = await fetch('/api/entitlements', {
    headers: await getAuthenticatedHeaders(),
  });
  return parseResponse<EntitlementResponse>(response);
}

export async function consumeDownload(storyId: string): Promise<PurchaseReceipt> {
  const response = await fetch('/api/consume-download', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...await getAuthenticatedHeaders(),
    },
    body: JSON.stringify({ storyId }),
  });
  return (await parseResponse<ReceiptResponse>(response)).receipt;
}

export async function renewDownload(storyId: string): Promise<PurchaseReceipt> {
  const response = await fetch('/api/renew-download', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...await getAuthenticatedHeaders(),
    },
    body: JSON.stringify({ storyId }),
  });
  return (await parseResponse<ReceiptResponse>(response)).receipt;
}
