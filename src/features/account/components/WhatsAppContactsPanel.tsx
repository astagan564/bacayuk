import { useCallback, useEffect, useState } from 'react';
import { Check, LoaderCircle, MessageCircle, Pencil, Plus, Star, Trash2, X } from 'lucide-react';
import {
  createWhatsAppContact,
  confirmWhatsAppContactVerification,
  deleteWhatsAppContact,
  fetchWhatsAppContacts,
  requestWhatsAppContactVerification,
  updateWhatsAppContact,
} from '@/features/account/api/whatsappContactApi';
import type { WhatsAppContact } from '@/features/account/types/whatsappContact';

export function WhatsAppContactsPanel() {
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [phone, setPhone] = useState('');
  const [label, setLabel] = useState('');
  const [consent, setConsent] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsWorking(true);
    setError(null);
    try { setContacts(await fetchWhatsAppContacts()); }
    catch (nextError) { setError(nextError instanceof Error ? nextError.message : 'Nomor WhatsApp belum dapat dimuat.'); }
    finally { setIsWorking(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const resetForm = () => { setPhone(''); setLabel(''); setConsent(false); setEditingId(null); };
  const runAction = async (action: () => Promise<unknown>, fallbackMessage: string) => {
    setIsWorking(true);
    setError(null);
    try {
      await action();
      await load();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : fallbackMessage);
      setIsWorking(false);
    }
  };
  const submit = async () => {
    setIsWorking(true); setError(null);
    try {
      if (editingId) {
        await updateWhatsAppContact(editingId, { phone, label });
      } else {
        await createWhatsAppContact({ phone, label, consentConfirmed: consent, orderNotificationsEnabled: true });
      }
      resetForm();
      await load();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Nomor WhatsApp belum dapat disimpan.');
      setIsWorking(false);
    }
  };

  const requestVerification = async (id: number) => {
    setIsWorking(true); setError(null); setVerificationMessage(null);
    try {
      const result = await requestWhatsAppContactVerification(id);
      if (result.alreadyVerified) await load();
      else {
        setVerifyingId(id);
        setVerificationCode('');
        setVerificationMessage('Kode 6 digit telah dikirim. Kode berlaku 10 menit.');
        setIsWorking(false);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Kode verifikasi belum dapat dikirim.');
      setIsWorking(false);
    }
  };

  const confirmVerification = async () => {
    if (!verifyingId) return;
    setIsWorking(true); setError(null);
    try {
      await confirmWhatsAppContactVerification(verifyingId, verificationCode);
      setVerifyingId(null); setVerificationCode(''); setVerificationMessage(null);
      await load();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Kode verifikasi belum dapat diperiksa.');
      setIsWorking(false);
    }
  };

  return (
    <section className="rounded-3xl border-2 border-default bg-surface p-6 shadow-sm" aria-labelledby="whatsapp-contacts-title">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-brand-green p-2.5 text-white"><MessageCircle className="h-5 w-5" /></div>
        <div><h2 id="whatsapp-contacts-title" className="text-lg font-black">Nomor WhatsApp</h2><p className="mt-1 text-sm leading-6 opacity-70">Kelola nomor untuk menerima status transaksi BacaYuk.</p></div>
      </div>

      <div className="mt-5 grid gap-3">
        {contacts.map((contact) => (
          <div key={contact.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-default bg-card p-4">
            <div>
              <div className="flex items-center gap-2"><strong className="text-sm">{contact.label}</strong>{contact.isDefault && <span className="rounded-full bg-brand-gold/20 px-2 py-0.5 text-[10px] font-bold text-warning">Utama</span>}</div>
              <p className="mt-1 font-mono text-xs">+{contact.phoneE164}</p>
              <p className={`mt-1 text-[10px] font-semibold ${contact.verifiedAt ? 'text-success' : 'text-warning'}`}>{contact.verifiedAt ? 'Terverifikasi' : 'Belum diverifikasi'}</p>
            </div>
            <div className="flex gap-1.5">
              {!contact.verifiedAt && <button type="button" disabled={isWorking} onClick={() => void requestVerification(contact.id)} className="rounded-lg border border-brand-green/40 px-3 py-2 text-[10px] font-bold text-brand-green">Kirim kode</button>}
              {!contact.isDefault && <button type="button" title="Jadikan utama" disabled={isWorking} onClick={() => void runAction(() => updateWhatsAppContact(contact.id, { isDefault: true }), 'Gagal memperbarui nomor utama.')} className="rounded-lg border border-default p-2"><Star className="h-4 w-4" /></button>}
              <button type="button" title="Ubah nomor" disabled={isWorking} onClick={() => { setEditingId(contact.id); setPhone(contact.phoneE164); setLabel(contact.label); setConsent(true); }} className="rounded-lg border border-default p-2"><Pencil className="h-4 w-4" /></button>
              <button type="button" title="Hapus nomor" disabled={isWorking} onClick={() => { if (window.confirm(`Hapus nomor +${contact.phoneE164}?`)) void runAction(() => deleteWhatsAppContact(contact.id), 'Gagal menghapus nomor.'); }} className="rounded-lg border border-error/30 p-2 text-error"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {verifyingId && <div className="mt-4 grid gap-3 rounded-2xl border border-brand-green/30 bg-brand-green/5 p-4">
        <h3 className="text-sm font-extrabold">Verifikasi nomor WhatsApp</h3>
        {verificationMessage && <p className="text-xs leading-5">{verificationMessage}</p>}
        <label className="grid max-w-xs gap-1 text-xs font-bold">Kode verifikasi<input value={verificationCode} inputMode="numeric" autoComplete="one-time-code" maxLength={6} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="reader-field rounded-xl px-3 py-2.5 font-mono text-sm tracking-[0.3em]" /></label>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={isWorking || verificationCode.length !== 6} onClick={() => void confirmVerification()} className="btn-primary px-4 py-2.5 text-xs disabled:opacity-50">Verifikasi</button>
          <button type="button" disabled={isWorking} onClick={() => void requestVerification(verifyingId)} className="btn-secondary px-4 py-2.5 text-xs">Kirim ulang</button>
          <button type="button" disabled={isWorking} onClick={() => { setVerifyingId(null); setVerificationCode(''); setVerificationMessage(null); }} className="btn-secondary px-4 py-2.5 text-xs">Batal</button>
        </div>
      </div>}

      <div className="mt-5 grid gap-3 rounded-2xl border border-default bg-card p-4">
        <h3 className="text-sm font-extrabold">{editingId ? 'Ubah nomor WhatsApp' : 'Tambah nomor WhatsApp'}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-xs font-bold">Label<input value={label} maxLength={40} onChange={(e) => setLabel(e.target.value)} placeholder="Contoh: Ayah" className="reader-field rounded-xl px-3 py-2.5 text-sm" /></label>
          <label className="grid gap-1 text-xs font-bold">Nomor WhatsApp<input value={phone} inputMode="tel" onChange={(e) => setPhone(e.target.value)} placeholder="081234567890" className="reader-field rounded-xl px-3 py-2.5 text-sm" /></label>
        </div>
        {!editingId && <label className="flex items-start gap-2 text-xs leading-5"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" /><span>Saya setuju menerima status pesanan BacaYuk melalui WhatsApp dan dapat menghapus nomor ini kapan saja.</span></label>}
        {error && <div role="alert" className="rounded-xl bg-error/10 px-3 py-2 text-xs font-semibold text-error">{error}</div>}
        <div className="flex gap-2">
          <button type="button" onClick={() => void submit()} disabled={isWorking || !phone.trim() || (!editingId && !consent)} className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-xs disabled:opacity-50">{isWorking ? <LoaderCircle className="h-4 w-4 animate-spin" /> : editingId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{editingId ? 'Simpan perubahan' : 'Tambah nomor'}</button>
          {editingId && <button type="button" onClick={resetForm} disabled={isWorking} className="btn-secondary inline-flex items-center gap-2 px-4 py-2.5 text-xs"><X className="h-4 w-4" /> Batal</button>}
        </div>
      </div>
    </section>
  );
}
