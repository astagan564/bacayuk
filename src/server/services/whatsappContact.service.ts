import { getSupabaseAdminClient } from '../clients/supabaseAdminClient';

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

export async function resolveWhatsAppContactForOrder(userId: string, contactId: unknown) {
  const parsedId = Number(contactId);
  if (!Number.isSafeInteger(parsedId) || parsedId <= 0) throw new Error('Pilih nomor WhatsApp untuk menerima status pesanan.');
  const { data, error } = await getSupabaseAdminClient().from('user_whatsapp_contacts').select('*')
    .eq('id', parsedId).eq('user_id', userId).maybeSingle();
  if (error) throw new Error(`Nomor WhatsApp belum dapat diperiksa: ${error.message}`);
  if (!data || !data.order_notifications_enabled || data.opted_out_at) {
    throw new Error('Nomor WhatsApp tidak aktif untuk notifikasi pesanan.');
  }
  return { id: parsedId, phoneE164: String(data.phone_e164) };
}
