import { randomUUID } from 'node:crypto';
import type { User } from '@supabase/supabase-js';
import { getSupabaseAdminClient } from '../clients/supabaseAdminClient';
import {
  resolveTransactionRequest,
  type EntitlementRow,
  type ResolvedTransactionOrder,
} from './payment.service';

const PAYMENT_PROOF_BUCKET = 'payment-proofs';
const MAX_PROOF_BYTES = 1_572_864;
const REUSABLE_MANUAL_STATUSES = ['pending_payment', 'pending_review', 'rejected'] as const;
const QRIS_ASSET_PATHS = {
  book15000: '/payments/qris/qris-15k.png',
  book25000: '/payments/qris/qris-25k.png',
  vip100000: '/payments/qris/qris-vip-100k.png',
  manual: '/payments/qris/qris-manual.png',
} as const;

export type ManualPaymentMethod = 'manual_bank_transfer' | 'manual_qris';
export type ManualPaymentStatus =
  | 'pending_payment'
  | 'pending_review'
  | 'paid'
  | 'rejected'
  | 'cancelled'
  | 'expired';

export interface ManualPaymentOrderRow {
  order_id: string;
  user_id: string | null;
  purchase_type: 'book' | 'vip';
  story_id: string;
  story_title: string;
  amount: number;
  discount_amount: number;
  coupon_code: string | null;
  customer_name: string;
  customer_email: string;
  status: ManualPaymentStatus;
  provider: 'manual';
  payment_method: ManualPaymentMethod | null;
  expires_at: string | null;
  proof_object_path: string | null;
  proof_mime_type: string | null;
  proof_submitted_at: string | null;
  payer_note: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ManualPaymentInstructions {
  bankTransfer: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  } | null;
  qrisImageUrl: string | null;
  qrisAmountMode: 'dynamic' | 'fixed' | 'manual' | null;
  qrisAutomaticVerification: boolean;
  expiresHours: number | null;
}

function cleanEnv(name: string): string {
  return process.env[name]?.trim() || '';
}

function getExpiryHours(): number {
  return Math.min(72, Math.max(1, Number(process.env.MANUAL_PAYMENT_EXPIRES_HOURS) || 24));
}

export function getManualPaymentInstructions(
  purchaseType: 'book' | 'vip',
  amount: number,
  selectedMethod?: ManualPaymentMethod | null,
): ManualPaymentInstructions {
  const bankName = cleanEnv('MANUAL_PAYMENT_BANK_NAME');
  const accountNumber = cleanEnv('MANUAL_PAYMENT_ACCOUNT_NUMBER');
  const accountHolder = cleanEnv('MANUAL_PAYMENT_ACCOUNT_HOLDER');
  const bankTransfer = selectedMethod !== 'manual_qris' && bankName && accountNumber && accountHolder
    ? { bankName, accountNumber, accountHolder }
    : null;
  const fixedQrisImageUrl = purchaseType === 'vip' && amount === 100_000
    ? cleanEnv('MANUAL_PAYMENT_QRIS_VIP_100000_URL') || QRIS_ASSET_PATHS.vip100000
    : purchaseType === 'book' && amount === 15_000
      ? cleanEnv('MANUAL_PAYMENT_QRIS_15000_URL') || QRIS_ASSET_PATHS.book15000
      : purchaseType === 'book' && amount === 25_000
        ? cleanEnv('MANUAL_PAYMENT_QRIS_25000_URL') || QRIS_ASSET_PATHS.book25000
        : '';
  const qrisImageUrl = selectedMethod === 'manual_bank_transfer'
    ? ''
    : fixedQrisImageUrl
      || cleanEnv('MANUAL_PAYMENT_QRIS_MANUAL_URL')
      || QRIS_ASSET_PATHS.manual;

  if (!bankTransfer && !qrisImageUrl) {
    throw new Error('Pembayaran manual belum dikonfigurasi oleh admin.');
  }

  return {
    bankTransfer,
    qrisImageUrl: qrisImageUrl || null,
    qrisAmountMode: fixedQrisImageUrl ? 'fixed' : 'manual',
    qrisAutomaticVerification: false,
    expiresHours: getExpiryHours(),
  };
}

async function expireOrderIfNeeded(order: ManualPaymentOrderRow | null) {
  if (!order?.expires_at || new Date(order.expires_at).getTime() > Date.now()) return order;
  if (!REUSABLE_MANUAL_STATUSES.includes(order.status as typeof REUSABLE_MANUAL_STATUSES[number])) return order;

  const { error } = await getSupabaseAdminClient()
    .from('payment_orders')
    .update({ status: 'expired', updated_at: new Date().toISOString() })
    .eq('order_id', order.order_id)
    .in('status', [...REUSABLE_MANUAL_STATUSES]);
  if (error) throw new Error(`Status pesanan belum dapat diperbarui: ${error.message}`);
  return { ...order, status: 'expired' as const };
}

