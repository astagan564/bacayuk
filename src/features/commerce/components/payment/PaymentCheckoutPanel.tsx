import { CheckCircle2, ShieldCheck, Tag } from 'lucide-react';
import type { PaymentGatewayController } from '@/features/commerce/hooks/usePaymentGatewayController';
import { PaymentTypeSelector } from '@/features/commerce/components/payment/PaymentTypeSelector';

interface PaymentCheckoutPanelProps {
  controller: PaymentGatewayController;
}

export function PaymentCheckoutPanel({ controller }: PaymentCheckoutPanelProps) {
  return (
    <div className="grid gap-5 pt-5">
      <PaymentTypeSelector controller={controller} />

      <div className="rounded-xl border-default bg-surface/50 p-4 border">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-secondary">Ringkasan</p>
            <h3 className="mb-1 mt-1 text-base font-extrabold font-sans">
              {controller.purchaseType === 'vip'
                ? 'Langganan keluarga 1 bulan'
                : controller.story?.title}
            </h3>
            <p className="text-xs text-secondary">File akan diberi stempel nama dan email pembeli.</p>
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
          Nama pembeli
          <input
            type="text"
            value={controller.customerName}
            disabled={controller.isProcessing}
            onChange={(event) => controller.setCustomerName(event.target.value)}
            placeholder="Budi Santoso"
            autoComplete="name"
            className="rounded-xl px-3 py-2.5 text-sm font-semibold reader-field disabled:opacity-60"
          />
        </label>
        <label className="grid gap-1.5 text-xs font-bold text-secondary">
          Email bukti pembayaran
          <input
            type="email"
            value={controller.customerEmail}
            disabled={controller.isProcessing}
            onChange={(event) => controller.setCustomerEmail(event.target.value)}
            placeholder="orangtua@email.com"
            autoComplete="email"
            className="rounded-xl px-3 py-2.5 text-sm font-semibold reader-field disabled:opacity-60"
          />
        </label>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-brand-gold" />
          <input
            type="text"
            value={controller.couponInput}
            disabled={controller.isProcessing}
            onChange={(event) => controller.setCouponInput(event.target.value)}
            placeholder="Kode kupon"
            aria-label="Kode kupon"
            className="min-w-0 flex-1 rounded-xl px-3 py-2.5 text-xs font-bold uppercase reader-field disabled:opacity-60"
          />
          <button
            type="button"
            onClick={controller.applyCoupon}
            disabled={controller.isProcessing}
            className="btn-secondary px-3 py-2.5 text-xs disabled:opacity-60"
          >
            Pasang
          </button>
        </div>
        {controller.couponMessage && (
          <p className="text-xs font-semibold text-secondary">{controller.couponMessage}</p>
        )}
      </div>

      {controller.errorMessage && (
        <div role="alert" className="rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-xs font-semibold text-error">
          {controller.errorMessage}
        </div>
      )}

      <div className="rounded-xl border border-brand-green/25 bg-brand-green/10 p-4 text-xs leading-6 text-secondary">
        <div className="mb-1 flex items-center gap-2 font-extrabold text-brand-green">
          <ShieldCheck className="w-4 h-4" />
          <span>Pembayaran diverifikasi di server</span>
        </div>
        Setelah pembayaran selesai, BacaYuk mengecek status transaksi sebelum membuka akses unduhan.
      </div>

      <button
        type="button"
        onClick={controller.startPayment}
        disabled={controller.isProcessing}
        className="btn-primary flex w-full items-center justify-center gap-2 px-5 py-3.5 text-sm disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {controller.isProcessing ? (
          <>
            <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            <span>Memeriksa pembayaran</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5" />
            <span>Bayar Rp {controller.finalPrice.toLocaleString('id-ID')}</span>
          </>
        )}
      </button>
    </div>
  );
}
