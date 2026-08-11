import type { FinanceTabProps } from '@/features/admin/types/finance';
import { CouponManagement } from '@/features/admin/components/finance/CouponManagement';
import { FinanceSummaryCards } from '@/features/admin/components/finance/FinanceSummaryCards';
import { TransactionHistoryTable } from '@/features/admin/components/finance/TransactionHistoryTable';

export function FinanceTab({
  totalRevenue,
  successfulTransactions,
  pendingTransactions,
  transactions,
  coupons,
  showCouponForm,
  newCouponCode,
  newCouponType,
  newCouponValue,
  onToggleCouponForm,
  onCouponCodeChange,
  onCouponTypeChange,
  onCouponValueChange,
  onCreateCoupon,
  onToggleCoupon,
  onDeleteCoupon,
  onUpdateTransactionStatus,
}: FinanceTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <FinanceSummaryCards
        totalRevenue={totalRevenue}
        successfulTransactionCount={successfulTransactions.length}
        pendingTransactionCount={pendingTransactions.length}
        totalTransactionCount={transactions.length}
      />
      <CouponManagement
        coupons={coupons}
        showForm={showCouponForm}
        newCode={newCouponCode}
        newType={newCouponType}
        newValue={newCouponValue}
        onToggleForm={onToggleCouponForm}
        onCodeChange={onCouponCodeChange}
        onTypeChange={onCouponTypeChange}
        onValueChange={onCouponValueChange}
        onCreateCoupon={onCreateCoupon}
        onToggleCoupon={onToggleCoupon}
        onDeleteCoupon={onDeleteCoupon}
      />
      <TransactionHistoryTable
        transactions={transactions}
        onUpdateStatus={onUpdateTransactionStatus}
      />
    </div>
  );
}
