import { OfflineDownloadModal } from '@/components/OfflineDownloadModal';
import { ParentalGateModal } from '@/components/ParentalGateModal';
import { VipOfferModal } from '@/components/VipOfferModal';
import { PaymentGatewayModal } from '@/features/commerce/components/payment/PaymentGatewayModal';
import type { PurchaseFlowController } from '@/features/commerce/hooks/usePurchaseFlowController';

interface PurchaseFlowModalsProps {
  flow: PurchaseFlowController;
  isNight: boolean;
}

export function PurchaseFlowModals({ flow, isNight }: PurchaseFlowModalsProps) {
  const { state } = flow;

  return (
    <>
      {state.kind === 'vip_offer' && (
        <VipOfferModal
          onClose={flow.closeFlow}
          onSubscribe={flow.startVipSubscription}
        />
      )}

      {(state.kind === 'vip_gate' || state.kind === 'book_gate') && (
        <ParentalGateModal
          onCancel={flow.closeFlow}
          onSuccess={flow.approveParentalGate}
          isNight={isNight}
        />
      )}

      {state.kind === 'vip_payment' && (
        <PaymentGatewayModal
          isVipOnly
          onClose={flow.closeFlow}
          onPaymentSuccess={flow.handlePaymentSuccess}
        />
      )}

      {state.kind === 'book_payment' && (
        <PaymentGatewayModal
          story={state.story}
          onClose={flow.closeFlow}
          onPaymentSuccess={flow.handlePaymentSuccess}
        />
      )}

      {state.kind === 'download' && (
        <OfflineDownloadModal
          story={state.story}
          onClose={flow.closeFlow}
          isNight={isNight}
        />
      )}
    </>
  );
}
