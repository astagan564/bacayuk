import type { FormEvent } from 'react';
import type { DiscountCoupon, TransactionRecord } from '@/features/admin/types/adminStore';

export interface FinanceTabProps {
  totalRevenue: number;
  successfulTransactions: TransactionRecord[];
  pendingTransactions: TransactionRecord[];
  transactions: TransactionRecord[];
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
  onUpdateTransactionStatus: (id: string, status: TransactionRecord['status']) => void;
}
