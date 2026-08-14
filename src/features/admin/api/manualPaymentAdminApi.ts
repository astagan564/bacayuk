import type { AdminManualPaymentOrder } from '@/features/admin/types/manualPayment';

interface OrdersResponse {
  orders?: AdminManualPaymentOrder[];
  error?: string;
}

async function parseJson<T extends { error?: string }>(response: Response): Promise<T> {
  const data = await response.json() as T;
  if (!response.ok) throw new Error(data.error || 'Permintaan admin belum dapat diproses.');
  return data;
}

export async function fetchManualPaymentOrders(adminPin: string) {
  const data = await parseJson<OrdersResponse>(await fetch('/api/admin/manual-payment-orders', {
    headers: { 'x-admin-pin': adminPin },
  }));
  return data.orders || [];
}

export async function approveManualPaymentOrder(adminPin: string, orderId: string, note?: string) {
  await parseJson<{ error?: string }>(await fetch(`/api/admin/manual-payment-orders/${encodeURIComponent(orderId)}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
    body: JSON.stringify({ note: note || null }),
  }));
}

export async function rejectManualPaymentOrder(adminPin: string, orderId: string, note: string) {
  await parseJson<{ error?: string }>(await fetch(`/api/admin/manual-payment-orders/${encodeURIComponent(orderId)}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
    body: JSON.stringify({ note }),
  }));
}

export async function retryManualPaymentWhatsAppNotification(adminPin: string, orderId: string) {
  const data = await parseJson<{ order?: AdminManualPaymentOrder; error?: string }>(await fetch(`/api/admin/manual-payment-orders/${encodeURIComponent(orderId)}/notify-whatsapp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
  }));
  if (!data.order) throw new Error('Status notifikasi WhatsApp tidak tersedia.');
  return data.order;
}
