import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeIndonesianWhatsAppNumber } from './whatsappContact.service';

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
