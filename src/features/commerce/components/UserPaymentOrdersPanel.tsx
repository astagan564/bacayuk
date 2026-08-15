import { Clock3, CreditCard, LoaderCircle, RefreshCw } from 'lucide-react';
import type { ManualPaymentOrder, ManualPaymentStatus } from '@/features/commerce/types/manualPayment';
import {
  getManualPaymentResumeLabel,
  isResumableManualPaymentStatus,
} from '@/features/commerce/utils/manualPaymentStatus';

interface UserPaymentOrdersPanelProps {
  orders: ManualPaymentOrder[];
  error: string | null;
  isLoading: boolean;
  onRefresh: () => void;
  onResume: (order: ManualPaymentOrder) => void;
}

const STATUS_LABELS: Record<ManualPaymentStatus, string> = {
  pending_payment: 'Menunggu pembayaran',
  pending_review: 'Menunggu verifikasi',
  paid: 'Lunas',
  rejected: 'Bukti ditolak',
  cancelled: 'Dibatalkan',
  failed: 'Gagal',
  expired: 'Kedaluwarsa',
};

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function UserPaymentOrdersPanel({
  orders,
  error,
  isLoading,
  onRefresh,
  onResume,
}: UserPaymentOrdersPanelProps) {
  return (
    <section className="rounded-3xl border-2 border-default bg-surface p-6 shadow-sm" aria-labelledby="user-payments-title">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="user-payments-title" className="flex items-center gap-2 text-lg font-black">
            <CreditCard className="h-5 w-5 text-brand-green" /> Pembayaran Saya
          </h2>
          <p className="mt-1 text-sm leading-6 opacity-70">Lanjutkan pembayaran atau periksa pesanan yang sedang diproses.</p>
        </div>
        <button type="button" onClick={onRefresh} disabled={isLoading} className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-xs disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Muat ulang
        </button>
      </div>

      {error && <div role="alert" className="mt-4 rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-xs font-semibold text-error">{error}</div>}
      {isLoading && orders.length === 0 && (
        <div className="mt-5 flex items-center justify-center gap-2 py-6 text-sm opacity-65"><LoaderCircle className="h-5 w-5 animate-spin" /> Memuat pembayaran…</div>
      )}
      {!isLoading && !error && orders.length === 0 && (
        <p className="mt-5 rounded-2xl border border-dashed border-default p-5 text-center text-sm opacity-65">Belum ada transaksi pembayaran pada akun ini.</p>
      )}

      {orders.length > 0 && (
        <div className="mt-5 grid gap-3">
          {orders.map((order) => {
            const canResume = isResumableManualPaymentStatus(order.status);
            return (
              <article key={order.orderId} className="rounded-2xl border border-default bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold">{order.storyTitle}</p>
                    <p className="mt-1 font-mono text-[10px] opacity-60">{order.orderId}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold ${order.status === 'paid' ? 'bg-brand-green/15 text-brand-green' : canResume ? 'bg-warning/20 text-warning' : 'bg-error/10 text-error'}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-default pt-3">
                  <div className="text-xs">
                    <p className="font-extrabold">Rp {order.amount.toLocaleString('id-ID')}</p>
                    <p className="mt-1 flex items-center gap-1 opacity-60"><Clock3 className="h-3.5 w-3.5" /> {formatDate(order.createdAt)}</p>
                  </div>
                  {canResume && (
                    <button type="button" onClick={() => onResume(order)} className="btn-primary px-4 py-2.5 text-xs">
                      {getManualPaymentResumeLabel(order.status)}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
