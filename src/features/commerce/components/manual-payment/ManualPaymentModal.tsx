import { HandCoins, X } from 'lucide-react';
import { useManualPaymentController } from '@/features/commerce/hooks/useManualPaymentController';
import { ManualPaymentCheckoutPanel } from './ManualPaymentCheckoutPanel';
import { ManualPaymentInstructionsPanel } from './ManualPaymentInstructionsPanel';
import { ManualPaymentPendingPanel } from './ManualPaymentPendingPanel';
import type { ManualPaymentModalProps } from '@/features/commerce/types/manualPayment';

export function ManualPaymentModal(props: ManualPaymentModalProps) {
  const controller = useManualPaymentController(props);
  const isPendingReview = controller.order?.status === 'pending_review';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4 backdrop-blur-sm animate-fade-in">
      <div className="app-modal max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4 border-b border-default pb-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-brand-green p-2.5 text-white"><HandCoins className="h-5 w-5" /></div>
            <div>
              <p className="text-[11px] font-bold text-secondary">Pembayaran langsung ke BacaYuk</p>
              <h2 className="mb-0 text-2xl leading-tight text-balance">
                {(props.initialOrder?.purchaseType === 'vip' || props.isVipOnly)
                  ? 'Aktifkan VIP keluarga'
                  : 'Beli buku untuk unduhan offline'}
              </h2>
            </div>
          </div>
          <button type="button" onClick={props.onClose} className="rounded-xl p-2 text-secondary hover:bg-surface" aria-label="Tutup pembayaran">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isPendingReview
          ? <ManualPaymentPendingPanel controller={controller} />
          : controller.order
            ? <ManualPaymentInstructionsPanel controller={controller} />
            : <ManualPaymentCheckoutPanel controller={controller} />}
      </div>
    </div>
  );
}
