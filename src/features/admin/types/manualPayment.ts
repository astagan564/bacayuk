import type {
  ManualPaymentMethod,
  ManualPaymentStatus,
  WhatsAppNotificationStatus,
} from '@/features/commerce/types/manualPayment';
import type { PurchaseType } from '@/features/commerce/types/paymentGateway';

export interface AdminManualPaymentOrder {
  orderId: string;
  purchaseType: PurchaseType;
  storyId: string;
  storyTitle: string;
  amount: number;
  discountAmount: number;
  customerName: string;
  customerEmail: string;
  status: ManualPaymentStatus;
  paymentMethod: ManualPaymentMethod | null;
  expiresAt: string | null;
  proofSubmittedAt: string | null;
  proofUrl: string | null;
  payerNote: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  paidAt: string | null;
  whatsappNotificationStatus: WhatsAppNotificationStatus;
  whatsappNotificationAttempts: number;
  whatsappNotificationSentAt: string | null;
  whatsappNotificationError: string | null;
  createdAt: string;
}
