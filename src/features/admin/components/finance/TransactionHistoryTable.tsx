import { CreditCard } from 'lucide-react';
import type { TransactionRecord } from '@/features/admin/types/adminStore';

interface TransactionHistoryTableProps {
  transactions: TransactionRecord[];
  onUpdateStatus: (id: string, status: TransactionRecord['status']) => void;
}

function TransactionStatusBadge({ status }: Pick<TransactionRecord, 'status'>) {
  if (status === 'success') {
    return <span className="rounded-md bg-brand-green/15 px-2 py-0.5 text-[10px] font-bold text-brand-green">Berhasil</span>;
  }
  if (status === 'pending') {
    return <span className="rounded-md bg-warning/20 px-2 py-0.5 text-[10px] font-bold text-warning dark:text-warning">Menunggu</span>;
  }
  return <span className="rounded-md bg-error/15 px-2 py-0.5 text-[10px] font-bold text-error">Kedaluwarsa</span>;
}

export function TransactionHistoryTable({
  transactions,
  onUpdateStatus,
}: TransactionHistoryTableProps) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="transaction-history-title">
      <h3 id="transaction-history-title" className="mb-1 flex items-center gap-2 font-sans text-base font-extrabold">
        <CreditCard className="h-4 w-4 text-warning" />
        <span>Riwayat Transaksi Penagihan (Midtrans Log)</span>
      </h3>
      <div className="overflow-hidden rounded-2xl border border-default bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface text-[10px] font-bold text-secondary">
              <tr>
                <th className="p-3">ID Transaksi</th>
                <th className="p-3">Pembeli</th>
                <th className="p-3">Buku Cerita</th>
                <th className="p-3">Metode</th>
                <th className="p-3">Jumlah (Rp)</th>
                <th className="p-3">Status</th>
                <th className="p-3">Aksi Simulasi Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default font-medium">
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-secondary">Belum ada transaksi penagihan.</td>
                </tr>
              )}
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="transition-colors hover:bg-surface-hover">
                  <td className="p-3 font-mono font-bold text-primary">{transaction.id}</td>
                  <td className="p-3">
                    <div className="font-bold">{transaction.customerName}</div>
                    <div className="text-[10px] text-muted">{transaction.customerEmail}</div>
                  </td>
                  <td className="p-3 font-semibold text-primary">{transaction.storyTitle}</td>
                  <td className="p-3 text-[10px] font-bold uppercase">{transaction.paymentMethod}</td>
                  <td className="p-3 font-bold text-primary">Rp {transaction.amount.toLocaleString('id-ID')}</td>
                  <td className="p-3"><TransactionStatusBadge status={transaction.status} /></td>
                  <td className="p-3">
                    {transaction.status === 'pending' && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(transaction.id, 'success')}
                          className="rounded bg-brand-green px-2 py-1 text-[10px] font-bold text-white hover:bg-brand-green"
                          aria-label={`Tandai transaksi ${transaction.id} sudah dibayar`}
                        >
                          Bayar
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(transaction.id, 'expired')}
                          className="rounded bg-error px-2 py-1 text-[10px] font-bold text-white hover:bg-error"
                          aria-label={`Tandai transaksi ${transaction.id} kedaluwarsa`}
                        >
                          Expired
                        </button>
                      </div>
                    )}
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
