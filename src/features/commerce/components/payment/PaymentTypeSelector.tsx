import { BookOpen, Sparkles } from 'lucide-react';
import type { Story } from '@/types';
import type { PurchaseType } from '@/features/commerce/types/paymentGateway';

interface PaymentTypeSelectorProps {
  controller: {
    story?: Story;
    isVipOnly: boolean;
    isProcessing: boolean;
    purchaseType: PurchaseType;
    basePrice: number;
    vipPrice: number;
    selectPurchaseType: (purchaseType: PurchaseType) => void;
  };
}

export function PaymentTypeSelector({ controller }: PaymentTypeSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {!controller.isVipOnly && (
        <button
          type="button"
          disabled={controller.isProcessing}
          onClick={() => controller.selectPurchaseType('book')}
          aria-pressed={controller.purchaseType === 'book'}
          className={`rounded-xl border p-4 text-left transition-all disabled:opacity-60 ${
            controller.purchaseType === 'book'
              ? 'border-brand-green bg-brand-green/10'
              : 'border-default bg-surface/50 hover:bg-surface'
          }`}
        >
          <BookOpen className="mb-3 w-5 h-5 text-brand-green" />
          <p className="text-sm font-extrabold">Beli satu buku</p>
          <p className="mt-1 text-xs leading-5 text-secondary">{controller.story?.title}</p>
          <p className="mt-3 text-lg font-extrabold tabular-nums">
            Rp {controller.basePrice.toLocaleString('id-ID')}
          </p>
        </button>
      )}

      <button
        type="button"
        disabled={controller.isProcessing}
        onClick={() => controller.selectPurchaseType('vip')}
        aria-pressed={controller.purchaseType === 'vip'}
        className={`rounded-xl border p-4 text-left transition-all disabled:opacity-60 ${
          controller.purchaseType === 'vip'
            ? 'border-brand-blue bg-brand-blue/10'
            : 'border-default bg-surface/50 hover:bg-surface'
        }`}
      >
        <Sparkles className="mb-3 w-5 h-5 text-brand-blue" />
        <p className="text-sm font-extrabold">Langganan keluarga</p>
        <p className="mt-1 text-xs leading-5 text-secondary">
          Unduh semua buku. Fitur membuat cerita AI segera hadir.
        </p>
        <p className="mt-3 text-lg font-extrabold tabular-nums">
          Rp {controller.vipPrice.toLocaleString('id-ID')}
        </p>
      </button>
    </div>
  );
}
