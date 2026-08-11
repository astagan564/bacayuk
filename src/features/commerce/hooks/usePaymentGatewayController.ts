import { useCallback, useEffect, useRef, useState } from 'react';
import type { Story } from '@/types';
import type { PurchaseReceipt } from '@/utils/paymentStore';
import { adminStore } from '@/utils/adminStore';
import { paymentStore } from '@/utils/paymentStore';
import { userAuthStore } from '@/utils/userAuthStore';
import {
  createPaymentTransaction,
  verifyPaymentTransaction,
} from '@/features/commerce/api/paymentGatewayApi';
import {
  mountMidtransSnapScript,
  openMidtransPayment,
} from '@/features/commerce/api/midtransSnap';
import type {
  CreateTransactionResponse,
  MidtransPaymentResult,
  PaymentGatewayModalProps,
  PurchaseType,
} from '@/features/commerce/types/paymentGateway';

const VIP_MONTHLY_PRICE = 100_000;

type PaymentGatewayControllerOptions = Pick<
  PaymentGatewayModalProps,
  'story' | 'isVipOnly' | 'onPaymentSuccess'
>;

export function usePaymentGatewayController({
  story,
  isVipOnly = false,
  onPaymentSuccess,
}: PaymentGatewayControllerOptions) {
  const adminSettings = adminStore.getSettings();
  const basePrice = story?.ebookPrice || adminSettings.defaultEbookPrice;
  const [purchaseType, setPurchaseType] = useState<PurchaseType>(isVipOnly ? 'vip' : 'book');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<PurchaseReceipt | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const priceBeforeDiscount = purchaseType === 'book' ? basePrice : VIP_MONTHLY_PRICE;
  const finalPrice = Math.max(0, priceBeforeDiscount - appliedDiscount);

  useEffect(() => {
    isMountedRef.current = true;
    const unmountScript = mountMidtransSnapScript();
    return () => {
      isMountedRef.current = false;
      unmountScript();
    };
  }, []);

  const selectPurchaseType = useCallback((nextPurchaseType: PurchaseType) => {
    setPurchaseType(nextPurchaseType);
    setAppliedDiscount(0);
    setAppliedCouponCode(null);
    setCouponMessage(null);
    setErrorMessage(null);
  }, []);

  const applyCoupon = useCallback(() => {
    if (!couponInput.trim()) return;
    const result = adminStore.validateCoupon(couponInput, priceBeforeDiscount);
    if (result.valid) {
      setAppliedDiscount(result.discountAmount);
      setAppliedCouponCode(result.coupon?.code || couponInput.toUpperCase());
      setCouponMessage(`Kupon terpasang. Hemat Rp ${result.discountAmount.toLocaleString('id-ID')}.`);
      return;
    }
    setCouponMessage(result.message || 'Kupon tidak dapat digunakan.');
    setAppliedDiscount(0);
    setAppliedCouponCode(null);
  }, [couponInput, priceBeforeDiscount]);

  const recordSuccessfulPayment = useCallback(async (
    transaction: CreateTransactionResponse,
    result: MidtransPaymentResult,
    normalizedName: string,
    normalizedEmail: string,
  ): Promise<PurchaseReceipt> => {
    const orderId = result.order_id || transaction.orderId;
    await verifyPaymentTransaction(orderId);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + adminSettings.downloadLinkExpireHours);
    const isVipPurchase = purchaseType === 'vip';
    if (!isVipPurchase && !story) throw new Error('Buku untuk transaksi tidak ditemukan.');

    const receipt: PurchaseReceipt = {
      storyId: isVipPurchase ? 'vip_sub' : story!.id,
      storyTitle: isVipPurchase ? 'Langganan keluarga 1 bulan' : story!.title,
      customerName: normalizedName,
      customerEmail: normalizedEmail,
      transactionId: orderId,
      paymentMethod: result.payment_type || 'midtrans',
      amount: transaction.amount,
      purchasedAt: new Date().toISOString(),
      downloadCount: 0,
      tokenExpiresAt: expiresAt.toISOString(),
    };

    if (isVipPurchase) await userAuthStore.activateVip();
    else paymentStore.savePurchase(receipt);
    if (appliedCouponCode) adminStore.useCoupon(appliedCouponCode);

    const paidAt = new Date().toISOString();
    adminStore.addTransaction({
      id: orderId,
      customerName: normalizedName,
      customerEmail: normalizedEmail,
      storyId: receipt.storyId,
      storyTitle: receipt.storyTitle,
      paymentMethod: receipt.paymentMethod,
      amount: transaction.amount,
      discountAmount: transaction.discountAmount,
      couponCode: transaction.couponCode || undefined,
      status: 'success',
      createdAt: paidAt,
      paidAt,
    });
    return receipt;
  }, [adminSettings.downloadLinkExpireHours, appliedCouponCode, purchaseType, story]);

  const startPayment = useCallback(async () => {
    const normalizedName = customerName.trim();
    const normalizedEmail = customerEmail.trim().toLowerCase();
    if (!normalizedName || !normalizedEmail) {
      setErrorMessage('Isi nama dan email pembeli terlebih dahulu.');
      return;
    }
    if (!normalizedEmail.includes('@') || !normalizedEmail.includes('.')) {
      setErrorMessage('Gunakan alamat email yang valid.');
      return;
    }
    if (purchaseType === 'book' && !story) {
      setErrorMessage('Buku untuk transaksi tidak ditemukan.');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const transaction = await createPaymentTransaction({
        purchaseType,
        storyId: story?.id,
        storyTitle: story?.title,
        customerName: normalizedName,
        customerEmail: normalizedEmail,
        couponCode: appliedCouponCode,
      });
      if (!isMountedRef.current) return;

      openMidtransPayment(transaction.token, {
        onSuccess: async (result) => {
          try {
            const receipt = await recordSuccessfulPayment(
              transaction,
              result,
              normalizedName,
              normalizedEmail,
            );
            if (!isMountedRef.current) return;
            setCurrentReceipt(receipt);
            setIsProcessing(false);
            setIsSuccess(true);
          } catch (error) {
            console.error(error);
            if (!isMountedRef.current) return;
            setIsProcessing(false);
            setErrorMessage(error instanceof Error
              ? error.message
              : 'Pembayaran belum terverifikasi. Tunggu beberapa saat lalu coba lagi.');
          }
        },
        onPending: () => {
          if (!isMountedRef.current) return;
          setIsProcessing(false);
          setErrorMessage('Pembayaran masih menunggu konfirmasi.');
        },
        onError: () => {
          if (!isMountedRef.current) return;
          setIsProcessing(false);
          setErrorMessage('Pembayaran gagal diproses.');
        },
        onClose: () => {
          if (isMountedRef.current) setIsProcessing(false);
        },
      });
    } catch (error) {
      console.error(error);
      if (!isMountedRef.current) return;
      setIsProcessing(false);
      setErrorMessage(error instanceof Error ? error.message : 'Koneksi pembayaran gagal.');
    }
  }, [appliedCouponCode, customerEmail, customerName, purchaseType, recordSuccessfulPayment, story]);

  const completePayment = useCallback(() => {
    if (currentReceipt) onPaymentSuccess(currentReceipt);
  }, [currentReceipt, onPaymentSuccess]);

  return {
    story,
    isVipOnly,
    adminSettings,
    basePrice,
    vipPrice: VIP_MONTHLY_PRICE,
    purchaseType,
    customerName,
    customerEmail,
    couponInput,
    appliedDiscount,
    couponMessage,
    isProcessing,
    isSuccess,
    currentReceipt,
    errorMessage,
    priceBeforeDiscount,
    finalPrice,
    setCustomerName,
    setCustomerEmail,
    setCouponInput,
    selectPurchaseType,
    applyCoupon,
    startPayment,
    completePayment,
  };
}

export type PaymentGatewayController = ReturnType<typeof usePaymentGatewayController>;
