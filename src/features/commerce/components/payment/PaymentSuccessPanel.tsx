import { CheckCircle2, Download, Sparkles } from 'lucide-react';
import type { PaymentGatewayController } from '@/features/commerce/hooks/usePaymentGatewayController';

interface PaymentSuccessPanelProps {
  controller: PaymentGatewayController;
}

export function PaymentSuccessPanel({ controller }: PaymentSuccessPanelProps) {
  const isVipPurchase = controller.currentReceipt?.storyId === 'vip_sub';

  return (
    <div className="grid gap-5 pt-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success text-white">
        <CheckCircle2 className="w-9 h-9" />
      </div>
      <div>
        <p className="text-xs font-bold text-success">Pembayaran terverifikasi</p>
        <h3 className="mb-0 mt-1 text-3xl text-balance">Akses sudah aktif.</h3>
      </div>

      <div className="rounded-xl border-default bg-surface/50 p-4 text-left text-xs border">
        <div className="grid gap-2">
          <div className="flex justify-between gap-3 border-b border-default pb-2">
            <span className="text-secondary">ID transaksi</span>
            <span className="font-mono font-bold">#{controller.currentReceipt?.transactionId}</span>
          </div>
          <div className="flex justify-between gap-3 border-b border-default pb-2">
            <span className="text-secondary">Nama</span>
            <span className="font-bold">{controller.currentReceipt?.customerName}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-secondary">Email</span>
            <span className="font-bold">{controller.currentReceipt?.customerEmail}</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={controller.completePayment}
        className="btn-primary flex w-full items-center justify-center gap-2 px-5 py-3.5 text-sm"
      >
        {isVipPurchase ? <Sparkles className="w-5 h-5" /> : <Download className="w-5 h-5" />}
        <span>{isVipPurchase ? 'Mulai gunakan langganan' : 'Buka menu unduh'}</span>
      </button>
    </div>
  );
}
