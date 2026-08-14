import { Building2, Clock3, QrCode, Upload } from 'lucide-react';
import type { ManualPaymentController } from '@/features/commerce/hooks/useManualPaymentController';

function formatExpiry(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function ManualPaymentInstructionsPanel({ controller }: { controller: ManualPaymentController }) {
  const order = controller.order;
  const instructions = controller.instructions;
  if (!order || !instructions) return null;

  return (
    <div className="grid gap-5 pt-5">
      <div className="rounded-xl border border-brand-gold/35 bg-brand-gold/10 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold text-secondary">Nomor pesanan</p>
            <p className="mt-1 font-mono text-sm font-extrabold">{order.orderId}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold text-secondary">Transfer tepat sejumlah</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums">Rp {order.amount.toLocaleString('id-ID')}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 border-t border-brand-gold/20 pt-3 text-xs font-semibold text-secondary">
          <Clock3 className="h-4 w-4" />
          <span>Berlaku sampai {formatExpiry(order.expiresAt)}</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {instructions.qrisImageUrl && (
          <button
            type="button"
            onClick={() => controller.setPaymentMethod('manual_qris')}
            aria-pressed={controller.paymentMethod === 'manual_qris'}
            className={`rounded-xl border p-4 text-left ${controller.paymentMethod === 'manual_qris' ? 'border-brand-blue bg-brand-blue/10' : 'border-default bg-surface'}`}
          >
            <QrCode className="mb-2 h-5 w-5 text-brand-blue" />
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand-blue">Pilihan pertama</p>
            <p className="text-sm font-extrabold">
              {instructions.qrisAmountMode === 'manual' ? 'QRIS isi nominal' : `QRIS Rp ${order.amount.toLocaleString('id-ID')}`}
            </p>
            <img
              src={instructions.qrisImageUrl}
              alt={`QRIS BacaYuk senilai Rp ${order.amount.toLocaleString('id-ID')}`}
              className="mx-auto mt-3 max-h-52 rounded-lg bg-white p-2"
            />
            <p className="mt-2 text-[11px] font-semibold text-secondary">
              {instructions.qrisAmountMode === 'manual'
                ? <>Masukkan nominal tepat <strong>Rp {order.amount.toLocaleString('id-ID')}</strong> di aplikasi pembayaran.</>
                : 'Nominal sudah terpasang. Jangan ubah jumlah pembayaran.'}
            </p>
          </button>
        )}

        {instructions.bankTransfer && (
          <button
            type="button"
            onClick={() => controller.setPaymentMethod('manual_bank_transfer')}
            aria-pressed={controller.paymentMethod === 'manual_bank_transfer'}
            className={`rounded-xl border p-4 text-left ${controller.paymentMethod === 'manual_bank_transfer' ? 'border-brand-green bg-brand-green/10' : 'border-default bg-surface'}`}
          >
            <Building2 className="mb-2 h-5 w-5 text-brand-green" />
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand-green">Pilihan kedua</p>
            <p className="text-sm font-extrabold">Transfer bank</p>
            <p className="mt-2 text-xs font-bold">{instructions.bankTransfer.bankName}</p>
            <p className="font-mono text-base font-extrabold tracking-wide">{instructions.bankTransfer.accountNumber}</p>
            <p className="text-xs text-secondary">a.n. {instructions.bankTransfer.accountHolder}</p>
          </button>
        )}
      </div>

      <div className="grid gap-3 rounded-xl border border-default bg-surface/50 p-4">
        {order.status === 'rejected' && order.reviewNote && (
          <div role="alert" className="rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-xs font-semibold text-error">
            Bukti sebelumnya ditolak: {order.reviewNote}. Silakan kirim bukti yang benar.
          </div>
        )}
        <label className="grid gap-1.5 text-xs font-bold text-secondary">
          Bukti pembayaran (JPG, PNG, atau WebP; maksimal 1,5 MB)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={controller.isProcessing}
            onChange={(event) => controller.setProofFile(event.target.files?.[0] || null)}
            className="rounded-xl px-3 py-2.5 text-xs reader-field file:mr-3 file:rounded-lg file:border-0 file:bg-brand-green file:px-3 file:py-2 file:font-bold file:text-white"
          />
        </label>
        <label className="grid gap-1.5 text-xs font-bold text-secondary">
          Catatan opsional
          <input
            value={controller.payerNote}
            maxLength={240}
            disabled={controller.isProcessing}
            onChange={(event) => controller.setPayerNote(event.target.value)}
            placeholder="Contoh: transfer dari rekening atas nama Budi"
            className="rounded-xl px-3 py-2.5 text-sm reader-field"
          />
        </label>
      </div>

      {controller.errorMessage && (
        <div role="alert" className="rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-xs font-semibold text-error">
          {controller.errorMessage}
        </div>
      )}

      <button
        type="button"
        onClick={controller.submitProof}
        disabled={controller.isProcessing}
        className="btn-primary flex w-full items-center justify-center gap-2 px-5 py-3.5 text-sm disabled:opacity-60"
      >
        {controller.isProcessing ? (
          <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /><span>Mengirim bukti…</span></>
        ) : (
          <><Upload className="h-5 w-5" /><span>Kirim bukti untuk diverifikasi</span></>
        )}
      </button>

      <p className="text-center text-[11px] leading-5 text-secondary">
        Bukti hanya membantu pencocokan. Admin tetap memeriksa mutasi rekening atau aplikasi merchant sebelum membuka akses.
      </p>
    </div>
  );
}
