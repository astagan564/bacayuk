import { ParentalGateModal } from '@/components/ParentalGateModal';
import { VipOfferModal } from '@/components/VipOfferModal';
import { OfflineDownloadModal } from '@/features/commerce/components/download/OfflineDownloadModal';
import { ManualPaymentModal } from '@/features/commerce/components/manual-payment/ManualPaymentModal';
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
        <ManualPaymentModal
          isVipOnly
          onClose={flow.closeFlow}
          onOrderSubmitted={flow.handleOrderSubmitted}
        />
      )}

      {state.kind === 'book_payment' && (
        <ManualPaymentModal
          story={state.story}
          onClose={flow.closeFlow}
          onOrderSubmitted={flow.handleOrderSubmitted}
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
