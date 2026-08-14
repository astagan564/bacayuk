import { useState } from 'react';
import { CheckCircle2, CreditCard, ExternalLink, RefreshCw, XCircle } from 'lucide-react';
import type { AdminManualPaymentOrder } from '@/features/admin/types/manualPayment';

interface Props {
  transactions: AdminManualPaymentOrder[];
  error: string | null;
  isLoading: boolean;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, note: string) => Promise<void>;
  onRefresh: () => void;
}
const STATUS_LABELS: Record<AdminManualPaymentOrder['status'], string> = {
  pending_payment: 'Menunggu pembayaran',
  pending_review: 'Perlu diverifikasi',
  paid: 'Lunas',
  rejected: 'Bukti ditolak',
  cancelled: 'Dibatalkan',
  failed: 'Gagal',
  expired: 'Kedaluwarsa',
};

function StatusBadge({ status }: Pick<AdminManualPaymentOrder, 'status'>) {
  const tone = status === 'paid'
    ? 'bg-brand-green/15 text-brand-green'
    : status === 'pending_review'
      ? 'bg-warning/20 text-warning'
      : status === 'pending_payment'
        ? 'bg-brand-blue/15 text-brand-blue'
        : 'bg-error/15 text-error';
  return <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${tone}`}>{STATUS_LABELS[status]}</span>;
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function TransactionHistoryTable({
  transactions,
  error,
  isLoading,
  onApprove,
  onReject,
  onRefresh,
}: Props) {
  const [actionOrderId, setActionOrderId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const approve = async (order: AdminManualPaymentOrder) => {
    if (!window.confirm(`Pastikan dana Rp ${order.amount.toLocaleString('id-ID')} sudah masuk. Setujui ${order.orderId}?`)) return;
    setActionOrderId(order.orderId);
    setActionError(null);
    try {
      await onApprove(order.orderId);
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : 'Pesanan belum dapat disetujui.');
    } finally {
      setActionOrderId(null);
    }
  };

  const reject = async (order: AdminManualPaymentOrder) => {
    const note = window.prompt('Tuliskan alasan penolakan yang akan dilihat pembeli:');
    if (!note?.trim()) return;
    setActionOrderId(order.orderId);
    setActionError(null);
    try {
      await onReject(order.orderId, note.trim());
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : 'Pesanan belum dapat ditolak.');
    } finally {
      setActionOrderId(null);
    }
  };

  return (
    <section className="flex flex-col gap-3" aria-labelledby="transaction-history-title">
      <div className="flex items-center justify-between gap-3">
        <h3 id="transaction-history-title" className="mb-1 flex items-center gap-2 font-sans text-base font-extrabold">
          <CreditCard className="h-4 w-4 text-warning" />
          <span>Verifikasi pembayaran manual</span>
        </h3>
        <button type="button" onClick={onRefresh} disabled={isLoading} className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-xs disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Muat ulang
        </button>
      </div>

      {(error || actionError) && (
        <div role="alert" className="rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-xs font-semibold text-error">
          {actionError || error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-default bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-xs">
            <thead className="bg-surface text-[10px] font-bold text-secondary">
              <tr>
                <th className="p-3">Pesanan</th>
                <th className="p-3">Pembeli</th>
                <th className="p-3">Produk</th>
                <th className="p-3">Jumlah</th>
                <th className="p-3">Bukti</th>
                <th className="p-3">Status</th>
                <th className="p-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default font-medium">
              {!isLoading && transactions.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-secondary">Belum ada pesanan pembayaran manual.</td></tr>
              )}
              {transactions.map((transaction) => (
                <tr key={transaction.orderId} className="align-top transition-colors hover:bg-surface-hover">
                  <td className="p-3">
                    <div className="font-mono font-bold text-primary">{transaction.orderId}</div>
                    <div className="mt-1 text-[10px] text-muted">{formatDate(transaction.createdAt)}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-bold">{transaction.customerName}</div>
                    <div className="text-[10px] text-muted">{transaction.customerEmail}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-primary">{transaction.storyTitle}</div>
                    <div className="mt-1 text-[10px] font-bold uppercase text-secondary">{transaction.purchaseType === 'vip' ? 'VIP 1 bulan' : 'Buku'}</div>
                  </td>
                  <td className="p-3 font-bold text-primary">Rp {transaction.amount.toLocaleString('id-ID')}</td>
                  <td className="p-3">
                    {transaction.proofUrl ? (
                      <a href={transaction.proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-brand-blue hover:underline">
                        Lihat bukti <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : <span className="text-muted">Belum dikirim</span>}
                    {transaction.payerNote && <p className="mt-2 max-w-48 text-[10px] text-secondary">{transaction.payerNote}</p>}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={transaction.status} />
                    {transaction.reviewNote && <p className="mt-2 max-w-48 text-[10px] text-error">{transaction.reviewNote}</p>}
                  </td>
                  <td className="p-3">
                    {transaction.status === 'pending_review' ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => void approve(transaction)}
                          disabled={actionOrderId === transaction.orderId}
                          className="inline-flex items-center gap-1 rounded-lg bg-brand-green px-2.5 py-1.5 text-[10px] font-bold text-white disabled:opacity-60"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Setujui
                        </button>
                        <button
                          type="button"
                          onClick={() => void reject(transaction)}
                          disabled={actionOrderId === transaction.orderId}
                          className="inline-flex items-center gap-1 rounded-lg bg-error px-2.5 py-1.5 text-[10px] font-bold text-white disabled:opacity-60"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Tolak
                        </button>
                      </div>
                    ) : <span className="text-[10px] text-muted">Tidak ada aksi</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
