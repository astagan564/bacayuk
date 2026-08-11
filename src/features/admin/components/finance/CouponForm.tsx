import type { FormEvent } from 'react';
import type { DiscountCoupon } from '@/features/admin/types/adminStore';

interface CouponFormProps {
  code: string;
  type: DiscountCoupon['type'];
  value: number;
  onCodeChange: (value: string) => void;
  onTypeChange: (value: DiscountCoupon['type']) => void;
  onValueChange: (value: number) => void;
  onSubmit: (event: FormEvent) => void;
}

export function CouponForm({
  code,
  type,
  value,
  onCodeChange,
  onTypeChange,
  onValueChange,
  onSubmit,
}: CouponFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col items-end gap-3 rounded-xl border border-default bg-surface p-3 text-xs animate-fade-in sm:flex-row"
    >
      <div className="w-full flex-1">
        <label className="mb-1 block font-bold" htmlFor="coupon-code">Kode kupon</label>
        <input
          id="coupon-code"
          type="text"
          value={code}
          onChange={(event) => onCodeChange(event.target.value)}
          placeholder="Contoh: BUKUANAK20"
          className="w-full rounded-lg border border-default bg-background px-3 py-2 font-bold uppercase"
          required
        />
      </div>
      <div className="w-full sm:w-36">
        <label className="mb-1 block font-bold" htmlFor="coupon-type">Jenis diskon</label>
        <select
          id="coupon-type"
          value={type}
          onChange={(event) => onTypeChange(event.target.value as DiscountCoupon['type'])}
          className="w-full rounded-lg border border-default bg-background px-3 py-2 font-bold"
        >
          <option value="percent">Persentase (%)</option>
          <option value="fixed">Potongan (Rp)</option>
        </select>
      </div>
      <div className="w-full sm:w-32">
        <label className="mb-1 block font-bold" htmlFor="coupon-value">Nilai diskon</label>
        <input
          id="coupon-value"
          type="number"
          min={1}
          max={type === 'percent' ? 100 : undefined}
          value={value}
          onChange={(event) => onValueChange(Number(event.target.value))}
          className="w-full rounded-lg border border-default bg-background px-3 py-2 font-bold"
          required
        />
      </div>
      <button type="submit" className="w-full rounded-lg bg-brand-green px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-green/80 sm:w-auto">
        Simpan Kupon
      </button>
    </form>
  );
}
