import { Lock, X } from 'lucide-react';
import type { PaymentGatewayModalProps } from '@/features/commerce/types/paymentGateway';
import { usePaymentGatewayController } from '@/features/commerce/hooks/usePaymentGatewayController';
import { PaymentCheckoutPanel } from '@/features/commerce/components/payment/PaymentCheckoutPanel';
import { PaymentSuccessPanel } from '@/features/commerce/components/payment/PaymentSuccessPanel';

export function PaymentGatewayModal({
  story,
  onClose,
  onPaymentSuccess,
  isVipOnly = false,
}: PaymentGatewayModalProps) {
  const controller = usePaymentGatewayController({
    story,
    isVipOnly,
    onPaymentSuccess,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl rounded-2xl p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto app-modal">
        <div className="flex items-start justify-between gap-4 border-b border-default pb-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-brand-green p-2.5 text-white">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-secondary">Pembayaran aman</p>
              <h2 className="mb-0 text-2xl leading-tight text-balance">
                {isVipOnly ? 'Aktifkan langganan keluarga' : 'Buka unduhan offline'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-secondary transition-colors hover:bg-surface"
            aria-label="Tutup pembayaran"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {controller.isSuccess
          ? <PaymentSuccessPanel controller={controller} />
          : <PaymentCheckoutPanel controller={controller} />}
      </div>
    </div>
  );
}
