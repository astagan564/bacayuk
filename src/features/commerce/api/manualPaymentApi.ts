import { getAuthenticatedHeaders } from '@/utils/authenticatedFetch';
import type {
  ManualPaymentMethod,
  ManualPaymentOrder,
} from '@/features/commerce/types/manualPayment';
import type { CreateTransactionRequest } from '@/features/commerce/types/paymentGateway';

interface ManualOrderResponse {
  order?: ManualPaymentOrder;
  error?: string;
}

async function parseOrderResponse(response: Response): Promise<ManualPaymentOrder> {
  const data = await response.json() as ManualOrderResponse;
  if (!response.ok || !data.order) {
    throw new Error(data.error || 'Pesanan pembayaran belum dapat diproses.');
  }
  return data.order;
}

export async function createManualPaymentOrder(
  request: CreateTransactionRequest,
  signal?: AbortSignal,
) {
  return parseOrderResponse(await fetch('/api/manual-payment-orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...await getAuthenticatedHeaders(),
    },
    body: JSON.stringify(request),
    signal,
  }));
}

export async function submitManualPaymentProof(options: {
  orderId: string;
  dataUrl: string;
  paymentMethod: ManualPaymentMethod;
  payerNote: string;
  signal?: AbortSignal;
}) {
  return parseOrderResponse(await fetch(`/api/manual-payment-orders/${encodeURIComponent(options.orderId)}/proof`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...await getAuthenticatedHeaders(),
    },
    body: JSON.stringify({
      dataUrl: options.dataUrl,
      paymentMethod: options.paymentMethod,
      payerNote: options.payerNote,
    }),
    signal: options.signal,
  }));
}

