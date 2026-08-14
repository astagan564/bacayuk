import { Clock3 } from 'lucide-react';
import type { ManualPaymentController } from '@/features/commerce/hooks/useManualPaymentController';

export function ManualPaymentPendingPanel({ controller }: { controller: ManualPaymentController }) {
  return (
    <div className="grid gap-5 pt-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-warning text-white">
        <Clock3 className="h-9 w-9" />
      </div>
      <div>
        <p className="text-xs font-bold text-warning">Menunggu verifikasi admin</p>
        <h3 className="mb-0 mt-1 text-3xl text-balance">Bukti pembayaran sudah diterima.</h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-secondary">
          Akses belum aktif. BacaYuk akan mencocokkan pembayaran dengan dana yang benar-benar masuk.
        </p>
      </div>
      <div className="rounded-xl border border-default bg-surface/50 p-4 text-left text-xs">
        <div className="flex justify-between gap-3 border-b border-default pb-2">
          <span className="text-secondary">Nomor pesanan</span>
          <span className="font-mono font-bold">{controller.order?.orderId}</span>
        </div>
        <div className="flex justify-between gap-3 pt-2">
          <span className="text-secondary">Jumlah</span>
          <span className="font-bold">Rp {controller.order?.amount.toLocaleString('id-ID')}</span>
        </div>
      </div>
      <button type="button" onClick={controller.complete} className="btn-primary w-full px-5 py-3.5 text-sm">
        Kembali ke perpustakaan
      </button>
    </div>
  );
}

