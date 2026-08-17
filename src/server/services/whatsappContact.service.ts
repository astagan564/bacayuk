import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { getSupabaseAdminClient } from '../clients/supabaseAdminClient';
import { isWhatsAppContactVerificationConfigured, sendWhatsAppContactVerificationCode } from './whatsappNotification.service';

export interface WhatsAppContactRow {
  id: number;
  user_id: string;
  phone_e164: string;
  label: string;
  is_default: boolean;
  order_notifications_enabled: boolean;
  consented_at: string | null;
  opted_out_at: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

interface VerificationChallengeRow {
  code_hash: string;
  expires_at: string;
  attempts: number;
}

const VERIFICATION_TTL_MS = 10 * 60_000;
const VERIFICATION_RESEND_MS = 60_000;
const VERIFICATION_MAX_ATTEMPTS = 5;

function verificationSecret() {
  return process.env.WHATSAPP_CONTACT_VERIFICATION_SECRET?.trim() || '';
}

export function hashWhatsAppVerificationCode(contactId: number, code: string, secret = verificationSecret()) {
  return createHmac('sha256', secret).update(`${contactId}:${code}`).digest('hex');
}

export function normalizeIndonesianWhatsAppNumber(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Nomor WhatsApp wajib diisi.');
  const digits = value.replace(/\D/g, '');
  const normalized = digits.startsWith('0')
    ? `62${digits.slice(1)}`
    : digits.startsWith('8')
      ? `62${digits}`
      : digits;
  if (!/^62[1-9][0-9]{7,12}$/.test(normalized)) {
    throw new Error('Gunakan nomor WhatsApp Indonesia yang valid, misalnya 081234567890.');
  }
  return normalized;
}

function mapContact(row: WhatsAppContactRow) {
  return {
    id: row.id,
    phoneE164: row.phone_e164,
    label: row.label,
    isDefault: row.is_default,
    orderNotificationsEnabled: row.order_notifications_enabled,
    consentedAt: row.consented_at,
    optedOutAt: row.opted_out_at,
    verifiedAt: row.verified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listWhatsAppContacts(userId: string) {
  const { data, error } = await getSupabaseAdminClient()
    .from('user_whatsapp_contacts')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Nomor WhatsApp belum dapat dimuat: ${error.message}`);
  return ((data || []) as WhatsAppContactRow[]).map(mapContact);
}

export async function createWhatsAppContact(userId: string, body: Record<string, unknown>) {
  if (body.consentConfirmed !== true) {
    throw new Error('Persetujuan notifikasi WhatsApp wajib dikonfirmasi.');
  }
  const phone = normalizeIndonesianWhatsAppNumber(body.phone);
  const label = typeof body.label === 'string' ? body.label.trim().slice(0, 40) : '';
  const supabase = getSupabaseAdminClient();
  const { count, error: countError } = await supabase
    .from('user_whatsapp_contacts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (countError) throw new Error(`Nomor WhatsApp belum dapat diperiksa: ${countError.message}`);
  const makeDefault = count === 0;
  const now = new Date().toISOString();
  const { data, error } = await supabase.from('user_whatsapp_contacts').insert({
    user_id: userId,
    phone_e164: phone,
    label: label || (count === 0 ? 'Utama' : 'Nomor lain'),
    is_default: makeDefault,
    order_notifications_enabled: true,
    consented_at: now,
    opted_out_at: null,
  }).select('*').single();
  if (error) {
    if (error.code === '23505') throw new Error('Nomor WhatsApp tersebut sudah tersimpan.');
    throw new Error(`Nomor WhatsApp belum dapat disimpan: ${error.message}`);
  }
  return mapContact(data as WhatsAppContactRow);
}

export async function updateWhatsAppContact(userId: string, contactId: number, body: Record<string, unknown>) {
  const supabase = getSupabaseAdminClient();
  const { data: existing, error: loadError } = await supabase.from('user_whatsapp_contacts')
    .select('*').eq('id', contactId).eq('user_id', userId).maybeSingle();
  if (loadError) throw new Error(`Nomor WhatsApp belum dapat dimuat: ${loadError.message}`);
  if (!existing) throw new Error('Nomor WhatsApp tidak ditemukan.');
  const row = existing as WhatsAppContactRow;
  const nextPhone = body.phone === undefined ? row.phone_e164 : normalizeIndonesianWhatsAppNumber(body.phone);
  const notificationsEnabled = body.orderNotificationsEnabled === undefined
    ? row.order_notifications_enabled
    : body.orderNotificationsEnabled === true;
  if (notificationsEnabled && !row.order_notifications_enabled && body.consentConfirmed !== true) {
    throw new Error('Persetujuan notifikasi WhatsApp wajib dikonfirmasi.');
  }
  if (body.isDefault === true && !row.is_default) {
    const { error } = await supabase.rpc('set_default_whatsapp_contact', {
      p_user_id: userId,
      p_contact_id: contactId,
    });
    if (error) throw new Error(`Nomor utama belum dapat diperbarui: ${error.message}`);
  }
  const phoneChanged = nextPhone !== row.phone_e164;
  const now = new Date().toISOString();
  const { data, error } = await supabase.from('user_whatsapp_contacts').update({
    phone_e164: nextPhone,
    label: typeof body.label === 'string' ? body.label.trim().slice(0, 40) || row.label : row.label,
    is_default: body.isDefault === true ? true : row.is_default,
    order_notifications_enabled: notificationsEnabled,
    consented_at: notificationsEnabled && (!row.order_notifications_enabled || body.consentConfirmed === true) ? now : row.consented_at,
    opted_out_at: notificationsEnabled ? null : now,
    verified_at: phoneChanged ? null : row.verified_at,
    updated_at: now,
  }).eq('id', contactId).eq('user_id', userId).select('*').single();
  if (error) {
    if (error.code === '23505') throw new Error('Nomor WhatsApp tersebut sudah tersimpan.');
    throw new Error(`Nomor WhatsApp belum dapat diperbarui: ${error.message}`);
  }
  return mapContact(data as WhatsAppContactRow);
}

export async function deleteWhatsAppContact(userId: string, contactId: number) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from('user_whatsapp_contacts').delete()
    .eq('id', contactId).eq('user_id', userId).select('is_default').maybeSingle();
  if (error) throw new Error(`Nomor WhatsApp belum dapat dihapus: ${error.message}`);
  if (!data) throw new Error('Nomor WhatsApp tidak ditemukan.');
}

async function getOwnedContact(userId: string, contactId: number) {
  const { data, error } = await getSupabaseAdminClient().from('user_whatsapp_contacts').select('*')
    .eq('id', contactId).eq('user_id', userId).maybeSingle();
  if (error) throw new Error(`Nomor WhatsApp belum dapat dimuat: ${error.message}`);
  if (!data) throw new Error('Nomor WhatsApp tidak ditemukan.');
  return data as WhatsAppContactRow;
}

export async function requestWhatsAppContactVerification(userId: string, contactId: number) {
  if (!isWhatsAppContactVerificationConfigured()) {
    throw new Error('Verifikasi nomor WhatsApp belum dikonfigurasi lengkap oleh Admin.');
  }
  const contact = await getOwnedContact(userId, contactId);
  if (contact.verified_at) return { alreadyVerified: true, retryAfterSeconds: 0 };
  const supabase = getSupabaseAdminClient();
  const { data: existing, error: loadError } = await supabase.from('whatsapp_contact_verification_challenges')
    .select('next_send_at').eq('contact_id', contactId).maybeSingle();
  if (loadError) throw new Error(`Status verifikasi belum dapat diperiksa: ${loadError.message}`);
  const nowMs = Date.now();
  const nextSendMs = existing?.next_send_at ? Date.parse(String(existing.next_send_at)) : 0;
  if (nextSendMs > nowMs) throw new Error(`Tunggu ${Math.ceil((nextSendMs - nowMs) / 1000)} detik sebelum mengirim ulang kode.`);

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const now = new Date(nowMs).toISOString();
  const { error } = await supabase.from('whatsapp_contact_verification_challenges').upsert({
    contact_id: contactId,
    user_id: userId,
    code_hash: hashWhatsAppVerificationCode(contactId, code),
    expires_at: new Date(nowMs + VERIFICATION_TTL_MS).toISOString(),
    next_send_at: new Date(nowMs + VERIFICATION_RESEND_MS).toISOString(),
    attempts: 0,
    created_at: now,
    updated_at: now,
  }, { onConflict: 'contact_id' });
  if (error) throw new Error(`Kode verifikasi belum dapat disiapkan: ${error.message}`);
  try {
    await sendWhatsAppContactVerificationCode(contact.phone_e164, code);
  } catch (error) {
    await supabase.from('whatsapp_contact_verification_challenges').delete()
      .eq('contact_id', contactId).eq('user_id', userId);
    throw error;
  }
  return { alreadyVerified: false, retryAfterSeconds: VERIFICATION_RESEND_MS / 1000 };
}

export async function confirmWhatsAppContactVerification(userId: string, contactId: number, value: unknown) {
  const code = typeof value === 'string' ? value.trim() : '';
  if (!/^\d{6}$/.test(code)) throw new Error('Masukkan kode verifikasi 6 digit.');
  const contact = await getOwnedContact(userId, contactId);
  if (contact.verified_at) return mapContact(contact);
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from('whatsapp_contact_verification_challenges').select('*')
    .eq('contact_id', contactId).eq('user_id', userId).maybeSingle();
  if (error) throw new Error(`Kode verifikasi belum dapat diperiksa: ${error.message}`);
  if (!data) throw new Error('Minta kode verifikasi terlebih dahulu.');
  const challenge = data as VerificationChallengeRow;
  if (Date.parse(challenge.expires_at) <= Date.now()) throw new Error('Kode verifikasi sudah kedaluwarsa. Minta kode baru.');
  if (challenge.attempts >= VERIFICATION_MAX_ATTEMPTS) throw new Error('Batas percobaan kode tercapai. Minta kode baru.');
  const expected = Buffer.from(challenge.code_hash, 'hex');
  const actual = Buffer.from(hashWhatsAppVerificationCode(contactId, code), 'hex');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    const attempts = challenge.attempts + 1;
    await supabase.from('whatsapp_contact_verification_challenges').update({ attempts, updated_at: new Date().toISOString() })
      .eq('contact_id', contactId).eq('user_id', userId);
    throw new Error(attempts >= VERIFICATION_MAX_ATTEMPTS
      ? 'Kode salah dan batas percobaan tercapai. Minta kode baru.'
      : `Kode salah. Tersisa ${VERIFICATION_MAX_ATTEMPTS - attempts} percobaan.`);
  }
  const verifiedAt = new Date().toISOString();
  const { data: verified, error: updateError } = await supabase.from('user_whatsapp_contacts')
    .update({ verified_at: verifiedAt, updated_at: verifiedAt })
    .eq('id', contactId).eq('user_id', userId).select('*').single();
  if (updateError) throw new Error(`Nomor belum dapat ditandai terverifikasi: ${updateError.message}`);
  await supabase.from('whatsapp_contact_verification_challenges').delete()
    .eq('contact_id', contactId).eq('user_id', userId);
  return mapContact(verified as WhatsAppContactRow);
}

export async function resolveWhatsAppContactForOrder(userId: string, contactId: unknown) {
  if (contactId === undefined || contactId === null || contactId === '') return null;
  const parsedId = Number(contactId);
  if (!Number.isSafeInteger(parsedId) || parsedId <= 0) throw new Error('Nomor WhatsApp yang dipilih tidak valid.');
  const { data, error } = await getSupabaseAdminClient().from('user_whatsapp_contacts').select('*')
    .eq('id', parsedId).eq('user_id', userId).maybeSingle();
  if (error) throw new Error(`Nomor WhatsApp belum dapat diperiksa: ${error.message}`);
  if (!data || !data.order_notifications_enabled || data.opted_out_at || !data.verified_at) {
    throw new Error('Nomor WhatsApp harus aktif dan terverifikasi untuk notifikasi pesanan.');
  }
  return { id: parsedId, phoneE164: String(data.phone_e164) };
}
