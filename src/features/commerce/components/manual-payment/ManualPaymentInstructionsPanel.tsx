import { Building2, CheckCircle2, Clock3, QrCode, RefreshCw, Upload } from 'lucide-react';
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

  if (order.status === 'paid') {
    return (
      <div className="grid gap-5 pt-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-green text-white">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <div>
          <p className="text-xs font-bold text-brand-green">Pembayaran terkonfirmasi</p>
          <h3 className="mb-0 mt-1 text-3xl text-balance">Akses BacaYuk sudah aktif.</h3>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-secondary">
            DANA telah mengonfirmasi pembayaran pesanan {order.orderId}.
          </p>
        </div>
        <button type="button" onClick={controller.complete} className="btn-primary w-full px-5 py-3.5 text-sm">
          Selesai
        </button>
      </div>
    );
  }

  if (order.status === 'expired' || order.status === 'failed' || order.status === 'cancelled') {
    return (
      <div className="grid gap-5 pt-6 text-center">
        <Clock3 className="mx-auto h-12 w-12 text-error" />
        <div>
          <h3 className="mb-0 text-2xl">QRIS tidak lagi berlaku.</h3>
          <p className="mt-2 text-sm text-secondary">Tutup pembayaran lalu buat pesanan baru untuk memperoleh QRIS baru.</p>
        </div>
      </div>
    );
  }

  const qrisSelected = controller.paymentMethod === 'dana_qris'
    || controller.paymentMethod === 'manual_qris';

  return (
    <div className="grid gap-5 pt-5">
      <div className="rounded-xl border border-brand-gold/35 bg-brand-gold/10 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold text-secondary">Nomor pesanan</p>
            <p className="mt-1 font-mono text-sm font-extrabold">{order.orderId}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold text-secondary">Bayar tepat sejumlah</p>
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
            onClick={() => controller.setPaymentMethod(order.provider === 'dana' ? 'dana_qris' : 'manual_qris')}
            aria-pressed={qrisSelected}
            className={`rounded-xl border p-4 text-left ${qrisSelected ? 'border-brand-blue bg-brand-blue/10' : 'border-default bg-surface'}`}
          >
            <QrCode className="mb-2 h-5 w-5 text-brand-blue" />
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand-blue">QRIS</p>
            <p className="text-sm font-extrabold">
              {instructions.qrisAmountMode === 'manual' ? 'QRIS isi nominal' : `QRIS Rp ${order.amount.toLocaleString('id-ID')}`}
            </p>
            <img
              src={instructions.qrisImageUrl}
              alt={`QRIS BacaYuk senilai Rp ${order.amount.toLocaleString('id-ID')}`}
              className="mx-auto mt-3 max-h-64 rounded-lg bg-white p-2"
            />
            <p className="mt-2 text-[11px] font-semibold text-secondary">
              {instructions.qrisAutomaticVerification
                ? 'Nominal sudah terpasang dan pembayaran akan dikonfirmasi otomatis.'
                : instructions.qrisAmountMode === 'manual'
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
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand-green">Transfer bank</p>
            <p className="mt-2 text-xs font-bold">{instructions.bankTransfer.bankName}</p>
            <p className="font-mono text-base font-extrabold tracking-wide">{instructions.bankTransfer.accountNumber}</p>
            <p className="text-xs text-secondary">a.n. {instructions.bankTransfer.accountHolder}</p>
          </button>
        )}
      </div>

      {!instructions.qrisAutomaticVerification && (
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
      )}

      {controller.errorMessage && (
        <div role="alert" className="rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-xs font-semibold text-error">
          {controller.errorMessage}
        </div>
      )}

      {instructions.qrisAutomaticVerification ? (
        <button
          type="button"
          onClick={() => controller.refreshOrder()}
          disabled={controller.isProcessing}
          className="btn-primary flex w-full items-center justify-center gap-2 px-5 py-3.5 text-sm disabled:opacity-60"
        >
          <RefreshCw className={`h-5 w-5 ${controller.isProcessing ? 'animate-spin' : ''}`} />
          <span>{controller.isProcessing ? 'Memeriksa pembayaran…' : 'Saya sudah bayar — cek status'}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={controller.submitProof}
          disabled={controller.isProcessing}
          className="btn-primary flex w-full items-center justify-center gap-2 px-5 py-3.5 text-sm disabled:opacity-60"
        >
          {controller.isProcessing ? (
            <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /><span>Mengirim bukti…</span></>
          ) : (
            <><Upload className="h-5 w-5" /><span>Kirim bukti untuk diverifikasi</span></>
          )}
        </button>
      )}

      <p className="text-center text-[11px] leading-5 text-secondary">
        {instructions.qrisAutomaticVerification
          ? 'Tidak perlu mengunggah bukti. Halaman ini memeriksa konfirmasi pembayaran DANA secara otomatis.'
          : 'Bukti hanya membantu pencocokan. Admin tetap memeriksa mutasi rekening sebelum membuka akses.'}
      </p>
    </div>
  );
}
