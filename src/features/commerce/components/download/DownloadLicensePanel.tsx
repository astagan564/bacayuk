import { Clock, RefreshCw } from 'lucide-react';
import type { PurchaseReceipt } from '@/utils/paymentStore';

interface DownloadLicensePanelProps {
  purchase: PurchaseReceipt | null;
  expired: boolean;
  downloadLimitReached: boolean;
  onRenewToken: () => void;
}

export function DownloadLicensePanel({
  purchase,
  expired,
  downloadLimitReached,
  onRenewToken,
}: DownloadLicensePanelProps) {
  return (
    <div className="p-3.5 rounded-xl bg-surface/50 border border-default text-xs flex flex-col gap-2">
      <div className="flex items-center justify-between font-extrabold text-primary">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-brand-gold" /> Masa berlaku link:
        </span>
        <span className={expired ? 'text-error' : 'text-success'}>
          {expired ? 'Kedaluwarsa (24 Jam)' : 'Aktif'}
        </span>
      </div>

      {purchase && (
        <div className="grid grid-cols-2 gap-2 text-[11px] text-secondary">
          <div>Pembeli: <strong>{purchase.customerName}</strong></div>
          <div>ID Order: <strong>#{purchase.transactionId}</strong></div>
          <div>
            Sisa Unduhan: <strong>{Math.max(0, 3 - purchase.downloadCount)} / 3 kali</strong>
          </div>
          <div>Watermark: <strong className="text-success">Aktif Pada File</strong></div>
        </div>
      )}

      {expired && (
        <button
          type="button"
          onClick={onRenewToken}
          disabled={purchase?.paymentMethod === 'vip'}
          className="mt-1 py-2 px-3 rounded-xl bg-brand-gold text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-transform hover:scale-[1.02]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Perbarui masa berlaku link</span>
        </button>
      )}

      {downloadLimitReached && (
        <div className="text-[11px] font-bold text-error">
          Batas unduh 3 kali sudah tercapai untuk token ini.
        </div>
      )}
    </div>
  );
}
