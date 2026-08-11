import type {
  CreateTransactionRequest,
  CreateTransactionResponse,
  VerifyTransactionResponse,
} from '@/features/commerce/types/paymentGateway';

interface ApiErrorResponse {
  error?: string;
}

export async function createPaymentTransaction(
  request: CreateTransactionRequest,
): Promise<CreateTransactionResponse> {
  const response = await fetch('/api/create-transaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const data = await response.json() as CreateTransactionResponse & ApiErrorResponse;
  if (!response.ok) throw new Error(data.error || 'Transaksi belum dapat dibuat.');
  return data;
}

export async function verifyPaymentTransaction(
  orderId: string,
): Promise<VerifyTransactionResponse> {
  const response = await fetch('/api/verify-transaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });
  const data = await response.json() as VerifyTransactionResponse;
  if (!response.ok || !data.isPaid) {
    throw new Error(data.error || 'Pembayaran belum terverifikasi. Tunggu beberapa saat lalu coba lagi.');
  }
  return data;
}
