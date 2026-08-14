import { createHash, randomBytes, sign as createSignature, verify as verifySignature } from 'node:crypto';
import type { User } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import { getSupabaseAdminClient } from '../clients/supabaseAdminClient';
import { resolveTransactionRequest } from './payment.service';

const DANA_NOTIFY_PATH = '/api/payments/dana/notify';
const DANA_GENERATE_PATH = '/v1.0/qr/qr-mpm-generate.htm';
const MAX_TIMESTAMP_DRIFT_MS = 10 * 60 * 1000;
const DEFAULT_QRIS_EXPIRY_MINUTES = 30;
const DANA_SANDBOX_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnaKVGRbin4Wh4KN35OPh
ytJBjYTz7QZKSZjmHfiHxFmulfT87rta+IvGJ0rCBgg+1EtKk1hX8G5gPGJs1htJ
5jHa3/jCk9l+luzjnuT9UVlwJahvzmFw+IoDoM7hIPjsLtnIe04SgYo0tZBpEmkQ
vUGhmHPqYnUGSSMIpDLJDvbyr8gtwluja1SbRphgDCoYVXq+uUJ5HzPS049aaxTS
nfXh/qXuDoB9EzCrgppLDS2ubmk21+dr7WaO/3RFjnwx5ouv6w+iC1XOJKar3CTk
X6JV1OSST1C9sbPGzMHZ8AGB51BM0mok7davD/5irUk+f0C25OgzkwtxAt80dkDo
/QIDAQAB
-----END PUBLIC KEY-----`;

type DanaTransactionStatus = '00' | '05';

interface DanaMoney {
  value?: unknown;
  currency?: unknown;
}

interface DanaGenerateResponse {
  responseCode?: unknown;
  responseMessage?: unknown;
  referenceNo?: unknown;
  partnerReferenceNo?: unknown;
  qrContent?: unknown;
  qrUrl?: unknown;
  qrImage?: unknown;
}

export interface DanaPaymentOrderRow {
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
  status: 'pending_payment' | 'paid' | 'failed' | 'expired' | 'cancelled';
  provider: 'dana';
  payment_method: 'dana_qris';
  expires_at: string | null;
  provider_reference_no: string | null;
  provider_external_id: string | null;
  provider_qr_content: string | null;
  provider_qr_url: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DanaFinishNotifyBody {
  originalPartnerReferenceNo?: unknown;
  originalReferenceNo?: unknown;
  originalExternalId?: unknown;
  merchantId?: unknown;
  amount?: DanaMoney;
  latestTransactionStatus?: unknown;
  finishedTime?: unknown;
}

export class DanaCallbackError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly responseCode: string,
  ) {
    super(message);
  }
}

class DanaGenerateError extends Error {
  constructor(message: string, readonly definitive: boolean) {
    super(message);
  }
}

function cleanEnv(name: string) {
  return process.env[name]?.trim() || '';
}

export function getDanaEnvironment() {
  return cleanEnv('DANA_ENV').toLowerCase() === 'production' ? 'production' : 'sandbox';
}

export function getDanaNotifyPath() {
  return DANA_NOTIFY_PATH;
}

export function getDanaCallbackPublicKey() {
  if (getDanaEnvironment() === 'sandbox') return DANA_SANDBOX_PUBLIC_KEY;
  const configuredKey = cleanEnv('DANA_PUBLIC_KEY').replace(/\\n/g, '\n');
  return configuredKey;
}

export function isDanaCallbackConfigured() {
  return Boolean(getDanaCallbackPublicKey());
}

function danaTimestamp(value = new Date()) {
  return new Date(value.getTime() + 7 * 60 * 60 * 1000)
    .toISOString()
    .replace(/\.\d{3}Z$/, '+07:00');
}

function getDanaPrivateKey() {
  return cleanEnv('DANA_PRIVATE_KEY').replace(/\\n/g, '\n');
}

function getDanaGenerateConfig() {
  const environment = getDanaEnvironment();
  return {
    baseUrl: cleanEnv('DANA_API_BASE_URL')
      || (environment === 'sandbox' ? 'https://api.sandbox.dana.id' : 'https://api.saas.dana.id'),
    partnerId: cleanEnv('DANA_X_PARTNER_ID'),
    merchantId: cleanEnv('DANA_MERCHANT_ID'),
    storeId: cleanEnv('DANA_STORE_ID'),
    channelId: cleanEnv('DANA_CHANNEL_ID') || (environment === 'sandbox' ? '95221' : ''),
    origin: cleanEnv('DANA_ORIGIN') || 'https://bacayuk.web.id',
    privateKey: getDanaPrivateKey(),
  };
}

export function isDanaQrisConfigured() {
  const config = getDanaGenerateConfig();
  return Boolean(
    config.baseUrl
    && config.partnerId
    && config.merchantId
    && config.storeId
    && config.channelId
    && config.privateKey,
  );
}

export function isDanaQrisEnabled() {
  return cleanEnv('DANA_QRIS_ENABLED').toLowerCase() === 'true'
    && isDanaQrisConfigured();
}

function getDanaQrisExpiryMinutes() {
  const configured = Number(process.env.DANA_QRIS_EXPIRES_MINUTES);
  if (!Number.isFinite(configured)) return DEFAULT_QRIS_EXPIRY_MINUTES;
  return Math.min(60, Math.max(5, Math.round(configured)));
}

function createPartnerReferenceNo() {
  const date = new Date();
  const stamp = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
    String(date.getUTCHours()).padStart(2, '0'),
    String(date.getUTCMinutes()).padStart(2, '0'),
    String(date.getUTCSeconds()).padStart(2, '0'),
  ].join('');
  return `BY${stamp}${randomBytes(4).toString('hex').toUpperCase()}`;
}

function createExternalId() {
  return `${Date.now()}${randomBytes(6).toString('hex')}`.slice(0, 36);
}

export function signDanaRequest(body: Record<string, unknown>, timestamp: string, privateKey: string) {
  const bodyHash = createHash('sha256')
    .update(JSON.stringify(body))
    .digest('hex')
    .toLowerCase();
  const stringToSign = `POST:${DANA_GENERATE_PATH}:${bodyHash}:${timestamp}`;
  try {
    return createSignature('RSA-SHA256', Buffer.from(stringToSign), privateKey).toString('base64');
  } catch {
    throw new Error('Private Key DANA tidak valid. Periksa format multiline pada Vercel.');
  }
}

export function buildDanaGenerateRequestBody(options: {
  merchantId: string;
  storeId: string;
  orderId: string;
  amount: number;
  expiresAt: Date;
}) {
  return {
    merchantId: options.merchantId,
    storeId: options.storeId,
    partnerReferenceNo: options.orderId,
    amount: { value: `${options.amount}.00`, currency: 'IDR' },
    validityPeriod: danaTimestamp(options.expiresAt),
    additionalInfo: {
      terminalSource: 'MER',
      envInfo: {
        websiteLanguage: 'id_ID',
        sourcePlatform: 'IPG',
        terminalType: 'SYSTEM',
        orderTerminalType: 'WEB',
      },
    },
  };
}

async function qrisImageDataUrl(response: DanaGenerateResponse) {
  if (typeof response.qrImage === 'string' && /^[A-Za-z0-9+/=]+$/.test(response.qrImage)) {
    return `data:image/png;base64,${response.qrImage}`;
  }
  if (typeof response.qrContent === 'string' && response.qrContent) {
    return QRCode.toDataURL(response.qrContent, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 640,
    });
  }
  if (typeof response.qrUrl === 'string' && /^https:\/\//i.test(response.qrUrl)) {
    return response.qrUrl;
  }
  throw new Error('DANA tidak mengembalikan gambar atau isi QRIS yang dapat digunakan.');
}

async function requestDanaQris(options: {
  orderId: string;
  externalId: string;
  amount: number;
  expiresAt: Date;
}) {
  const config = getDanaGenerateConfig();
  if (!isDanaQrisConfigured()) {
    throw new Error('QRIS otomatis belum lengkap dikonfigurasi. Silakan gunakan transfer bank.');
  }
  const timestamp = danaTimestamp();
  const body = buildDanaGenerateRequestBody({
    merchantId: config.merchantId,
    storeId: config.storeId,
    orderId: options.orderId,
    amount: options.amount,
    expiresAt: options.expiresAt,
  });
  const signature = signDanaRequest(body, timestamp, config.privateKey);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}${DANA_GENERATE_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-TIMESTAMP': timestamp,
        'X-SIGNATURE': signature,
        'X-PARTNER-ID': config.partnerId,
        'X-EXTERNAL-ID': options.externalId,
        'CHANNEL-ID': config.channelId,
        ORIGIN: config.origin,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const result = await response.json().catch(() => ({})) as DanaGenerateResponse;
    if (!response.ok || result.responseCode !== '2004700') {
      const message = typeof result.responseMessage === 'string'
        ? result.responseMessage
        : `HTTP ${response.status}`;
      throw new DanaGenerateError(`DANA menolak pembuatan QRIS: ${message}`, response.status < 500);
    }
    if (result.partnerReferenceNo !== options.orderId) {
      throw new DanaGenerateError('Nomor referensi QRIS dari DANA tidak cocok dengan pesanan.', true);
    }
    return {
      referenceNo: typeof result.referenceNo === 'string' && result.referenceNo.trim()
        ? result.referenceNo.trim()
        : null,
      qrContent: typeof result.qrContent === 'string' ? result.qrContent : null,
      qrImageUrl: await qrisImageDataUrl(result),
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new DanaGenerateError('DANA belum merespons dalam 8 detik. Silakan coba lagi.', false);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function createDanaQrisOrder(user: User, body: Record<string, unknown>) {
  const resolved = await resolveTransactionRequest(body, user);
  const supabase = getSupabaseAdminClient();
  const now = new Date();
  const { data: existing, error: existingError } = await supabase
    .from('payment_orders')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'dana')
    .eq('purchase_type', resolved.purchaseType)
    .eq('story_id', resolved.storyId)
    .eq('amount', resolved.amount)
    .eq('status', 'pending_payment')
    .gt('expires_at', now.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingError) throw new Error(`Pesanan QRIS aktif belum dapat diperiksa: ${existingError.message}`);
  const existingOrder = existing as DanaPaymentOrderRow | null;
  if (existingOrder?.provider_qr_url) return existingOrder;

  let activeOrder = existingOrder;
  if (!activeOrder) {
    const expiresAt = new Date(now.getTime() + getDanaQrisExpiryMinutes() * 60 * 1000);
    const row = {
      order_id: createPartnerReferenceNo(),
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
      provider: 'dana',
      payment_method: 'dana_qris',
      provider_external_id: createExternalId(),
      expires_at: expiresAt.toISOString(),
    };
    const { data: inserted, error: insertError } = await supabase
      .from('payment_orders')
      .insert(row)
      .select('*')
      .single();
    if (insertError) throw new Error(`Pesanan QRIS belum dapat dibuat: ${insertError.message}`);
    activeOrder = inserted as DanaPaymentOrderRow;
  }

  const orderId = activeOrder.order_id;
  const externalId = activeOrder.provider_external_id || createExternalId();
  const expiresAt = activeOrder.expires_at ? new Date(activeOrder.expires_at) : new Date(
    now.getTime() + getDanaQrisExpiryMinutes() * 60 * 1000,
  );

  try {
    const generated = await requestDanaQris({
      orderId,
      externalId,
      amount: resolved.amount,
      expiresAt,
    });
    const { data: updated, error: updateError } = await supabase
      .from('payment_orders')
      .update({
        provider_reference_no: generated.referenceNo,
        provider_qr_content: generated.qrContent,
        provider_qr_url: generated.qrImageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', orderId)
      .eq('user_id', user.id)
      .eq('provider', 'dana')
      .select('*')
      .single();
    if (updateError) throw new Error(`QRIS belum dapat disimpan: ${updateError.message}`);
    return updated as DanaPaymentOrderRow;
  } catch (error) {
    if (error instanceof DanaGenerateError && error.definitive) {
      await supabase
        .from('payment_orders')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('order_id', orderId)
        .eq('provider', 'dana');
    }
    throw error;
  }
}

export async function getDanaQrisOrderForUser(orderId: string, userId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('payment_orders')
    .select('*')
    .eq('order_id', orderId)
    .eq('user_id', userId)
    .eq('provider', 'dana')
    .maybeSingle();
  if (error) throw new Error(`Pesanan QRIS belum dapat dimuat: ${error.message}`);
  if (!data) throw new Error('Pesanan QRIS tidak ditemukan untuk akun ini.');
  if (data.status === 'pending_payment' && data.expires_at && new Date(data.expires_at) <= new Date()) {
    const { data: expired, error: expiryError } = await supabase
      .from('payment_orders')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('order_id', orderId)
      .eq('provider', 'dana')
      .eq('status', 'pending_payment')
      .select('*')
      .single();
    if (expiryError) throw new Error(`Status QRIS belum dapat diperbarui: ${expiryError.message}`);
    return expired as DanaPaymentOrderRow;
  }
  return data as DanaPaymentOrderRow;
}

export function getDanaQrisInstructions(order: DanaPaymentOrderRow) {
  return {
    bankTransfer: null,
    qrisImageUrl: order.provider_qr_url,
    qrisAmountMode: 'dynamic' as const,
    qrisAutomaticVerification: true,
    expiresHours: null,
  };
}

export function toDanaOrderResponse(order: DanaPaymentOrderRow) {
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
    proofSubmittedAt: null,
    payerNote: null,
    reviewNote: null,
    paidAt: order.paid_at,
    createdAt: order.created_at,
    instructions: getDanaQrisInstructions(order),
  };
}

function requireString(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new DanaCallbackError(`${field} is required.`, 400, '4005602');
  }
  return value.trim();
}

function parseIdrAmount(money: DanaMoney | undefined) {
  if (money?.currency !== 'IDR' || typeof money.value !== 'string') {
    throw new DanaCallbackError('Payment amount must use IDR.', 400, '4005601');
  }
  const match = money.value.match(/^(\d+)\.00$/);
  if (!match) throw new DanaCallbackError('Payment amount format is invalid.', 400, '4005601');
  const amount = Number(match[1]);
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new DanaCallbackError('Payment amount is invalid.', 400, '4005601');
  }
  return amount;
}

function assertFreshTimestamp(timestamp: string) {
  const parsed = Date.parse(timestamp);
  if (!Number.isFinite(parsed) || Math.abs(Date.now() - parsed) > MAX_TIMESTAMP_DRIFT_MS) {
    throw new DanaCallbackError('X-TIMESTAMP is invalid or expired.', 401, '4015600');
  }
}

export function verifyDanaFinishNotifySignature(options: {
  body: DanaFinishNotifyBody;
  timestamp: string;
  signature: string;
}) {
  const publicKey = getDanaCallbackPublicKey();
  if (!publicKey) {
    throw new DanaCallbackError('DANA callback verification is not configured.', 503, '5005601');
  }
  assertFreshTimestamp(options.timestamp);
  const bodyHash = createHash('sha256')
    .update(JSON.stringify(options.body))
    .digest('hex')
    .toLowerCase();
  const stringToVerify = `POST:${DANA_NOTIFY_PATH}:${bodyHash}:${options.timestamp}`;
  let signatureBytes: Buffer;
  try {
    signatureBytes = Buffer.from(options.signature, 'base64');
  } catch {
    throw new DanaCallbackError('X-SIGNATURE is invalid.', 401, '4015600');
  }
  const valid = signatureBytes.length > 0 && verifySignature(
    'RSA-SHA256',
    Buffer.from(stringToVerify),
    publicKey,
    signatureBytes,
  );
  if (!valid) throw new DanaCallbackError('DANA callback signature is invalid.', 401, '4015600');
}

function parsePaidAt(body: DanaFinishNotifyBody) {
  if (typeof body.finishedTime !== 'string') return new Date().toISOString();
  const parsed = Date.parse(body.finishedTime);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : new Date().toISOString();
}

export async function processDanaFinishNotify(options: {
  body: DanaFinishNotifyBody;
  timestamp: string;
  signature: string;
  partnerId: string;
  externalId: string;
}) {
  verifyDanaFinishNotifySignature(options);

  const configuredPartnerId = cleanEnv('DANA_X_PARTNER_ID');
  if (configuredPartnerId && options.partnerId !== configuredPartnerId) {
    throw new DanaCallbackError('X-PARTNER-ID does not match.', 401, '4015600');
  }
  const configuredMerchantId = cleanEnv('DANA_MERCHANT_ID');
  const merchantId = requireString(options.body.merchantId, 'merchantId');
  if (configuredMerchantId && merchantId !== configuredMerchantId) {
    throw new DanaCallbackError('merchantId does not match.', 401, '4015600');
  }

  const orderId = requireString(options.body.originalPartnerReferenceNo, 'originalPartnerReferenceNo');
  const danaReferenceNo = requireString(options.body.originalReferenceNo, 'originalReferenceNo');
  const amount = parseIdrAmount(options.body.amount);
  const status = requireString(options.body.latestTransactionStatus, 'latestTransactionStatus') as DanaTransactionStatus;
  if (status !== '00' && status !== '05') {
    throw new DanaCallbackError('Unsupported DANA transaction status.', 400, '4005601');
  }

  const supabase = getSupabaseAdminClient();
  if (status === '05') {
    const { error } = await supabase
      .from('payment_orders')
      .update({
        status: 'expired',
        provider_reference_no: danaReferenceNo,
        provider_external_id: options.externalId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', orderId)
      .eq('provider', 'dana')
      .in('status', ['pending', 'pending_payment']);
    if (error) throw new Error(`DANA expiry could not be recorded: ${error.message}`);
    return { orderId, status: 'expired' as const };
  }

  const { data, error } = await supabase.rpc('finalize_dana_payment_order', {
    p_order_id: orderId,
    p_dana_reference_no: danaReferenceNo,
    p_dana_external_id: options.externalId || null,
    p_gross_amount: amount,
    p_paid_at: parsePaidAt(options.body),
  });
  if (error) throw new Error(`DANA payment could not be finalized: ${error.message}`);
  return { orderId, status: 'paid' as const, entitlementCreated: Boolean(data) };
}
