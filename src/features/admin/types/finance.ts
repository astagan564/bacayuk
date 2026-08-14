import type { FormEvent } from 'react';
import type { DiscountCoupon } from '@/features/admin/types/adminStore';
import type { AdminManualPaymentOrder } from '@/features/admin/types/manualPayment';

export interface FinanceTabProps {
  totalRevenue: number;
  successfulTransactions: AdminManualPaymentOrder[];
  pendingTransactions: AdminManualPaymentOrder[];
  transactions: AdminManualPaymentOrder[];
  transactionsError: string | null;
  isLoadingTransactions: boolean;
  coupons: DiscountCoupon[];
  showCouponForm: boolean;
  newCouponCode: string;
  newCouponType: DiscountCoupon['type'];
  newCouponValue: number;
  onToggleCouponForm: () => void;
  onCouponCodeChange: (value: string) => void;
  onCouponTypeChange: (value: DiscountCoupon['type']) => void;
  onCouponValueChange: (value: number) => void;
  onCreateCoupon: (event: FormEvent) => void;
  onToggleCoupon: (code: string) => void;
  onDeleteCoupon: (code: string) => void;
  onApproveTransaction: (id: string) => Promise<void>;
  onRejectTransaction: (id: string, note: string) => Promise<void>;
  onRetryWhatsAppNotification: (id: string) => Promise<void>;
  onRefreshTransactions: () => void;
}
