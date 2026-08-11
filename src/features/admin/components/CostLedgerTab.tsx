import { ReceiptText } from 'lucide-react';
interface Row{storyId:string;title:string;aiCost:number;paymentFee:number;imageCount:number} interface Props{error:string|null;totalRevenue:number;totalAiCost:number;totalPaymentFee:number;netProfit:number;storyRows:Row[];onReload:()=>void}
export function CostLedgerTab({error:costLedgerError,totalRevenue,totalAiCost,totalPaymentFee,netProfit,storyRows:storyCostRows,onReload:loadCostEvents}:Props){return(
<div className="flex flex-col gap-6">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <div className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-black text-brand-green">
        <ReceiptText className="h-3.5 w-3.5" />
        Ledger server-side
      </div>
      <h3 className="text-xl">Biaya & margin buku</h3>
      <p className="mt-1 text-xs text-secondary">
        Biaya AI dicatat saat proses berhasil. Fee Midtrans tercatat ketika pembayaran terverifikasi sukses.
      </p>
    </div>
    <button onClick={loadCostEvents} className="btn-secondary px-3 py-2 text-xs" type="button">
      Muat ulang ledger
    </button>
  </div>

  {costLedgerError && (
    <div className="rounded-xl border border-warning bg-warning/10 p-3 text-xs font-semibold text-warning dark:border-warning dark:bg-warning/30 dark:text-warning">
      {costLedgerError}
    </div>
  )}

  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
    {[
      ['Pendapatan tercatat', totalRevenue, 'text-brand-green'],
      ['Biaya AI', totalAiCost, 'text-error'],
      ['Fee Midtrans', totalPaymentFee, 'text-warning'],
      ['Margin bersih', netProfit, netProfit >= 0 ? 'text-brand-green' : 'text-error'],
    ].map(([label, amount, color]) => (
      <div key={label as string} className="book-panel rounded-xl p-4">
        <p className="text-[11px] font-bold text-secondary">{label}</p>
        <p className={`mt-2 text-2xl font-black tabular-nums ${color}`}>Rp {(amount as number).toLocaleString('id-ID')}</p>
      </div>
    ))}
  </div>

  <div className="overflow-hidden rounded-2xl border border-default bg-surface">
    <div className="border-b border-default px-4 py-3">
      <h4 className="text-sm font-black">Biaya aktual per buku</h4>
      <p className="mt-0.5 text-[10px] text-secondary">Token yang dikembalikan Gemini dipakai untuk menghitung estimasi tagihan dalam Rupiah pada saat event dicatat.</p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-surface text-[10px] font-black text-secondary">
          <tr>
            <th className="p-3">Buku</th>
            <th className="p-3">Gambar</th>
            <th className="p-3">Biaya AI</th>
            <th className="p-3">Fee eksternal</th>
            <th className="p-3">Total biaya</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-default">
          {storyCostRows.map((row) => (
            <tr key={row.storyId}>
              <td className="p-3 font-bold">{row.title}</td>
              <td className="p-3 tabular-nums">{row.imageCount}</td>
              <td className="p-3 tabular-nums">Rp {row.aiCost.toLocaleString('id-ID')}</td>
              <td className="p-3 tabular-nums">Rp {row.paymentFee.toLocaleString('id-ID')}</td>
              <td className="p-3 font-black tabular-nums">Rp {(row.aiCost + row.paymentFee).toLocaleString('id-ID')}</td>
            </tr>
          ))}
          {storyCostRows.length === 0 && (
            <tr><td colSpan={5} className="p-8 text-center text-secondary">Belum ada biaya tercatat. Generate draft atau gambar buku untuk memulai ledger.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
</div>
);}

