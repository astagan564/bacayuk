import { useCallback, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { adminStore } from '@/utils/adminStore';
import type { DiscountCoupon, TransactionRecord } from '@/utils/adminStore';

interface AdminFinanceControllerOptions {
  showToast: (message: string) => void;
}

export function useAdminFinanceController({ showToast }: AdminFinanceControllerOptions) {
  const [coupons, setCoupons] = useState<DiscountCoupon[]>(() => adminStore.getCoupons());
  const [transactions, setTransactions] = useState<TransactionRecord[]>(() => adminStore.getTransactions());
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percent' | 'fixed'>('percent');
  const [newCouponValue, setNewCouponValue] = useState(20);
  const [showCouponForm, setShowCouponForm] = useState(false);

  const refreshTransactions = useCallback(() => {
    setTransactions(adminStore.getTransactions());
  }, []);

  const handleCreateCoupon = useCallback((event: FormEvent) => {
    event.preventDefault();
    if (!newCouponCode.trim()) return;

    const code = newCouponCode.trim().toUpperCase();
    const newCoupon: DiscountCoupon = {
      code,
      type: newCouponType,
      value: Number(newCouponValue),
      usageCount: 0,
      isActive: true,
    };
    const updated = [newCoupon, ...coupons];
    setCoupons(updated);
    void adminStore.saveCoupons(updated);
    setNewCouponCode('');
    setShowCouponForm(false);
    showToast(`Kupon ${code} dibuat.`);
  }, [coupons, newCouponCode, newCouponType, newCouponValue, showToast]);

  const handleToggleCoupon = useCallback((code: string) => {
    setCoupons((currentCoupons) => {
      const updated = currentCoupons.map((coupon) => coupon.code === code
        ? { ...coupon, isActive: !coupon.isActive }
        : coupon
      );
      void adminStore.saveCoupons(updated);
      return updated;
    });
  }, []);

  const handleDeleteCoupon = useCallback((code: string) => {
    setCoupons((currentCoupons) => {
      const updated = currentCoupons.filter((coupon) => coupon.code !== code);
      void adminStore.saveCoupons(updated);
      return updated;
    });
    showToast(`Kupon ${code} dihapus.`);
  }, [showToast]);

  const handleUpdateTransactionStatus = useCallback(async (
    id: string,
    status: TransactionRecord['status'],
  ) => {
    await adminStore.updateTransactionStatus(id, status);
    refreshTransactions();
    showToast(`Status transaksi #${id} menjadi ${status}.`);
  }, [refreshTransactions, showToast]);

  const successfulTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.status === 'success'),
    [transactions],
  );
  const pendingTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.status === 'pending'),
    [transactions],
  );
  const totalRevenue = useMemo(
    () => successfulTransactions.reduce((sum, transaction) => sum + transaction.amount, 0),
    [successfulTransactions],
  );

  return {
    coupons,
    transactions,
    newCouponCode,
    newCouponType,
    newCouponValue,
    showCouponForm,
    successfulTransactions,
    pendingTransactions,
    totalRevenue,
    setNewCouponCode,
    setNewCouponType,
    setNewCouponValue,
    setShowCouponForm,
    refreshTransactions,
    handleCreateCoupon,
    handleToggleCoupon,
    handleDeleteCoupon,
    handleUpdateTransactionStatus,
  };
}
