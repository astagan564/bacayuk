import { createHash, verify as verifySignature } from 'node:crypto';
import { getSupabaseAdminClient } from '../clients/supabaseAdminClient';

const DANA_NOTIFY_PATH = '/api/payments/dana/notify';
const MAX_TIMESTAMP_DRIFT_MS = 10 * 60 * 1000;
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
  const configuredKey = cleanEnv('DANA_PUBLIC_KEY').replace(/\\n/g, '\n');
  if (configuredKey) return configuredKey;
  return getDanaEnvironment() === 'sandbox' ? DANA_SANDBOX_PUBLIC_KEY : '';
}

export function isDanaCallbackConfigured() {
  return Boolean(getDanaCallbackPublicKey());
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

