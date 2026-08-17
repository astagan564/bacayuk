import { ArrowLeft, Building2, CheckCircle2, QrCode, ShieldCheck, Tag } from 'lucide-react';
import { PaymentTypeSelector } from '@/features/commerce/components/payment/PaymentTypeSelector';
import type { ManualPaymentController } from '@/features/commerce/hooks/useManualPaymentController';

export function ManualPaymentCheckoutPanel({ controller }: { controller: ManualPaymentController }) {
  return (
    <div className="grid gap-4 pt-5">
      <StepIndicator currentStep={controller.checkoutStep} />

      {controller.checkoutStep === 1 && <Step1SelectionPanel controller={controller} />}
      {controller.checkoutStep === 2 && <Step2DetailsPanel controller={controller} />}
      {controller.checkoutStep === 3 && <Step3PaymentPanel controller={controller} />}
    </div>
  );
}

function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <div className="flex justify-center gap-1.5" role="group" aria-label="Langkah pembayaran">
      <span
        className={`h-1.5 rounded-full transition-all duration-300 ${currentStep === 1 ? 'w-4 bg-brand-green' : 'w-1.5 bg-secondary/40'}`}
        aria-label={`Langkah 1${currentStep === 1 ? ' (aktif)' : ''}`}
      />
      <span
        className={`h-1.5 rounded-full transition-all duration-300 ${currentStep === 2 ? 'w-4 bg-brand-green' : 'w-1.5 bg-secondary/40'}`}
        aria-label={`Langkah 2${currentStep === 2 ? ' (aktif)' : ''}`}
      />
      <span
        className={`h-1.5 rounded-full transition-all duration-300 ${currentStep === 3 ? 'w-4 bg-brand-green' : 'w-1.5 bg-secondary/40'}`}
        aria-label={`Langkah 3${currentStep === 3 ? ' (aktif)' : ''}`}
      />
    </div>
  );
}

