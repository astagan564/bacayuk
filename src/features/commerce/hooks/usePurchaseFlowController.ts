import { useCallback, useState } from 'react';
import type { Story } from '@/types';
import type { PurchaseReceipt } from '@/utils/paymentStore';
import { paymentStore } from '@/utils/paymentStore';
import { userAuthStore } from '@/utils/userAuthStore';

export type PurchaseFlowState =
  | { kind: 'idle' }
  | { kind: 'vip_offer' }
  | { kind: 'vip_gate' }
  | { kind: 'vip_payment' }
  | { kind: 'book_gate'; story: Story }
  | { kind: 'book_payment'; story: Story }
  | { kind: 'download'; story: Story };

interface PurchaseFlowControllerOptions {
  onVipActivated: () => void;
  showToast: (message: string) => void;
}

export function usePurchaseFlowController({
  onVipActivated,
  showToast,
}: PurchaseFlowControllerOptions) {
  const [state, setState] = useState<PurchaseFlowState>({ kind: 'idle' });

  const closeFlow = useCallback(() => setState({ kind: 'idle' }), []);
  const offerVip = useCallback(() => setState({ kind: 'vip_offer' }), []);
  const startVipSubscription = useCallback(() => {
    if (!userAuthStore.getUser()) {
      showToast('Silakan login terlebih dahulu untuk berlangganan VIP.');
      return;
    }
    setState({ kind: 'vip_gate' });
  }, [showToast]);

  const requestOfflineDownload = useCallback((story: Story) => {
    if (!userAuthStore.getUser()) {
      showToast('Silakan login terlebih dahulu untuk membeli atau mengunduh buku.');
      return;
    }
    const hasAccess = userAuthStore.isVip() || paymentStore.isStoryPurchased(story.id);
    setState(hasAccess ? { kind: 'download', story } : { kind: 'book_payment', story });
  }, [showToast]);

  const requestBookPurchase = useCallback((story: Story) => {
    if (!userAuthStore.getUser()) {
      showToast('Silakan login terlebih dahulu untuk membeli atau mengunduh buku.');
      return;
    }
    setState(userAuthStore.isVip()
      ? { kind: 'download', story }
      : { kind: 'book_gate', story }
    );
  }, [showToast]);

  const approveParentalGate = useCallback(() => {
    setState((currentState) => {
      if (currentState.kind === 'vip_gate') return { kind: 'vip_payment' };
      if (currentState.kind === 'book_gate') {
        return { kind: 'book_payment', story: currentState.story };
      }
      return currentState;
    });
  }, []);

  const handlePaymentSuccess = useCallback((receipt: PurchaseReceipt) => {
    if (state.kind === 'vip_payment') {
      setState({ kind: 'idle' });
      showToast('🎉 Pembayaran VIP berhasil! Unduh semua buku kini terbuka.');
      onVipActivated();
      return;
    }

    if (state.kind === 'book_payment') {
      setState({ kind: 'download', story: state.story });
      showToast(`🎉 Pembayaran berhasil! Akses unduhan offline untuk ${receipt.storyTitle} telah aktif.`);
    }
  }, [onVipActivated, showToast, state]);

  return {
    state,
    closeFlow,
    offerVip,
    startVipSubscription,
    requestOfflineDownload,
    requestBookPurchase,
    approveParentalGate,
    handlePaymentSuccess,
  };
}

export type PurchaseFlowController = ReturnType<typeof usePurchaseFlowController>;
