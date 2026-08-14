import { useCallback, useState } from 'react';
import type { Story } from '@/types';
import type { ManualPaymentOrder } from '@/features/commerce/types/manualPayment';
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
  requestLogin?: () => void;
  showToast: (message: string) => void;
}

export function usePurchaseFlowController({
  requestLogin,
  showToast,
}: PurchaseFlowControllerOptions) {
  const [state, setState] = useState<PurchaseFlowState>({ kind: 'idle' });

  const closeFlow = useCallback(() => setState({ kind: 'idle' }), []);
  const offerVip = useCallback(() => setState({ kind: 'vip_offer' }), []);
  const startVipSubscription = useCallback(() => {
    if (!userAuthStore.getUser()) {
      showToast('Silakan login terlebih dahulu untuk berlangganan VIP.');
      setState({ kind: 'idle' });
      requestLogin?.();
      return;
    }
    setState({ kind: 'vip_gate' });
  }, [requestLogin, showToast]);

  const requestOfflineDownload = useCallback((story: Story) => {
    if (!userAuthStore.getUser()) {
      showToast('Silakan login terlebih dahulu untuk membeli atau mengunduh buku.');
      requestLogin?.();
      return;
    }
    const hasAccess = userAuthStore.isVip() || paymentStore.isStoryPurchased(story.id);
    setState(hasAccess ? { kind: 'download', story } : { kind: 'book_payment', story });
  }, [requestLogin, showToast]);

  const requestBookPurchase = useCallback((story: Story) => {
    if (!userAuthStore.getUser()) {
      showToast('Silakan login terlebih dahulu untuk membeli atau mengunduh buku.');
      requestLogin?.();
      return;
    }
    setState(userAuthStore.isVip()
      ? { kind: 'download', story }
      : { kind: 'book_gate', story }
    );
  }, [requestLogin, showToast]);

  const approveParentalGate = useCallback(() => {
    setState((currentState) => {
      if (currentState.kind === 'vip_gate') return { kind: 'vip_payment' };
      if (currentState.kind === 'book_gate') {
        return { kind: 'book_payment', story: currentState.story };
      }
      return currentState;
    });
  }, []);

  const handleOrderSubmitted = useCallback((order: ManualPaymentOrder) => {
    setState({ kind: 'idle' });
    if (state.kind === 'vip_payment') {
      showToast(`Bukti pesanan ${order.orderId} dikirim. VIP aktif setelah pembayaran diverifikasi admin.`);
      return;
    }
    if (state.kind === 'book_payment') {
      showToast(`Bukti pesanan ${order.orderId} dikirim. Unduhan aktif setelah pembayaran diverifikasi admin.`);
    }
  }, [showToast, state]);

  return {
    state,
    closeFlow,
    offerVip,
    startVipSubscription,
    requestOfflineDownload,
    requestBookPurchase,
    approveParentalGate,
    handleOrderSubmitted,
  };
}

export type PurchaseFlowController = ReturnType<typeof usePurchaseFlowController>;
