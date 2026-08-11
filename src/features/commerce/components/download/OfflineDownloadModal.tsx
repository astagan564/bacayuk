import { BookOpen, CheckCircle2, Download, ShieldCheck, Sparkles, X } from 'lucide-react';
import { DownloadFormatOptions } from '@/features/commerce/components/download/DownloadFormatOptions';
import { DownloadLicensePanel } from '@/features/commerce/components/download/DownloadLicensePanel';
import { useOfflineDownloadController } from '@/features/commerce/hooks/useOfflineDownloadController';
import type { OfflineDownloadModalProps } from '@/features/commerce/types/offlineDownload';

export function OfflineDownloadModal({ story, onClose }: OfflineDownloadModalProps) {
  const download = useOfflineDownloadController(story);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-overlay)] backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="offline-download-title"
        className="app-modal w-full max-w-lg rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col gap-5"
      >
        <div className="flex items-center justify-between pb-3 border-b border-default">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-brand-green text-white shadow-sm">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-success">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Lisensi unduhan aktif</span>
              </div>
              <h2 id="offline-download-title" className="text-xl sm:text-2xl mb-0 tracking-normal">
                Unduh versi offline
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface text-secondary transition-colors"
            title="Tutup Modal"
            aria-label="Tutup modal unduhan"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-surface border border-default shadow-sm flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${story.coverBg} flex items-center justify-center text-white shrink-0 shadow-md`}>
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-xs sm:text-sm truncate">{story.title}</h4>
            <span className="text-[11px] text-secondary">
              {story.pages.length} Halaman Cerita Bergambar
            </span>
          </div>
        </div>

        <DownloadLicensePanel
          purchase={download.purchase}
          expired={download.expired}
          downloadLimitReached={download.downloadLimitReached}
          onRenewToken={download.renewToken}
        />

        {download.downloadNotice && (
          <div className="p-3 rounded-xl bg-success/10 border border-success/30 text-success text-xs font-bold animate-fade-in flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-success" />
            <span>{download.downloadNotice}</span>
          </div>
        )}

        <DownloadFormatOptions
          activeFormat={download.activeFormat}
          disabled={download.expired || download.downloadLimitReached}
          onDownloadPdf={download.downloadPdf}
          onDownloadEpub={download.downloadEpub}
        />

        <div className="p-3 rounded-xl bg-surface border border-default text-secondary text-[11px] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-success shrink-0" />
          <span>
            <strong>Stempel Digital Watermark:</strong> Setiap halaman dicetak identitas pembeli ({download.purchase?.customerName}) untuk keamanan hak cipta.
          </span>
        </div>
      </div>
    </div>
  );
}
