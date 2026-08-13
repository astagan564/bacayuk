import type {
  CreateTransactionRequest,
  CreateTransactionResponse,
  VerifyTransactionResponse,
} from '@/features/commerce/types/paymentGateway';
import { getAuthenticatedHeaders } from '@/utils/authenticatedFetch';

interface ApiErrorResponse {
  error?: string;
}

export async function createPaymentTransaction(
  request: CreateTransactionRequest,
  signal?: AbortSignal,
): Promise<CreateTransactionResponse> {
  const response = await fetch('/api/create-transaction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...await getAuthenticatedHeaders(),
    },
    body: JSON.stringify(request),
    signal,
  });
  const data = await response.json() as CreateTransactionResponse & ApiErrorResponse;
  if (!response.ok) throw new Error(data.error || 'Transaksi belum dapat dibuat.');
  return data;
}

export async function verifyPaymentTransaction(
  orderId: string,
  signal?: AbortSignal,
): Promise<VerifyTransactionResponse> {
  const response = await fetch('/api/verify-transaction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...await getAuthenticatedHeaders(),
    },
    body: JSON.stringify({ orderId }),
    signal,
  });
  const data = await response.json() as VerifyTransactionResponse;
  if (!response.ok || !data.isPaid) {
    throw new Error(data.error || 'Pembayaran belum terverifikasi. Tunggu beberapa saat lalu coba lagi.');
  }
  return data;
}
