import { Check, RefreshCw, Sparkles } from 'lucide-react';

interface QuickCreateSubmitFooterProps {
  isGenerating: boolean;
  isExtractingPdf: boolean;
}

const GENERATED_ASSETS = [
  'Naskah & halaman',
  'Character bible',
  'Prompt ilustrasi',
  'Kuis kandidat',
] as const;

export function QuickCreateSubmitFooter({
  isGenerating,
  isExtractingPdf,
}: QuickCreateSubmitFooterProps) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-[10px] font-black text-secondary">
        {GENERATED_ASSETS.map((item) => (
          <span key={item} className="inline-flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-brand-green" />
            {item}
          </span>
        ))}
      </div>

      {isGenerating && (
        <div role="status" className="rounded-xl bg-brand-blue/10 px-3.5 py-3 text-[11px] font-bold text-info">
          Menyusun alur, mengunci desain karakter, lalu menyiapkan adegan setiap halaman…
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t reader-divider">
        <p className="text-[11px] leading-5 text-secondary">
          Draft tetap berstatus belum terbit. Setelah dibuat, kamu akan masuk ke editor untuk review dan koreksi.
        </p>
        <button
          type="submit"
          disabled={isGenerating || isExtractingPdf}
          className="btn-primary py-3 px-5 text-xs flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-60 disabled:cursor-wait"
        >
          {isGenerating || isExtractingPdf ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>{isGenerating ? 'Membuat buku…' : isExtractingPdf ? 'Membaca PDF…' : 'Buat buku'}</span>
        </button>
      </div>
    </>
  );
}
