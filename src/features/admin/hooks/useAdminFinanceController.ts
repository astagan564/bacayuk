import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { adminStore } from '@/utils/adminStore';
import type { DiscountCoupon } from '@/utils/adminStore';
import {
  approveManualPaymentOrder,
  fetchManualPaymentOrders,
  rejectManualPaymentOrder,
} from '@/features/admin/api/manualPaymentAdminApi';
import type { AdminManualPaymentOrder } from '@/features/admin/types/manualPayment';

interface AdminFinanceControllerOptions {
  adminPin: string;
  showToast: (message: string) => void;
}
export function useAdminFinanceController({ adminPin, showToast }: AdminFinanceControllerOptions) {
  const [coupons, setCoupons] = useState<DiscountCoupon[]>(() => adminStore.getCoupons());
  const [transactions, setTransactions] = useState<AdminManualPaymentOrder[]>([]);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percent' | 'fixed'>('percent');
  const [newCouponValue, setNewCouponValue] = useState(20);
  const [showCouponForm, setShowCouponForm] = useState(false);

  const refreshTransactions = useCallback(async () => {
    if (!adminPin) return;
    setIsLoadingTransactions(true);
    setTransactionsError(null);
    try {
      setTransactions(await fetchManualPaymentOrders(adminPin));
    } catch (error) {
      setTransactionsError(error instanceof Error ? error.message : 'Pesanan manual belum dapat dimuat.');
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [adminPin]);

  useEffect(() => {
    void refreshTransactions();
  }, [refreshTransactions]);

  const handleCreateCoupon = useCallback((event: FormEvent) => {
    event.preventDefault();
    if (!newCouponCode.trim()) return;
    const code = newCouponCode.trim().toUpperCase();
    const updated = [{
      code,
      type: newCouponType,
      value: Number(newCouponValue),
      usageCount: 0,
      isActive: true,
    } satisfies DiscountCoupon, ...coupons];
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
        : coupon);
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

  const handleApproveTransaction = useCallback(async (id: string) => {
    await approveManualPaymentOrder(adminPin, id);
    await refreshTransactions();
    showToast(`Pesanan #${id} disetujui dan akses pembeli sudah aktif.`);
  }, [adminPin, refreshTransactions, showToast]);

  const handleRejectTransaction = useCallback(async (id: string, note: string) => {
    await rejectManualPaymentOrder(adminPin, id, note);
    await refreshTransactions();
    showToast(`Pesanan #${id} ditolak.`);
  }, [adminPin, refreshTransactions, showToast]);

  const successfulTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.status === 'paid'),
    [transactions],
  );
  const pendingTransactions = useMemo(
    () => transactions.filter((transaction) => ['pending_payment', 'pending_review'].includes(transaction.status)),
    [transactions],
  );
  const totalRevenue = useMemo(
    () => successfulTransactions.reduce((sum, transaction) => sum + transaction.amount, 0),
    [successfulTransactions],
  );

  return {
    coupons,
    transactions,
    transactionsError,
    isLoadingTransactions,
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
    handleApproveTransaction,
    handleRejectTransaction,
  };
}
