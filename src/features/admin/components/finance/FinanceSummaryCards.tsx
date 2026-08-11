import { Clock, DollarSign, TrendingUp } from 'lucide-react';

interface FinanceSummaryCardsProps {
  totalRevenue: number;
  successfulTransactionCount: number;
  pendingTransactionCount: number;
  totalTransactionCount: number;
}

export function FinanceSummaryCards({
  totalRevenue,
  successfulTransactionCount,
  pendingTransactionCount,
  totalTransactionCount,
}: FinanceSummaryCardsProps) {
  const conversionRate = totalTransactionCount > 0
    ? Math.round((successfulTransactionCount / totalTransactionCount) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="book-panel flex flex-col justify-between gap-2 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs font-bold text-secondary">
          <span>Total pendapatan</span>
          <DollarSign className="h-5 w-5 text-brand-green" />
        </div>
        <div className="text-2xl font-extrabold tabular-nums sm:text-3xl">
          Rp {totalRevenue.toLocaleString('id-ID')}
        </div>
        <div className="text-[11px] font-medium text-secondary">
          Dari {successfulTransactionCount} transaksi berhasil
        </div>
      </div>

      <div className="book-panel flex flex-col justify-between gap-2 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs font-bold text-secondary">
          <span>Menunggu pembayaran</span>
          <Clock className="h-5 w-5 text-warning" />
        </div>
        <div className="text-2xl font-extrabold tabular-nums sm:text-3xl">
          {pendingTransactionCount} transaksi
        </div>
        <div className="text-[11px] font-medium text-secondary">Belum selesai dibayar</div>
      </div>

      <div className="book-panel flex flex-col justify-between gap-2 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs font-bold text-secondary">
          <span>Konversi pesanan</span>
          <TrendingUp className="h-5 w-5 text-brand-blue" />
        </div>
        <div className="text-2xl font-extrabold tabular-nums sm:text-3xl">{conversionRate}%</div>
        <div className="text-[11px] font-medium text-secondary">
          {successfulTransactionCount} dari {totalTransactionCount} total pesanan
        </div>
      </div>
    </div>
  );
}
