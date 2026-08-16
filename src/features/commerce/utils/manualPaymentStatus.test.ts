import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getManualPaymentResumeLabel,
  isResumableManualPaymentStatus,
} from './manualPaymentStatus';

test('offers the correct continuation action for active user payment states', () => {
  assert.equal(isResumableManualPaymentStatus('pending_payment'), true);
  assert.equal(isResumableManualPaymentStatus('pending_review'), true);
  assert.equal(isResumableManualPaymentStatus('rejected'), true);
  assert.equal(getManualPaymentResumeLabel('pending_payment'), 'Lanjutkan pembayaran');
  assert.equal(getManualPaymentResumeLabel('pending_review'), 'Periksa status');
  assert.equal(getManualPaymentResumeLabel('rejected'), 'Kirim ulang bukti');
});

test('does not offer resume for terminal payment states', () => {
  assert.equal(isResumableManualPaymentStatus('paid'), false);
  assert.equal(isResumableManualPaymentStatus('expired'), false);
  assert.equal(isResumableManualPaymentStatus('failed'), false);
  assert.equal(isResumableManualPaymentStatus('cancelled'), false);
});
