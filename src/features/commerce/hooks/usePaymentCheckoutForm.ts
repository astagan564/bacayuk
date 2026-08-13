import { useCallback, useState } from 'react';
import type { Story } from '@/types';
import { adminStore } from '@/utils/adminStore';
import { VIP_MONTHLY_PRICE } from '@/features/commerce/constants/payment';
import type { PurchaseType } from '@/features/commerce/types/paymentGateway';
import { userAuthStore } from '@/utils/userAuthStore';

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
  const [couponMessage, setCouponMessage] = useState<string | null>(null);

  const priceBeforeDiscount = purchaseType === 'book' ? basePrice : VIP_MONTHLY_PRICE;
  const finalPrice = Math.max(0, priceBeforeDiscount - appliedDiscount);

  const selectPurchaseType = useCallback((nextPurchaseType: PurchaseType) => {
    setPurchaseType(nextPurchaseType);
    setAppliedDiscount(0);
    setAppliedCouponCode(null);
    setCouponMessage(null);
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
    priceBeforeDiscount,
    finalPrice,
    setCustomerName,
    setCustomerEmail,
    setCouponInput,
    selectPurchaseType,
    applyCoupon,
    validateCustomer,
  };
}

export type PaymentCheckoutForm = ReturnType<typeof usePaymentCheckoutForm>;
