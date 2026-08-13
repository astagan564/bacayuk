import { useCallback } from 'react';
import { adminStore } from '@/utils/adminStore';
import { VIP_MONTHLY_PRICE } from '@/features/commerce/constants/payment';
import { useMidtransPaymentController } from '@/features/commerce/hooks/useMidtransPaymentController';
import { usePaymentCheckoutForm } from '@/features/commerce/hooks/usePaymentCheckoutForm';
import type {
  PaymentGatewayModalProps,
  PurchaseType,
} from '@/features/commerce/types/paymentGateway';

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
  const checkout = usePaymentCheckoutForm({ story, isVipOnly, basePrice });
  const payment = useMidtransPaymentController({
    story,
    purchaseType: checkout.purchaseType,
    appliedCouponCode: checkout.appliedCouponCode,
    validateCustomer: checkout.validateCustomer,
    onPaymentSuccess,
  });

  const selectPurchaseType = useCallback((nextPurchaseType: PurchaseType) => {
    checkout.selectPurchaseType(nextPurchaseType);
    payment.clearError();
  }, [checkout.selectPurchaseType, payment.clearError]);

  return {
    story,
    isVipOnly,
    adminSettings,
    basePrice,
    vipPrice: VIP_MONTHLY_PRICE,
    purchaseType: checkout.purchaseType,
    customerName: checkout.customerName,
    customerEmail: checkout.customerEmail,
    couponInput: checkout.couponInput,
    appliedDiscount: checkout.appliedDiscount,
    couponMessage: checkout.couponMessage,
    isProcessing: payment.isProcessing,
    isSuccess: payment.isSuccess,
    currentReceipt: payment.currentReceipt,
    errorMessage: payment.errorMessage,
    priceBeforeDiscount: checkout.priceBeforeDiscount,
    finalPrice: checkout.finalPrice,
    setCustomerName: checkout.setCustomerName,
    setCustomerEmail: checkout.setCustomerEmail,
    setCouponInput: checkout.setCouponInput,
    selectPurchaseType,
    applyCoupon: checkout.applyCoupon,
    startPayment: payment.startPayment,
    completePayment: payment.completePayment,
  };
}

export type PaymentGatewayController = ReturnType<typeof usePaymentGatewayController>;
