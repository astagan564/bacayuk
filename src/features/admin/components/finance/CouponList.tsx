import { Trash2 } from 'lucide-react';
import type { DiscountCoupon } from '@/features/admin/types/adminStore';

interface CouponListProps {
  coupons: DiscountCoupon[];
  onToggleCoupon: (code: string) => void;
  onDeleteCoupon: (code: string) => void;
}

export function CouponList({ coupons, onToggleCoupon, onDeleteCoupon }: CouponListProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {coupons.length === 0 && (
        <p className="col-span-full rounded-xl border border-dashed border-default p-4 text-center text-xs font-medium text-secondary">
          Belum ada kupon diskon.
        </p>
      )}
      {coupons.map((coupon) => (
        <div
          key={coupon.code}
          className={`flex items-center justify-between rounded-xl border p-3 text-xs shadow-sm ${
            coupon.isActive
              ? 'border-default bg-background'
              : 'border-default bg-surface opacity-60'
          }`}
        >
          <div>
            <div className="text-sm font-black text-primary">{coupon.code}</div>
            <div className="text-[11px] font-semibold text-secondary">
              Diskon {coupon.type === 'percent'
                ? `${coupon.value}%`
                : `Rp ${coupon.value.toLocaleString('id-ID')}`} • Terpakai {coupon.usageCount}x
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onToggleCoupon(coupon.code)}
              aria-pressed={coupon.isActive}
              className={`rounded-lg p-1.5 text-[10px] font-bold ${
                coupon.isActive
                  ? 'bg-brand-green/20 text-brand-green'
                  : 'bg-[var(--border-default)] text-primary'
              }`}
              aria-label={`${coupon.isActive ? 'Nonaktifkan' : 'Aktifkan'} kupon ${coupon.code}`}
            >
              {coupon.isActive ? 'Aktif' : 'Off'}
            </button>
            <button
              type="button"
              onClick={() => onDeleteCoupon(coupon.code)}
              className="rounded-lg bg-error/20 p-1.5 text-error transition-colors hover:bg-error/30"
              aria-label={`Hapus kupon ${coupon.code}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
