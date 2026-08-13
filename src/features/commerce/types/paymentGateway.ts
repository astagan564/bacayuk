import type { Story } from '@/types';
import type { PurchaseReceipt } from '@/utils/paymentStore';

export type PurchaseType = 'book' | 'vip';

export interface PaymentGatewayModalProps {
  story?: Story;
  onClose: () => void;
  onPaymentSuccess: (receipt: PurchaseReceipt) => void;
  isVipOnly?: boolean;
}

export interface MidtransPaymentResult {
  order_id?: string;
  payment_type?: string;
}

export interface MidtransCallbacks {
  onSuccess: (result: MidtransPaymentResult) => void | Promise<void>;
  onPending: (result: MidtransPaymentResult) => void;
  onError: (result: MidtransPaymentResult) => void;
  onClose: () => void;
}

export interface CreateTransactionRequest {
  purchaseType: PurchaseType;
  storyId?: string;
  storyTitle?: string;
  customerName?: string;
  customerEmail?: string;
  couponCode: string | null;
}

export interface CreateTransactionResponse {
  token: string;
  orderId: string;
  amount: number;
  discountAmount: number;
  couponCode: string | null;
  storyId: string;
  storyTitle: string;
  purchaseType: PurchaseType;
}

export interface VerifyTransactionResponse {
  isPaid: boolean;
  entitlement?: PurchaseReceipt | null;
  error?: string;
}

declare global {
  interface Window {
    snap?: {
      pay: (token: string, callbacks: MidtransCallbacks) => void;
    };
  }
}
