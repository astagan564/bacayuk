import { supabase } from '@/utils/supabaseClient';
import { getAuthenticatedHeaders } from '@/utils/authenticatedFetch';
import type {
  AdminSettings,
  DiscountCoupon,
  TransactionRecord,
  UserReadingActivity,
} from '@/features/admin/types/adminStore';

interface SettingsResponse {
  settings?: AdminSettings;
  error?: string;
}

async function parseSettingsResponse(response: Response): Promise<AdminSettings> {
  const data = await response.json() as SettingsResponse;
  if (!response.ok || !data.settings) throw new Error(data.error || 'Pengaturan tidak dapat diproses.');
  return data.settings;
}

export async function fetchAdminSettings(): Promise<AdminSettings> {
  return parseSettingsResponse(await fetch('/api/settings'));
}

export async function persistAdminSettings(
  settings: AdminSettings,
  adminPin: string,
): Promise<AdminSettings> {
  return parseSettingsResponse(await fetch('/api/admin/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-pin': adminPin,
    },
    body: JSON.stringify({ settings }),
  }));
}

export async function persistCoupons(coupons: DiscountCoupon[]): Promise<void> {
  await supabase.from('discount_coupons').upsert(coupons.map((coupon) => ({
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    min_purchase: coupon.minPurchase || null,
    usage_count: coupon.usageCount,
    max_usage: coupon.maxUsage || null,
    expires_at: coupon.expiresAt || null,
    is_active: coupon.isActive,
  })));
}

export async function persistTransaction(transaction: TransactionRecord): Promise<void> {
  await supabase.from('transaction_records').insert({
    id: transaction.id,
    customer_name: transaction.customerName,
    customer_email: transaction.customerEmail,
    customer_phone: transaction.customerPhone || null,
    story_id: transaction.storyId,
    story_title: transaction.storyTitle,
    payment_method: transaction.paymentMethod,
    amount: transaction.amount,
    discount_amount: transaction.discountAmount || null,
    coupon_code: transaction.couponCode || null,
    status: transaction.status,
    created_at: transaction.createdAt,
    paid_at: transaction.paidAt || null,
  });
}

export async function persistTransactionStatus(transaction: TransactionRecord): Promise<void> {
  await supabase.from('transaction_records').update({
    status: transaction.status,
    paid_at: transaction.paidAt || null,
  }).eq('id', transaction.id);
}

export async function persistReadingActivity(activity: UserReadingActivity): Promise<void> {
  const response = await fetch('/api/reading-activities', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...await getAuthenticatedHeaders(),
    },
    body: JSON.stringify({
      storyId: activity.storyId,
      storyTitle: activity.storyTitle,
      lastPageRead: activity.lastPageRead,
      totalPages: activity.totalPages,
      isCompleted: activity.isCompleted,
    }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error || 'Aktivitas membaca tidak dapat disimpan.');
  }
}