function Step1SelectionPanel({ controller }: { controller: ManualPaymentController }) {
  return (
    <div className="animate-step-back grid gap-5" key="step-1">
      <PaymentTypeSelector controller={controller} />

      <div className="rounded-xl border border-default bg-surface/50 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-secondary">Ringkasan pesanan</p>
            <h3 className="mb-1 mt-1 text-base font-extrabold font-sans">
              {controller.purchaseType === 'vip'
                ? 'Langganan keluarga 1 bulan'
                : controller.story?.title}
            </h3>
            <p className="text-xs text-secondary">
              {controller.purchaseType === 'vip'
                ? 'Akses unduh semua buku selama masa VIP.'
                : 'PDF/EPUB dilengkapi stempel identitas pembeli.'}
            </p>
          </div>
          <div className="text-right">
            {controller.appliedDiscount > 0 && (
              <p className="text-xs text-secondary line-through">
                Rp {controller.priceBeforeDiscount.toLocaleString('id-ID')}
              </p>
            )}
            <p className="text-2xl font-extrabold tabular-nums">
              Rp {controller.finalPrice.toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-brand-gold" />
          <input
            type="text"
            value={controller.couponInput}
            disabled={controller.isProcessing || controller.isApplyingCoupon}
            onChange={(event) => controller.setCouponInput(event.target.value)}
            placeholder="Kode kupon"
            aria-label="Kode kupon"
            className="min-w-0 flex-1 rounded-xl px-3 py-2.5 text-xs font-bold uppercase reader-field disabled:opacity-60"
          />
          <button
            type="button"
            onClick={controller.applyCoupon}
            disabled={controller.isProcessing || controller.isApplyingCoupon}
            className="btn-secondary px-3 py-2.5 text-xs disabled:opacity-60"
          >
            {controller.isApplyingCoupon ? 'Memeriksa…' : 'Pasang'}
          </button>
        </div>
        {controller.couponMessage && <p className="text-xs font-semibold text-secondary">{controller.couponMessage}</p>}
      </div>

      {controller.errorMessage && (
        <div role="alert" className="rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-xs font-semibold text-error">
          {controller.errorMessage}
        </div>
      )}

      <button
        type="button"
        onClick={controller.goToStep2}
        disabled={controller.isProcessing || controller.isApplyingCoupon}
        className="btn-primary flex w-full items-center justify-center gap-2 px-5 py-3.5 text-sm disabled:opacity-60"
      >
        Lanjut ke detail pembayaran
      </button>
    </div>
  );
}

function Step2DetailsPanel({ controller }: { controller: ManualPaymentController }) {
  return (
    <div className="animate-step-forward grid min-w-0 gap-5 overflow-hidden" key="step-2">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <button
          type="button"
          onClick={controller.goToStep1}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-secondary hover:bg-surface transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
        <div className="text-right">
          <p className="text-xs text-secondary">Total</p>
          <p className="text-lg font-extrabold tabular-nums">
            Rp {controller.finalPrice.toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-bold text-secondary">
          Nama akun pembeli
          <input value={controller.customerName} readOnly disabled className="rounded-xl px-3 py-2.5 text-sm font-semibold reader-field opacity-75" />
        </label>
        <label className="grid gap-1.5 text-xs font-bold text-secondary">
          Email akun pembeli
          <input value={controller.customerEmail} readOnly disabled className="rounded-xl px-3 py-2.5 text-sm font-semibold reader-field opacity-75" />
        </label>
      </div>

      <div className="grid gap-3 overflow-hidden rounded-xl border border-brand-green/25 bg-brand-green/10 p-4" role="group" aria-label="WhatsApp untuk status pesanan">
        <p className="text-xs font-extrabold text-brand-green">WhatsApp untuk status pesanan</p>
        {controller.whatsappContacts.length > 0 && (
          <label className="grid min-w-0 gap-1.5 text-xs font-bold text-secondary">
            Pilih nomor tersimpan
            <select
              value={controller.selectedWhatsAppContactId || ''}
              disabled={controller.isProcessing || controller.isLoadingWhatsAppContacts}
              onChange={(event) => controller.setSelectedWhatsAppContactId(event.target.value ? Number(event.target.value) : null)}
              className="w-full reader-field rounded-xl px-3 py-2.5 text-sm"
            >
              {controller.whatsappContacts.filter((contact) => contact.orderNotificationsEnabled).map((contact) => (
                <option key={contact.id} value={contact.id}>{contact.label} · +{contact.phoneE164}{contact.isDefault ? ' (utama)' : ''}{contact.verifiedAt ? '' : ' · belum diverifikasi'}</option>
              ))}
              <option value="">+ Tambah nomor baru</option>
            </select>
          </label>
        )}
        {!controller.selectedWhatsAppContactId && (
          <>
            <label className="grid gap-1.5 text-xs font-bold text-secondary">
              Nomor WhatsApp
              <input
                value={controller.newWhatsAppNumber}
                inputMode="tel"
                autoComplete="tel"
                disabled={controller.isProcessing}
                onChange={(event) => controller.setNewWhatsAppNumber(event.target.value)}
                placeholder="081234567890"
                className="reader-field rounded-xl px-3 py-2.5 text-sm"
              />
            </label>
            <label className="flex items-start gap-2 text-xs leading-5 text-secondary">
              <input type="checkbox" checked={controller.whatsappConsent} disabled={controller.isProcessing} onChange={(event) => controller.setWhatsappConsent(event.target.checked)} className="mt-1 shrink-0" />
              <span>Saya setuju menerima status pesanan BacaYuk melalui WhatsApp. Nomor ini akan tersimpan dan dapat diubah atau dihapus melalui Pengaturan Orang Tua.</span>
            </label>
          </>
        )}
        {controller.pendingWhatsAppVerificationId && <div className="grid gap-2 rounded-xl border border-brand-green/30 bg-surface p-3">
          <label className="grid gap-1 text-xs font-bold text-secondary">Kode verifikasi 6 digit
            <input value={controller.whatsappVerificationCode} inputMode="numeric" autoComplete="one-time-code" maxLength={6} onChange={(event) => controller.setWhatsappVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="reader-field rounded-xl px-3 py-2.5 font-mono text-sm tracking-[0.3em]" />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={controller.isProcessing || controller.whatsappVerificationCode.length !== 6} onClick={controller.confirmWhatsAppVerification} className="btn-primary px-3 py-2 text-xs disabled:opacity-50">Verifikasi nomor</button>
            <button type="button" disabled={controller.isProcessing} onClick={controller.resendWhatsAppVerification} className="btn-secondary px-3 py-2 text-xs">Kirim ulang</button>
          </div>
        </div>}
        <p className="text-[10px] leading-5 text-secondary">Nomor harus diverifikasi melalui kode WhatsApp sebelum pesanan dibuat.</p>
      </div>

      {controller.errorMessage && (
        <div role="alert" className="rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-xs font-semibold text-error">
          {controller.errorMessage}
        </div>
      )}

      <button
        type="button"
        onClick={controller.goToStep3}
        disabled={controller.isProcessing || controller.isLoadingWhatsAppContacts}
        className="btn-primary flex w-full items-center justify-center gap-2 px-5 py-3.5 text-sm disabled:opacity-60"
      >
        Lanjut pilih metode pembayaran
      </button>
    </div>
  );
}

function Step3PaymentPanel({ controller }: { controller: ManualPaymentController }) {
  return (
    <div className="animate-step-forward grid min-w-0 gap-5 overflow-hidden" key="step-3">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <button
          type="button"
          onClick={controller.goToStep2}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-secondary hover:bg-surface transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
        <div className="text-right">
          <p className="text-xs text-secondary">Total</p>
          <p className="text-lg font-extrabold tabular-nums">
            Rp {controller.finalPrice.toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      <fieldset className="grid gap-3">
        <legend className="mb-1 text-xs font-extrabold text-secondary">Pilih metode pembayaran</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => controller.setPaymentMethod('manual_qris')}
            aria-pressed={controller.paymentMethod === 'manual_qris'}
            className={`rounded-xl border p-4 text-left ${controller.paymentMethod === 'manual_qris' ? 'border-brand-blue bg-brand-blue/10' : 'border-default bg-surface'}`}
          >
            <QrCode className="mb-2 h-5 w-5 text-brand-blue" />
            <p className="text-sm font-extrabold">QRIS</p>
            <p className="mt-1 text-[11px] leading-5 text-secondary">Bayar lewat QRIS lalu kirim bukti untuk diperiksa admin.</p>
          </button>
          <button
            type="button"
            onClick={() => controller.setPaymentMethod('manual_bank_transfer')}
            aria-pressed={controller.paymentMethod === 'manual_bank_transfer'}
            className={`rounded-xl border p-4 text-left ${controller.paymentMethod === 'manual_bank_transfer' ? 'border-brand-green bg-brand-green/10' : 'border-default bg-surface'}`}
          >
            <Building2 className="mb-2 h-5 w-5 text-brand-green" />
            <p className="text-sm font-extrabold">Transfer bank</p>
            <p className="mt-1 text-[11px] leading-5 text-secondary">Kirim bukti lalu pembayaran diperiksa admin.</p>
          </button>
        </div>
      </fieldset>

      <div className="rounded-xl border border-brand-green/25 bg-brand-green/10 p-4 text-xs leading-6 text-secondary">
        <div className="mb-1 flex items-center gap-2 font-extrabold text-brand-green">
          <ShieldCheck className="w-4 h-4" />
          <span>Pembayaran langsung ke BacaYuk</span>
        </div>
        QRIS dan transfer bank diverifikasi admin berdasarkan dana yang benar-benar masuk.
      </div>

      {controller.errorMessage && (
        <div role="alert" className="rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-xs font-semibold text-error">
          {controller.errorMessage}
        </div>
      )}

      <button
        type="button"
        onClick={controller.startOrder}
        disabled={controller.isProcessing || controller.isApplyingCoupon || controller.isLoadingWhatsAppContacts}
        className="btn-primary flex w-full items-center justify-center gap-2 px-5 py-3.5 text-sm disabled:opacity-60"
      >
        {controller.isProcessing ? (
          <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /><span>Membuat pesanan…</span></>
        ) : (
          <><CheckCircle2 className="w-5 h-5" /><span>Lanjut ke pembayaran</span></>
        )}
      </button>
    </div>
  );
}
