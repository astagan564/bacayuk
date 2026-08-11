import { persistCoupons } from '@/features/admin/api/adminPersistence';
import { COUPONS_KEY } from '@/features/admin/stores/adminStorageKeys';
import type {
  CouponValidationResult,
  DiscountCoupon,
} from '@/features/admin/types/adminStore';

const DEFAULT_COUPONS: DiscountCoupon[] = [
  {
    code: 'BUKUANAK20',
    type: 'percent',
    value: 20,
    usageCount: 14,
    maxUsage: 100,
    isActive: true,
  },
  {
    code: 'MERDEKA5K',
    type: 'fixed',
    value: 5000,
    usageCount: 8,
    maxUsage: 50,
    isActive: true,
  },
  {
    code: 'PARENTSPROMO',
    type: 'percent',
    value: 30,
    usageCount: 29,
    maxUsage: 200,
    isActive: true,
  },
];

export const adminCouponStore = {
  getCoupons(): DiscountCoupon[] {
    try {
      const data = localStorage.getItem(COUPONS_KEY);
      return data ? JSON.parse(data) : DEFAULT_COUPONS;
    } catch {
      return DEFAULT_COUPONS;
    }
  },

  async saveCoupons(coupons: DiscountCoupon[]): Promise<void> {
    localStorage.setItem(COUPONS_KEY, JSON.stringify(coupons));
    try {
      await persistCoupons(coupons);
    } catch (error) {
      console.error('Failed to sync coupons', error);
    }
  },

  validateCoupon(code: string, originalAmount: number): CouponValidationResult {
    const cleanCode = code.trim().toUpperCase();
    const match = adminCouponStore.getCoupons().find(
      (coupon) => coupon.code.toUpperCase() === cleanCode && coupon.isActive,
    );
    if (!match) {
      return {
        valid: false,
        discountAmount: 0,
        message: 'Kode kupon tidak ditemukan atau tidak aktif!',
      };
    }
    if (match.maxUsage && match.usageCount >= match.maxUsage) {
      return {
        valid: false,
        discountAmount: 0,
        message: 'Kuota penggunaan kupon ini telah habis!',
      };
    }

    const calculatedDiscount = match.type === 'percent'
      ? Math.round((originalAmount * match.value) / 100)
      : match.value;
    return {
      valid: true,
      coupon: match,
      discountAmount: Math.min(calculatedDiscount, originalAmount),
    };
  },

  async useCoupon(code: string): Promise<void> {
    const coupons = adminCouponStore.getCoupons();
    const cleanCode = code.trim().toUpperCase();
    const couponIndex = coupons.findIndex(
      (coupon) => coupon.code.toUpperCase() === cleanCode,
    );
    if (couponIndex === -1) return;
    coupons[couponIndex].usageCount += 1;
    await adminCouponStore.saveCoupons(coupons);
  },
};
