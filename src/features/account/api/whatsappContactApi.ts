import { getAuthenticatedHeaders } from '@/utils/authenticatedFetch';
import type { SaveWhatsAppContactInput, WhatsAppContact } from '@/features/account/types/whatsappContact';

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || 'Nomor WhatsApp belum dapat diproses.');
  return data;
}

export async function fetchWhatsAppContacts(signal?: AbortSignal) {
  const data = await parseJson<{ contacts: WhatsAppContact[] }>(await fetch('/api/account/whatsapp-contacts', {
    headers: await getAuthenticatedHeaders(),
    signal,
  }));
  return data.contacts;
}

export async function createWhatsAppContact(input: SaveWhatsAppContactInput, signal?: AbortSignal) {
  const data = await parseJson<{ contact: WhatsAppContact }>(await fetch('/api/account/whatsapp-contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...await getAuthenticatedHeaders() },
    body: JSON.stringify(input),
    signal,
  }));
  return data.contact;
}

export async function updateWhatsAppContact(id: number, input: Partial<SaveWhatsAppContactInput>) {
  const data = await parseJson<{ contact: WhatsAppContact }>(await fetch(`/api/account/whatsapp-contacts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...await getAuthenticatedHeaders() },
    body: JSON.stringify(input),
  }));
  return data.contact;
}

export async function deleteWhatsAppContact(id: number) {
  await parseJson<{ deleted: boolean }>(await fetch(`/api/account/whatsapp-contacts/${id}`, {
    method: 'DELETE',
    headers: await getAuthenticatedHeaders(),
  }));
}
