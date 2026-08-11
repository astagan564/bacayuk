import type { FormEvent } from 'react';
import type { DiscountCoupon, TransactionRecord } from '@/utils/adminStore';
import { Clock, CreditCard, DollarSign, Plus, Tag, Trash2, TrendingUp } from 'lucide-react';
interface Props { totalRevenue:number; successfulTransactions:TransactionRecord[]; pendingTransactions:TransactionRecord[]; transactions:TransactionRecord[]; coupons:DiscountCoupon[]; showCouponForm:boolean; newCouponCode:string; newCouponType:'percent'|'fixed'; newCouponValue:number; onToggleCouponForm:()=>void; onCouponCodeChange:(v:string)=>void; onCouponTypeChange:(v:'percent'|'fixed')=>void; onCouponValueChange:(v:number)=>void; onCreateCoupon:(e:FormEvent)=>void; onToggleCoupon:(c:string)=>void; onDeleteCoupon:(c:string)=>void; onUpdateTransactionStatus:(id:string,s:'success'|'pending'|'expired')=>void; }
export function FinanceTab(p:Props){const{totalRevenue,successfulTransactions:successTrxs,pendingTransactions:pendingTrxs,transactions,coupons,showCouponForm,newCouponCode,newCouponType,newCouponValue,onToggleCouponForm,onCouponCodeChange,onCouponTypeChange,onCouponValueChange,onCreateCoupon:handleCreateCoupon,onToggleCoupon:handleToggleCoupon,onDeleteCoupon:handleDeleteCoupon,onUpdateTransactionStatus:handleUpdateTrxStatus}=p;return(
<div className="flex flex-col gap-6">
  {/* Financial Summary Cards */}
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <div className="book-panel p-4 rounded-xl flex flex-col justify-between gap-2">
      <div className="flex items-center justify-between text-secondary text-xs font-bold">
        <span>Total pendapatan</span>
        <DollarSign className="w-5 h-5 text-brand-green" />
      </div>
      <div className="text-2xl sm:text-3xl font-extrabold tabular-nums">
        Rp {totalRevenue.toLocaleString('id-ID')}
      </div>
      <div className="text-[11px] text-secondary font-medium">
        Dari {successTrxs.length} transaksi berhasil
      </div>
    </div>

    <div className="book-panel p-4 rounded-xl flex flex-col justify-between gap-2">
      <div className="flex items-center justify-between text-secondary text-xs font-bold">
        <span>Menunggu pembayaran</span>
        <Clock className="w-5 h-5 text-warning" />
      </div>
      <div className="text-2xl sm:text-3xl font-extrabold tabular-nums">
        {pendingTrxs.length} transaksi
      </div>
      <div className="text-[11px] text-secondary font-medium">
        Belum selesai dibayar
      </div>
    </div>

    <div className="book-panel p-4 rounded-xl flex flex-col justify-between gap-2">
      <div className="flex items-center justify-between text-secondary text-xs font-bold">
        <span>Konversi pesanan</span>
        <TrendingUp className="w-5 h-5 text-brand-blue" />
      </div>
      <div className="text-2xl sm:text-3xl font-extrabold tabular-nums">
        {transactions.length > 0
          ? Math.round((successTrxs.length / transactions.length) * 100)
          : 0}
        %
      </div>
      <div className="text-[11px] text-secondary font-medium">
        {successTrxs.length} dari {transactions.length} total pesanan
      </div>
    </div>
  </div>

  {/* Coupons Section */}
  <div className="p-4 rounded-xl border border-default bg-surface flex flex-col gap-4">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h3 className="text-base font-extrabold font-sans mb-1 flex items-center gap-2">
          <Tag className="w-4 h-4 text-warning" />
          <span>Kupon diskon</span>
        </h3>
        <p className="text-xs text-muted font-medium">
          Buat kode promo untuk pembelian buku dan langganan.
        </p>
      </div>

      <button
        onClick={() => onToggleCouponForm()}
        className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 shrink-0"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>{showCouponForm ? 'Batal' : 'Buat kupon'}</span>
      </button>
    </div>

    {/* Create Coupon Form */}
    {showCouponForm && (
      <form
        onSubmit={handleCreateCoupon}
        className="p-3 rounded-xl bg-surface border border-default flex flex-col sm:flex-row items-end gap-3 animate-fade-in text-xs"
      >
        <div className="flex-1 w-full">
          <label className="font-bold block mb-1">Kode kupon</label>
          <input
            type="text"
            value={newCouponCode}
            onChange={(e) => onCouponCodeChange(e.target.value)}
            placeholder="Contoh: BUKUANAK20"
            className="w-full px-3 py-2 rounded-lg border border-default bg-background font-bold uppercase"
            required
          />
        </div>

        <div className="w-full sm:w-36">
          <label className="font-bold block mb-1">Jenis Diskon</label>
          <select
            value={newCouponType}
            onChange={(e) => onCouponTypeChange(e.target.value as 'percent' | 'fixed')}
            className="w-full px-3 py-2 rounded-lg border border-default bg-background font-bold"
          >
            <option value="percent">Persentase (%)</option>
            <option value="fixed">Potongan (Rp)</option>
          </select>
        </div>

        <div className="w-full sm:w-32">
          <label className="font-bold block mb-1">Nilai Diskon</label>
          <input
            type="number"
            value={newCouponValue}
            onChange={(e) => onCouponValueChange(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-default bg-background font-bold"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto py-2 px-4 rounded-lg bg-brand-green hover:bg-brand-green/80 text-white font-bold text-xs shadow-sm"
        >
          Simpan Kupon
        </button>
      </form>
    )}

    {/* Coupons List */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {coupons.map((c) => (
        <div
          key={c.code}
          className={`p-3 rounded-xl border flex items-center justify-between text-xs shadow-sm ${
            c.isActive
              ? 'bg-background border-default'
              : 'bg-surface border-default opacity-60'
          }`}
        >
          <div>
            <div className="font-black text-sm text-primary">
              {c.code}
            </div>
            <div className="text-[11px] font-semibold text-secondary">
              Diskon {c.type === 'percent' ? `${c.value}%` : `Rp ${c.value.toLocaleString('id-ID')}`} • Terpakai {c.usageCount}x
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleToggleCoupon(c.code)}
              className={`p-1.5 rounded-lg text-[10px] font-bold ${
                c.isActive ? 'bg-brand-green/20 text-brand-green' : 'bg-[var(--border-default)] text-primary'
              }`}
              title="Aktifkan/Nonaktifkan Kupon"
            >
              {c.isActive ? 'Aktif' : 'Off'}
            </button>

            <button
              onClick={() => handleDeleteCoupon(c.code)}
              className="p-1.5 rounded-lg bg-error/20 text-error hover:bg-error/30 transition-colors"
              title="Hapus Kupon"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>

  {/* Transactions Log Table */}
  <div className="flex flex-col gap-3">
    <h3 className="text-base font-extrabold font-sans mb-1 flex items-center gap-2">
      <CreditCard className="w-4 h-4 text-warning" />
      <span>Riwayat Transaksi Penagihan (Midtrans Log)</span>
    </h3>

    <div className="rounded-2xl border border-default overflow-hidden bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface text-secondary font-bold text-[10px]">
            <tr>
              <th className="p-3">ID Transaksi</th>
              <th className="p-3">Pembeli</th>
              <th className="p-3">Buku Cerita</th>
              <th className="p-3">Metode</th>
              <th className="p-3">Jumlah (Rp)</th>
              <th className="p-3">Status</th>
              <th className="p-3">Aksi Simu Admin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-default font-medium">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-surface-hover transition-colors">
                <td className="p-3 font-mono font-bold text-primary">{t.id}</td>
                <td className="p-3">
                  <div className="font-bold">{t.customerName}</div>
                  <div className="text-[10px] text-muted">{t.customerEmail}</div>
                </td>
                <td className="p-3 font-semibold text-primary">{t.storyTitle}</td>
                <td className="p-3 uppercase font-bold text-[10px]">{t.paymentMethod}</td>
                <td className="p-3 font-bold text-primary">
                  Rp {t.amount.toLocaleString('id-ID')}
                </td>
                <td className="p-3">
                  {t.status === 'success' && (
                    <span className="px-2 py-0.5 rounded-md bg-brand-green/15 text-brand-green font-bold text-[10px]">
                      Berhasil
                    </span>
                  )}
                  {t.status === 'pending' && (
                    <span className="px-2 py-0.5 rounded-md bg-warning/20 text-warning dark:text-warning font-bold text-[10px]">
                      Menunggu
                    </span>
                  )}
                  {t.status === 'expired' && (
                    <span className="px-2 py-0.5 rounded-md bg-error/15 text-error font-bold text-[10px]">
                      ❌ EXPIRED
                    </span>
                  )}
                </td>
                <td className="p-3">
                  {t.status === 'pending' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleUpdateTrxStatus(t.id, 'success')}
                        className="px-2 py-1 rounded bg-brand-green hover:bg-brand-green text-white font-bold text-[10px]"
                        title="Tandai Sudah Bayar (Lunas)"
                      >
                        Bayar
                      </button>
                      <button
                        onClick={() => handleUpdateTrxStatus(t.id, 'expired')}
                        className="px-2 py-1 rounded bg-error hover:bg-error text-white font-bold text-[10px]"
                        title="Tandai Kedaluwarsa"
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
  </div>
</div>
);}

