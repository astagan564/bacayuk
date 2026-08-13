import midtransClient from 'midtrans-client';
import type { User } from '@supabase/supabase-js';
import { BUNDLED_CATALOG_STORIES, INITIAL_STORIES } from '../../data/stories';
import type { Story } from '../../types';
import { getSupabaseAdminClient } from '../clients/supabaseAdminClient';
import { DEFAULT_EBOOK_PRICE, VIP_SUBSCRIPTION_PRICE } from '../config/storybookConfig';
import { normalizeStory } from '../utils/storybookNormalization';

const SERVER_COUPONS = [
  { code: 'BUKUANAK20', type: 'percent', value: 20, maxUsage: 100 },
  { code: 'MERDEKA5K', type: 'fixed', value: 5000, maxUsage: 50 },
  { code: 'PARENTSPROMO', type: 'percent', value: 30, maxUsage: 200 },
] as const;

export function getSnapClient() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.VITE_MIDTRANS_CLIENT_KEY;

  if (!serverKey || !clientKey) {
    throw new Error('Midtrans keys are not configured.');
  }

  return new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey,
    clientKey,
  });
}

export function getCoreClient() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.VITE_MIDTRANS_CLIENT_KEY;

  if (!serverKey || !clientKey) {
    throw new Error('Midtrans keys are not configured.');
  }

  return new midtransClient.CoreApi({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey,
    clientKey,
  });
}

function calculateDiscount(couponCode: unknown, originalAmount: number) {
  if (typeof couponCode !== 'string' || !couponCode.trim()) {
    return { discountAmount: 0, couponCode: null as string | null };
  }

  const cleanCode = couponCode.trim().toUpperCase();
  const coupon = SERVER_COUPONS.find((item) => item.code === cleanCode);
  if (!coupon) {
    return { discountAmount: 0, couponCode: null as string | null };
  }

  const rawDiscount =
    coupon.type === 'percent' ? Math.round((originalAmount * coupon.value) / 100) : coupon.value;

  return {
    discountAmount: Math.min(originalAmount, Math.max(0, rawDiscount)),
    couponCode: coupon.code,
  };
}

async function findStoryForCheckout(storyId: string): Promise<Story | undefined> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('admin_stories')
      .select('story, status')
      .eq('id', storyId)
      .eq('status', 'published')
      .maybeSingle();

    if (error) throw error;
    return data?.story
      ? normalizeStory(data.story as Story)
      : BUNDLED_CATALOG_STORIES.find((item) => item.id === storyId);
  } catch (error) {
    console.warn('Failed to load checkout story from Supabase:', error);
    return INITIAL_STORIES.find((item) => item.id === storyId);
  }
}

export interface ResolvedTransactionOrder {
  purchaseType: 'book' | 'vip';
  storyId: string;
  storyTitle: string;
  amount: number;
  discountAmount: number;
  couponCode: string | null;
  customerName: string;
  customerEmail: string;
}

export interface PaymentOrderRow extends ResolvedTransactionOrder {
  orderId: string;
  userId: string;
  status: 'pending' | 'paid' | 'failed' | 'expired' | 'refunded';
}

export function getMidtransAmountBreakdown(orderAmount: number, grossAmount: number) {
  return {
    orderAmount,
    grossAmount,
    customerFeeAmount: Math.max(0, grossAmount - orderAmount),
  };
}

export interface EntitlementRow {
  id: number;
  user_id: string;
  entitlement_type: 'book' | 'vip';
  story_id: string | null;
  story_title: string;
  source_order_id: string;
  customer_name: string;
  customer_email: string;
  payment_method: string;
  amount: number;
  starts_at: string;
  expires_at: string | null;
  token_expires_at: string | null;
  download_count: number;
  download_limit: number | null;
  created_at: string;
}

function getVerifiedCustomer(user: User) {
  const customerEmail = user.email?.trim().toLowerCase() || '';
  const customerName = String(
    user.user_metadata?.full_name
    || user.user_metadata?.name
    || customerEmail.split('@')[0]
    || 'Orang Tua',
  ).trim().slice(0, 80);

  if (!customerEmail || !customerEmail.includes('@')) {
    throw new Error('Akun login harus memiliki email terverifikasi untuk melakukan pembayaran.');
  }
  return { customerName, customerEmail };
}

