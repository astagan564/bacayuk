import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldExpireManualPaymentOrder } from './manualPaymentStatus';

const NOW = Date.parse('2026-08-15T12:00:00.000Z');

test('expires unpaid and rejected manual orders after their deadline', () => {
  const expiredAt = '2026-08-15T11:59:59.000Z';
  assert.equal(shouldExpireManualPaymentOrder('pending_payment', expiredAt, NOW), true);
  assert.equal(shouldExpireManualPaymentOrder('rejected', expiredAt, NOW), true);
});

test('does not expire an order after proof submission', () => {
  assert.equal(
    shouldExpireManualPaymentOrder('pending_review', '2026-08-15T11:59:59.000Z', NOW),
    false,
  );
});

test('does not expire future or terminal orders', () => {
  assert.equal(shouldExpireManualPaymentOrder('pending_payment', '2026-08-15T12:00:01.000Z', NOW), false);
  assert.equal(shouldExpireManualPaymentOrder('paid', '2026-08-15T11:59:59.000Z', NOW), false);
  assert.equal(shouldExpireManualPaymentOrder('expired', null, NOW), false);
});
