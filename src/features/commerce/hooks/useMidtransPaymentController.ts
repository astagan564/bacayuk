import { useCallback, useEffect, useRef, useState } from 'react';
import type { Story } from '@/types';
import type { PurchaseReceipt } from '@/utils/paymentStore';
import { createPaymentTransaction } from '@/features/commerce/api/paymentGatewayApi';
import { mountMidtransSnapScript, openMidtransPayment } from '@/features/commerce/api/midtransSnap';
import { completeVerifiedPayment } from '@/features/commerce/services/completePayment';
import type { PurchaseType } from '@/features/commerce/types/paymentGateway';
import type { ValidatedPaymentCustomer } from '@/features/commerce/hooks/usePaymentCheckoutForm';

interface MidtransPaymentControllerOptions {
  story?: Story;
  purchaseType: PurchaseType;
  appliedCouponCode: string | null;
  validateCustomer: () => ValidatedPaymentCustomer | string;
  onPaymentSuccess: (receipt: PurchaseReceipt) => void;
}

interface ActivePaymentSession {
  id: number;
  abortController: AbortController;
  isCompleting: boolean;
}

export function useMidtransPaymentController({
  story,
  purchaseType,
  appliedCouponCode,
  validateCustomer,
  onPaymentSuccess,
}: MidtransPaymentControllerOptions) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<PurchaseReceipt | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const nextSessionIdRef = useRef(0);
  const activeSessionRef = useRef<ActivePaymentSession | null>(null);

  const isActiveSession = useCallback((sessionId: number) => (
    activeSessionRef.current?.id === sessionId
    && !activeSessionRef.current.abortController.signal.aborted
  ), []);

  const finishSession = useCallback((sessionId: number) => {
    if (activeSessionRef.current?.id !== sessionId) return;
    activeSessionRef.current = null;
    setIsProcessing(false);
  }, []);

  const clearError = useCallback(() => setErrorMessage(null), []);

  useEffect(() => {
    const unmountScript = mountMidtransSnapScript();
    return () => {
      activeSessionRef.current?.abortController.abort();
      activeSessionRef.current = null;
      unmountScript();
    };
  }, []);

  const startPayment = useCallback(async () => {
    if (activeSessionRef.current) return;

    const customer = validateCustomer();
    if (typeof customer === 'string') {
      setErrorMessage(customer);
      return;
    }

    const session: ActivePaymentSession = {
      id: nextSessionIdRef.current + 1,
      abortController: new AbortController(),
      isCompleting: false,
    };
    nextSessionIdRef.current = session.id;
    activeSessionRef.current = session;
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const transaction = await createPaymentTransaction({
        purchaseType,
        storyId: story?.id,
        storyTitle: story?.title,
        customerName: customer.name,
        customerEmail: customer.email,
        couponCode: appliedCouponCode,
      }, session.abortController.signal);
      if (!isActiveSession(session.id)) return;

      openMidtransPayment(transaction.token, {
        onSuccess: async (result) => {
          const activeSession = activeSessionRef.current;
          if (!activeSession || activeSession.id !== session.id || activeSession.isCompleting) return;
          activeSession.isCompleting = true;
          try {
            const receipt = await completeVerifiedPayment({
              transaction,
              result,
              story,
              purchaseType,
              signal: activeSession.abortController.signal,
            });
            if (!isActiveSession(session.id)) return;
            setCurrentReceipt(receipt);
            setIsSuccess(true);
            finishSession(session.id);
          } catch (error) {
            if (!isActiveSession(session.id)) return;
            console.error(error);
            setErrorMessage(error instanceof Error
              ? error.message
              : 'Pembayaran belum terverifikasi. Tunggu beberapa saat lalu coba lagi.');
            finishSession(session.id);
          }
        },
        onPending: () => {
          if (!isActiveSession(session.id) || activeSessionRef.current?.isCompleting) return;
          setErrorMessage('Pembayaran masih menunggu konfirmasi.');
          finishSession(session.id);
        },
        onError: () => {
          if (!isActiveSession(session.id) || activeSessionRef.current?.isCompleting) return;
          setErrorMessage('Pembayaran gagal diproses.');
          finishSession(session.id);
        },
        onClose: () => {
          if (isActiveSession(session.id) && !activeSessionRef.current?.isCompleting) {
            finishSession(session.id);
          }
        },
      });
    } catch (error) {
      if (!isActiveSession(session.id)) return;
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : 'Koneksi pembayaran gagal.');
      finishSession(session.id);
    }
  }, [
    appliedCouponCode,
    finishSession,
    isActiveSession,
    purchaseType,
    story,
    validateCustomer,
  ]);

  const completePayment = useCallback(() => {
    if (currentReceipt) onPaymentSuccess(currentReceipt);
  }, [currentReceipt, onPaymentSuccess]);

  return {
    isProcessing,
    isSuccess,
    currentReceipt,
    errorMessage,
    clearError,
    startPayment,
    completePayment,
  };
}

export type MidtransPaymentController = ReturnType<typeof useMidtransPaymentController>;
