import { Plus, Tag } from 'lucide-react';
import type { FormEvent } from 'react';
import type { DiscountCoupon } from '@/features/admin/types/adminStore';
import { CouponForm } from '@/features/admin/components/finance/CouponForm';
import { CouponList } from '@/features/admin/components/finance/CouponList';

interface CouponManagementProps {
  coupons: DiscountCoupon[];
  showForm: boolean;
  newCode: string;
  newType: DiscountCoupon['type'];
  newValue: number;
  onToggleForm: () => void;
  onCodeChange: (value: string) => void;
  onTypeChange: (value: DiscountCoupon['type']) => void;
  onValueChange: (value: number) => void;
  onCreateCoupon: (event: FormEvent) => void;
  onToggleCoupon: (code: string) => void;
  onDeleteCoupon: (code: string) => void;
}

export function CouponManagement({
  coupons,
  showForm,
  newCode,
  newType,
  newValue,
  onToggleForm,
  onCodeChange,
  onTypeChange,
  onValueChange,
  onCreateCoupon,
  onToggleCoupon,
  onDeleteCoupon,
}: CouponManagementProps) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-default bg-surface p-4" aria-labelledby="coupon-management-title">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 id="coupon-management-title" className="mb-1 flex items-center gap-2 font-sans text-base font-extrabold">
            <Tag className="h-4 w-4 text-warning" />
            <span>Kupon diskon</span>
          </h3>
          <p className="text-xs font-medium text-muted">Buat kode promo untuk pembelian buku dan langganan.</p>
        </div>
        <button
          type="button"
          onClick={onToggleForm}
          aria-expanded={showForm}
          aria-controls="coupon-create-form"
          className="btn-secondary flex shrink-0 items-center gap-1 px-3 py-1.5 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{showForm ? 'Batal' : 'Buat kupon'}</span>
        </button>
      </div>

      {showForm && (
        <div id="coupon-create-form">
          <CouponForm
            code={newCode}
            type={newType}
            value={newValue}
            onCodeChange={onCodeChange}
            onTypeChange={onTypeChange}
            onValueChange={onValueChange}
            onSubmit={onCreateCoupon}
          />
        </div>
      )}
      <CouponList coupons={coupons} onToggleCoupon={onToggleCoupon} onDeleteCoupon={onDeleteCoupon} />
    </section>
  );
}