export async function resolveTransactionRequest(
  body: Record<string, unknown>,
  user: User,
): Promise<ResolvedTransactionOrder> {
  const purchaseType = body.purchaseType === 'vip' ? 'vip' : 'book';
  const { customerName, customerEmail } = getVerifiedCustomer(user);

  if (purchaseType === 'vip') {
    const { discountAmount, couponCode } = calculateDiscount(body.couponCode, VIP_SUBSCRIPTION_PRICE);
    return {
      purchaseType,
      storyId: 'vip_sub',
      storyTitle: 'Langganan VIP 1 Bulan',
      amount: Math.max(1000, VIP_SUBSCRIPTION_PRICE - discountAmount),
      discountAmount,
      couponCode,
      customerName,
      customerEmail,
    };
  }

  if (typeof body.storyId !== 'string' || !body.storyId.trim()) {
    throw new Error('storyId is required.');
  }

  const story = await findStoryForCheckout(body.storyId);
  if (story?.downloadEnabled === false) {
    throw new Error('Offline download is disabled for this story.');
  }

  const originalAmount = story?.ebookPrice || DEFAULT_EBOOK_PRICE;
  const { discountAmount, couponCode } = calculateDiscount(body.couponCode, originalAmount);
  const fallbackTitle = typeof body.storyTitle === 'string' && body.storyTitle.trim()
    ? body.storyTitle.trim().slice(0, 80)
    : 'Buku Cerita BacaYuk';

  return {
    purchaseType,
    storyId: body.storyId,
    storyTitle: story?.title || fallbackTitle,
    amount: Math.max(1000, originalAmount - discountAmount),
    discountAmount,
    couponCode,
    customerName,
    customerEmail,
  };
}

export async function savePendingPaymentOrder(
  orderId: string,
  userId: string,
  order: ResolvedTransactionOrder,
): Promise<void> {
  const { error } = await getSupabaseAdminClient().from('payment_orders').insert({
    order_id: orderId,
    user_id: userId,
    purchase_type: order.purchaseType,
    story_id: order.storyId,
    story_title: order.storyTitle,
    amount: order.amount,
    discount_amount: order.discountAmount,
    coupon_code: order.couponCode,
    customer_name: order.customerName,
    customer_email: order.customerEmail,
    status: 'pending',
  });
  if (error) throw new Error(`Failed to save payment order: ${error.message}`);
}

export async function getPaymentOrderForUser(orderId: string, userId: string): Promise<PaymentOrderRow> {
  const { data, error } = await getSupabaseAdminClient()
    .from('payment_orders')
    .select('*')
    .eq('order_id', orderId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load payment order: ${error.message}`);
  if (!data) throw new Error('Payment order tidak ditemukan untuk akun ini.');
  return {
    orderId: data.order_id,
    userId: data.user_id,
    purchaseType: data.purchase_type,
    storyId: data.story_id,
    storyTitle: data.story_title,
    amount: data.amount,
    discountAmount: data.discount_amount,
    couponCode: data.coupon_code,
    customerName: data.customer_name,
    customerEmail: data.customer_email,
    status: data.status,
  } as PaymentOrderRow;
}

export async function getPaymentOrder(orderId: string): Promise<PaymentOrderRow> {
  const { data, error } = await getSupabaseAdminClient()
    .from('payment_orders')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load payment order: ${error.message}`);
  if (!data) throw new Error('Payment order tidak ditemukan.');
  return {
    orderId: data.order_id,
    userId: data.user_id,
    purchaseType: data.purchase_type,
    storyId: data.story_id,
    storyTitle: data.story_title,
    amount: data.amount,
    discountAmount: data.discount_amount,
    couponCode: data.coupon_code,
    customerName: data.customer_name,
    customerEmail: data.customer_email,
    status: data.status,
  } as PaymentOrderRow;
}

export async function finalizePaymentEntitlement(
  orderId: string,
  grossAmount: number,
  paymentMethod: string,
): Promise<EntitlementRow> {
  const { data, error } = await getSupabaseAdminClient().rpc('finalize_payment_entitlement', {
    p_order_id: orderId,
    p_gross_amount: grossAmount,
    p_payment_method: paymentMethod || 'midtrans',
    p_paid_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Failed to issue entitlement: ${error.message}`);
  if (!data) throw new Error('Entitlement was not created.');
  return data as EntitlementRow;
}

export async function listUserEntitlements(userId: string): Promise<EntitlementRow[]> {
  const { data, error } = await getSupabaseAdminClient()
    .from('user_entitlements')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to load entitlements: ${error.message}`);
  return (data || []) as EntitlementRow[];
}

export async function consumeDownloadEntitlement(userId: string, storyId: string) {
  const { data, error } = await getSupabaseAdminClient().rpc('consume_download_entitlement', {
    p_user_id: userId,
    p_story_id: storyId,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Entitlement unduhan tidak ditemukan.');
  return data as EntitlementRow;
}

export async function renewDownloadEntitlement(userId: string, storyId: string) {
  const { data, error } = await getSupabaseAdminClient().rpc('renew_download_entitlement', {
    p_user_id: userId,
    p_story_id: storyId,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Entitlement unduhan tidak ditemukan.');
  return data as EntitlementRow;
}

