import { Building2, CheckCircle2, QrCode, ShieldCheck, Tag } from 'lucide-react';
import { PaymentTypeSelector } from '@/features/commerce/components/payment/PaymentTypeSelector';
import type { ManualPaymentController } from '@/features/commerce/hooks/useManualPaymentController';

export function ManualPaymentCheckoutPanel({ controller }: { controller: ManualPaymentController }) {
  return (
    <div className="grid gap-5 pt-5">
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

      <div className="rounded-xl border border-brand-green/25 bg-brand-green/10 p-4 text-xs leading-6 text-secondary">
        <div className="mb-1 flex items-center gap-2 font-extrabold text-brand-green">
          <ShieldCheck className="w-4 h-4" />
          <span>Pembayaran langsung ke BacaYuk</span>
        </div>
        QRIS dan transfer bank diverifikasi admin berdasarkan dana yang benar-benar masuk.
      </div>

      <button
        type="button"
        onClick={controller.startOrder}
        disabled={controller.isProcessing || controller.isApplyingCoupon}
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
