export type ExpirableManualPaymentStatus = 'pending_payment' | 'rejected';

const EXPIRABLE_MANUAL_PAYMENT_STATUSES = new Set<ExpirableManualPaymentStatus>([
  'pending_payment',
  'rejected',
]);

export function shouldExpireManualPaymentOrder(
  status: string,
  expiresAt: string | null,
  now = Date.now(),
): boolean {
  if (!EXPIRABLE_MANUAL_PAYMENT_STATUSES.has(status as ExpirableManualPaymentStatus)) return false;
  if (!expiresAt) return false;
  const expiryTime = Date.parse(expiresAt);
  return Number.isFinite(expiryTime) && expiryTime <= now;
}

export function getExpirableManualPaymentStatuses(): ExpirableManualPaymentStatus[] {
  return [...EXPIRABLE_MANUAL_PAYMENT_STATUSES];
}
