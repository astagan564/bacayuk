import type { LucideIcon } from 'lucide-react';
import { BookOpen, FileText, Printer, Tablet } from 'lucide-react';
import type { OfflineDownloadFormat } from '@/features/commerce/types/offlineDownload';

interface DownloadFormatCardProps {
  format: OfflineDownloadFormat;
  badge: string;
  title: string;
  description: string;
  icon: LucideIcon;
  isGenerating: boolean;
  disabled: boolean;
  onDownload: () => void;
}

function DownloadFormatCard({
  format,
  badge,
  title,
  description,
  icon: Icon,
  isGenerating,
  disabled,
  onDownload,
}: DownloadFormatCardProps) {
  const isPdf = format === 'pdf';
  const ButtonIcon = isPdf ? FileText : BookOpen;

  return (
    <div className="p-4 rounded-xl bg-surface border border-default shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl font-bold shrink-0 ${isPdf ? 'bg-error/10 text-error' : 'bg-brand-blue/10 text-brand-blue'}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${isPdf ? 'bg-brand-gold/15 text-brand-gold' : 'bg-brand-blue/15 text-brand-blue'}`}>
            {badge}
          </div>
          <h4 className="font-extrabold text-sm text-primary mt-0.5">{title}</h4>
          <p className="text-[11px] text-secondary leading-tight">{description}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onDownload}
        disabled={disabled}
        className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-white font-bold text-xs shadow-sm transition-transform hover:scale-[1.02] flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 ${isPdf ? 'bg-brand-rose hover:bg-brand-rose/90' : 'bg-brand-blue hover:bg-brand-blue/90'}`}
      >
        {isGenerating ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Menyiapkan {format.toUpperCase()}...</span>
          </>
        ) : (
          <>
            <ButtonIcon className="w-4 h-4" />
            <span>Unduh {format.toUpperCase()}</span>
          </>
        )}
      </button>
    </div>
  );
}

interface DownloadFormatOptionsProps {
  activeFormat: OfflineDownloadFormat | null;
  disabled: boolean;
  onDownloadPdf: () => void;
  onDownloadEpub: () => void;
}

export function DownloadFormatOptions({
  activeFormat,
  disabled,
  onDownloadPdf,
  onDownloadEpub,
}: DownloadFormatOptionsProps) {
  const isBusy = activeFormat !== null;

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-bold text-secondary">Pilih format file</span>
      <DownloadFormatCard
        format="pdf"
        badge="Rekomendasi cetak"
        title="Format PDF (Printable Book)"
        description="Cocok dicetak di kertas HVS/Karton agar anak bisa membaca buku fisik tanpa layar."
        icon={Printer}
        isGenerating={activeFormat === 'pdf'}
        disabled={disabled || isBusy}
        onDownload={onDownloadPdf}
      />
      <DownloadFormatCard
        format="epub"
        badge="Untuk tablet"
        title="Format EPUB (E-Book)"
        description="Disimpan di Apple Books / Google Play Books untuk dibaca saat bepergian tanpa internet."
        icon={Tablet}
        isGenerating={activeFormat === 'epub'}
        disabled={disabled || isBusy}
        onDownload={onDownloadEpub}
      />
    </div>
  );
}
