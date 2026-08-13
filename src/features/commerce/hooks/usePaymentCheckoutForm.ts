import { useCallback, useState } from 'react';
import type { Story } from '@/types';
import { VIP_MONTHLY_PRICE } from '@/features/commerce/constants/payment';
import type { PurchaseType } from '@/features/commerce/types/paymentGateway';
import { userAuthStore } from '@/utils/userAuthStore';
import { quotePaymentTransaction } from '@/features/commerce/api/paymentGatewayApi';

interface PaymentCheckoutFormOptions {
  story?: Story;
  isVipOnly: boolean;
  basePrice: number;
}

export interface ValidatedPaymentCustomer {
  name: string;
  email: string;
}

export function usePaymentCheckoutForm({
  story,
  isVipOnly,
  basePrice,
}: PaymentCheckoutFormOptions) {
  const [purchaseType, setPurchaseType] = useState<PurchaseType>(isVipOnly ? 'vip' : 'book');
  const account = userAuthStore.getUser();
  const [customerName, setCustomerName] = useState(account?.name || '');
  const [customerEmail, setCustomerEmail] = useState(account?.email || '');
  const [couponInput, setCouponInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [quotedAmount, setQuotedAmount] = useState<number | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const priceBeforeDiscount = purchaseType === 'book' ? basePrice : VIP_MONTHLY_PRICE;
  const finalPrice = quotedAmount ?? Math.max(0, priceBeforeDiscount - appliedDiscount);

  const selectPurchaseType = useCallback((nextPurchaseType: PurchaseType) => {
    setPurchaseType(nextPurchaseType);
    setAppliedDiscount(0);
    setAppliedCouponCode(null);
    setQuotedAmount(null);
    setCouponMessage(null);
  }, []);

  const updateCouponInput = useCallback((value: string) => {
    setCouponInput(value);
    setAppliedDiscount(0);
    setAppliedCouponCode(null);
    setQuotedAmount(null);
    setCouponMessage(null);
  }, []);

  const applyCoupon = useCallback(async () => {
    if (!couponInput.trim()) return;
    setIsApplyingCoupon(true);
    try {
      const quote = await quotePaymentTransaction({
        purchaseType,
        storyId: story?.id,
        storyTitle: story?.title,
        couponCode: couponInput.trim().toUpperCase(),
      });
      if (!quote.couponCode || quote.discountAmount <= 0) {
        setCouponMessage('Kode kupon tidak ditemukan, tidak aktif, kedaluwarsa, atau syaratnya belum terpenuhi.');
        setAppliedDiscount(0);
        setAppliedCouponCode(null);
        setQuotedAmount(null);
        return;
      }
      setAppliedDiscount(quote.discountAmount);
      setAppliedCouponCode(quote.couponCode);
      setQuotedAmount(quote.amount);
      setCouponMessage(`Kupon terpasang. Hemat Rp ${quote.discountAmount.toLocaleString('id-ID')}.`);
    } catch (error) {
      setCouponMessage(error instanceof Error ? error.message : 'Kupon belum dapat diperiksa.');
      setAppliedDiscount(0);
      setAppliedCouponCode(null);
      setQuotedAmount(null);
    } finally {
      setIsApplyingCoupon(false);
    }
  }, [couponInput, purchaseType, story]);

  const validateCustomer = useCallback((): ValidatedPaymentCustomer | string => {
    if (!userAuthStore.getUser()) return 'Silakan login terlebih dahulu untuk melakukan pembayaran.';
    const name = customerName.trim();
    const email = customerEmail.trim().toLowerCase();
    if (!name || !email) return 'Isi nama dan email pembeli terlebih dahulu.';
    if (!email.includes('@') || !email.includes('.')) return 'Gunakan alamat email yang valid.';
    if (purchaseType === 'book' && !story) return 'Buku untuk transaksi tidak ditemukan.';
    return { name, email };
  }, [customerEmail, customerName, purchaseType, story]);

  return {
    purchaseType,
    customerName,
    customerEmail,
    couponInput,
    appliedDiscount,
    appliedCouponCode,
    couponMessage,
    isApplyingCoupon,
    priceBeforeDiscount,
    finalPrice,
    setCustomerName,
    setCustomerEmail,
    setCouponInput: updateCouponInput,
    selectPurchaseType,
    applyCoupon,
    validateCustomer,
  };
}

export type PaymentCheckoutForm = ReturnType<typeof usePaymentCheckoutForm>;
