import type { Story } from '@/types';
import type { PurchaseType } from '@/features/commerce/types/paymentGateway';

export type ManualPaymentStatus =
  | 'pending_payment'
  | 'pending_review'
  | 'paid'
  | 'rejected'
  | 'cancelled'
  | 'expired';

export type ManualPaymentMethod = 'manual_bank_transfer' | 'manual_qris';

export interface ManualPaymentInstructions {
  bankTransfer: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  } | null;
  qrisImageUrl: string | null;
  qrisAmountMode: 'fixed' | 'manual' | null;
  expiresHours: number;
}

export interface ManualPaymentOrder {
  orderId: string;
  purchaseType: PurchaseType;
  storyId: string;
  storyTitle: string;
  amount: number;
  discountAmount: number;
  couponCode: string | null;
  customerName: string;
  customerEmail: string;
  status: ManualPaymentStatus;
  paymentMethod: ManualPaymentMethod | null;
  expiresAt: string | null;
  proofSubmittedAt: string | null;
  payerNote: string | null;
  reviewNote: string | null;
  paidAt: string | null;
  createdAt: string;
  instructions?: ManualPaymentInstructions;
}

export interface ManualPaymentModalProps {
  story?: Story;
  isVipOnly?: boolean;
  onClose: () => void;
  onOrderSubmitted: (order: ManualPaymentOrder) => void;
}
