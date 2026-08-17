import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hashWhatsAppVerificationCode,
  normalizeIndonesianWhatsAppNumber,
  resolveWhatsAppContactForOrder,
} from './whatsappContact.service';

test('allows an order without a WhatsApp notification contact', async () => {
  assert.equal(await resolveWhatsAppContactForOrder('test-user', undefined), null);
  assert.equal(await resolveWhatsAppContactForOrder('test-user', null), null);
  assert.equal(await resolveWhatsAppContactForOrder('test-user', ''), null);
});

test('normalizes common Indonesian WhatsApp number formats', () => {
  assert.equal(normalizeIndonesianWhatsAppNumber('0812-3456-7890'), '6281234567890');
  assert.equal(normalizeIndonesianWhatsAppNumber('+62 812 3456 7890'), '6281234567890');
  assert.equal(normalizeIndonesianWhatsAppNumber('81234567890'), '6281234567890');
});

test('rejects empty, foreign, and malformed WhatsApp numbers', () => {
  assert.throws(() => normalizeIndonesianWhatsAppNumber(''), /wajib diisi/i);
  assert.throws(() => normalizeIndonesianWhatsAppNumber('+1 202 555 0123'), /Indonesia yang valid/i);
  assert.throws(() => normalizeIndonesianWhatsAppNumber('0812'), /Indonesia yang valid/i);
});

test('hashes verification codes with contact and secret context', () => {
  const secret = 'test-secret-that-is-long-enough-for-verification';
  const hash = hashWhatsAppVerificationCode(12, '123456', secret);
  assert.match(hash, /^[a-f0-9]{64}$/);
  assert.equal(hash, hashWhatsAppVerificationCode(12, '123456', secret));
  assert.notEqual(hash, hashWhatsAppVerificationCode(13, '123456', secret));
  assert.notEqual(hash, hashWhatsAppVerificationCode(12, '654321', secret));
});