export async function createManualPaymentOrder(
  user: User,
  body: Record<string, unknown>,
): Promise<{ order: ManualPaymentOrderRow; instructions: ManualPaymentInstructions }> {
  const resolved = await resolveTransactionRequest(body, user);
  const selectedMethod: ManualPaymentMethod = body.paymentMethod === 'manual_qris'
    ? 'manual_qris'
    : 'manual_bank_transfer';
  const supabase = getSupabaseAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from('payment_orders')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'manual')
    .eq('purchase_type', resolved.purchaseType)
    .eq('story_id', resolved.storyId)
    .eq('amount', resolved.amount)
    .eq('payment_method', selectedMethod)
    .in('status', [...REUSABLE_MANUAL_STATUSES])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingError) throw new Error(`Pesanan aktif belum dapat diperiksa: ${existingError.message}`);

  const currentOrder = await expireOrderIfNeeded(existing as ManualPaymentOrderRow | null);
  if (currentOrder && currentOrder.status !== 'expired') {
    return {
      order: currentOrder,
      instructions: getManualPaymentInstructions(
        currentOrder.purchase_type,
        currentOrder.amount,
        currentOrder.payment_method,
      ),
    };
  }

  const instructions = getManualPaymentInstructions(resolved.purchaseType, resolved.amount, selectedMethod);
  const orderId = `MAN-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const expiresAt = new Date(
    Date.now() + (instructions.expiresHours ?? getExpiryHours()) * 60 * 60 * 1000,
  ).toISOString();
  const row = {
    order_id: orderId,
    user_id: user.id,
    purchase_type: resolved.purchaseType,
    story_id: resolved.storyId,
    story_title: resolved.storyTitle,
    amount: resolved.amount,
    discount_amount: resolved.discountAmount,
    coupon_code: resolved.couponCode,
    customer_name: resolved.customerName,
    customer_email: resolved.customerEmail,
    status: 'pending_payment',
    provider: 'manual',
    payment_method: selectedMethod,
    expires_at: expiresAt,
  };
  const { data, error } = await supabase.from('payment_orders').insert(row).select('*').single();
  if (error) throw new Error(`Pesanan pembayaran belum dapat dibuat: ${error.message}`);
  return { order: data as ManualPaymentOrderRow, instructions };
}

export async function getManualPaymentOrderForUser(orderId: string, userId: string) {
  const { data, error } = await getSupabaseAdminClient()
    .from('payment_orders')
    .select('*')
    .eq('order_id', orderId)
    .eq('user_id', userId)
    .eq('provider', 'manual')
    .maybeSingle();
  if (error) throw new Error(`Pesanan belum dapat dimuat: ${error.message}`);
  if (!data) throw new Error('Pesanan pembayaran manual tidak ditemukan untuk akun ini.');
  return expireOrderIfNeeded(data as ManualPaymentOrderRow);
}

function detectProofMimeType(bytes: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

function decodeProofDataUrl(dataUrl: unknown) {
  if (typeof dataUrl !== 'string') throw new Error('Bukti pembayaran wajib berupa gambar.');
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error('Gunakan bukti berformat JPG, PNG, atau WebP.');
  const bytes = Buffer.from(match[2], 'base64');
  const detectedMimeType = detectProofMimeType(bytes);
  if (!detectedMimeType || detectedMimeType !== match[1]) {
    throw new Error('Isi file bukti pembayaran tidak valid.');
  }
  if (bytes.length === 0 || bytes.length > MAX_PROOF_BYTES) {
    throw new Error('Ukuran bukti pembayaran maksimal 1,5 MB.');
  }
  return { bytes, mimeType: detectedMimeType };
}

export async function submitManualPaymentProof(options: {
  orderId: string;
  userId: string;
  dataUrl: unknown;
  paymentMethod: unknown;
  payerNote: unknown;
}) {
  const order = await getManualPaymentOrderForUser(options.orderId, options.userId);
  if (!order || !['pending_payment', 'rejected'].includes(order.status)) {
    throw new Error(order?.status === 'pending_review'
      ? 'Bukti pembayaran sudah dikirim dan sedang diperiksa.'
      : 'Pesanan ini tidak dapat menerima bukti pembayaran.');
  }
  if (order.status === 'expired') throw new Error('Pesanan sudah kedaluwarsa. Buat pesanan baru.');

  const method = options.paymentMethod === 'manual_qris'
    ? 'manual_qris'
    : 'manual_bank_transfer';
  const instructions = getManualPaymentInstructions(order.purchase_type, order.amount, order.payment_method);
  if (method === 'manual_qris' && !instructions.qrisImageUrl) throw new Error('Pembayaran QRIS belum tersedia.');
  if (method === 'manual_bank_transfer' && !instructions.bankTransfer) throw new Error('Transfer bank belum tersedia.');

  const { bytes, mimeType } = decodeProofDataUrl(options.dataUrl);
  const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1];
  const objectPath = `${options.userId}/${options.orderId}/${Date.now()}.${extension}`;
  const supabase = getSupabaseAdminClient();
  const { error: uploadError } = await supabase.storage
    .from(PAYMENT_PROOF_BUCKET)
    .upload(objectPath, bytes, { contentType: mimeType, upsert: false });
  if (uploadError) throw new Error(`Bukti pembayaran belum dapat disimpan: ${uploadError.message}`);

  const payerNote = typeof options.payerNote === 'string'
    ? options.payerNote.trim().slice(0, 240) || null
    : null;
  const submittedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('payment_orders')
    .update({
      status: 'pending_review',
      payment_method: method,
      proof_object_path: objectPath,
      proof_mime_type: mimeType,
      proof_submitted_at: submittedAt,
      payer_note: payerNote,
      review_note: null,
      reviewed_at: null,
      reviewed_by: null,
      updated_at: submittedAt,
    })
    .eq('order_id', options.orderId)
    .eq('user_id', options.userId)
    .in('status', ['pending_payment', 'rejected'])
    .select('*')
    .maybeSingle();

  if (error || !data) {
    await supabase.storage.from(PAYMENT_PROOF_BUCKET).remove([objectPath]);
    throw new Error(error?.message || 'Status pesanan berubah. Muat ulang sebelum mengirim bukti.');
  }
  if (order.proof_object_path && order.proof_object_path !== objectPath) {
    await supabase.storage.from(PAYMENT_PROOF_BUCKET).remove([order.proof_object_path]);
  }
  return data as ManualPaymentOrderRow;
}

export async function listManualPaymentOrdersForAdmin() {
  const supabase = getSupabaseAdminClient();
  await supabase
    .from('payment_orders')
    .update({ status: 'expired', updated_at: new Date().toISOString() })
    .eq('provider', 'manual')
    .eq('status', 'pending_payment')
    .lt('expires_at', new Date().toISOString());

  const { data, error } = await supabase
    .from('payment_orders')
    .select('*')
    .eq('provider', 'manual')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw new Error(`Pesanan manual belum dapat dimuat: ${error.message}`);

  return Promise.all(((data || []) as ManualPaymentOrderRow[]).map(async (order) => {
    if (!order.proof_object_path) return { ...order, proof_signed_url: null };
    const { data: signedData } = await supabase.storage
      .from(PAYMENT_PROOF_BUCKET)
      .createSignedUrl(order.proof_object_path, 600);
    return { ...order, proof_signed_url: signedData?.signedUrl || null };
  }));
}

export async function approveManualPaymentOrder(
  orderId: string,
  reviewedBy: string,
  reviewNote?: string,
) {
  const { data, error } = await getSupabaseAdminClient().rpc('approve_manual_payment_order', {
    p_order_id: orderId,
    p_reviewed_by: reviewedBy,
    p_review_note: reviewNote?.trim() || null,
  });
  if (error) throw new Error(`Pembayaran belum dapat disetujui: ${error.message}`);
  if (!data) throw new Error('Akses pembelian tidak berhasil dibuat.');
  return data as EntitlementRow;
}

export async function rejectManualPaymentOrder(
  orderId: string,
  reviewedBy: string,
  reviewNote: string,
) {
  const note = reviewNote.trim();
  if (!note) throw new Error('Alasan penolakan wajib diisi.');
  const now = new Date().toISOString();
  const { data, error } = await getSupabaseAdminClient()
    .from('payment_orders')
    .update({
      status: 'rejected',
      review_note: note.slice(0, 500),
      reviewed_at: now,
      reviewed_by: reviewedBy,
      updated_at: now,
    })
    .eq('order_id', orderId)
    .eq('provider', 'manual')
    .eq('status', 'pending_review')
    .select('*')
    .maybeSingle();
  if (error) throw new Error(`Pembayaran belum dapat ditolak: ${error.message}`);
  if (!data) throw new Error('Pesanan tidak lagi menunggu verifikasi.');
  return data as ManualPaymentOrderRow;
}

export function toManualOrderResponse(
  order: ManualPaymentOrderRow,
  instructions?: ManualPaymentInstructions,
) {
  return {
    orderId: order.order_id,
    purchaseType: order.purchase_type,
    storyId: order.story_id,
    storyTitle: order.story_title,
    amount: order.amount,
    discountAmount: order.discount_amount,
    couponCode: order.coupon_code,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    status: order.status,
    provider: order.provider,
    paymentMethod: order.payment_method,
    expiresAt: order.expires_at,
    proofSubmittedAt: order.proof_submitted_at,
    payerNote: order.payer_note,
    reviewNote: order.review_note,
    paidAt: order.paid_at,
    createdAt: order.created_at,
    instructions,
  };
}

export type ManualResolvedOrder = ResolvedTransactionOrder;
