import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { RefreshCw, Upload } from 'lucide-react';
import type { QuickCreateForm } from '@/features/book-studio/types';

interface PdfImportSummary {
  fileName: string;
  pageCount: number;
  characterCount: number;
}

interface QuickCreateBriefSectionProps {
  form: QuickCreateForm;
  pdfImport: PdfImportSummary | null;
  pdfImportProgress: string | null;
  isExtractingPdf: boolean;
  isGenerating: boolean;
  onFormChange: Dispatch<SetStateAction<QuickCreateForm>>;
  onPdfImport: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function QuickCreateBriefSection({
  form,
  pdfImport,
  pdfImportProgress,
  isExtractingPdf,
  isGenerating,
  onFormChange,
  onPdfImport,
}: QuickCreateBriefSectionProps) {
  const isImportDisabled = isExtractingPdf || isGenerating;

  return (
    <section className="rounded-[1.35rem] bg-brand-green/10 p-3 sm:p-4 ring-1 ring-brand-green/20">
      <label htmlFor="quick-create-brief" className="mb-2 flex items-center justify-between gap-3 font-black text-sm">
        <span>Ide cerita atau naskah</span>
        <span className="text-[10px] font-bold text-secondary">Wajib</span>
      </label>
      <textarea
        id="quick-create-brief"
        rows={7}
        value={form.brief}
        onChange={(event) => onFormChange({ ...form, brief: event.target.value })}
        className="reader-field w-full px-4 py-3.5 rounded-xl leading-6 text-sm resize-y"
        placeholder="Contoh: Seekor kelinci kecil takut bercerita di depan kelas. Temannya membantu ia berlatih sampai berani mencoba."
        autoFocus
      />
      <p className="mt-2 text-[11px] leading-5 text-secondary">
        Satu atau dua kalimat sudah cukup. Kamu juga boleh menempel naskah lengkap.
      </p>

      <div className="mt-3 rounded-xl border border-dashed border-brand-green/35 bg-surface/50 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black">Atau impor dari PDF</p>
            <p className="mt-0.5 text-[10px] leading-4 text-secondary">
              Teks diekstrak di browser; PDF hasil scan dibaca dengan OCR AI per halaman. Hingga 400 MB.
            </p>
          </div>
          <label className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-brand-green/30 bg-surface px-3 py-2 text-[11px] font-black text-brand-green transition-colors hover:bg-brand-green/10 ${isImportDisabled ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}>
            {isExtractingPdf ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {isExtractingPdf ? 'Membaca PDF…' : 'Pilih PDF'}
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={onPdfImport}
              disabled={isImportDisabled}
            />
          </label>
        </div>

        {pdfImportProgress && (
          <p role="status" className="mt-2 text-[10px] font-bold text-info">
            {pdfImportProgress}
          </p>
        )}
        {pdfImport && (
          <p className="mt-2 text-[10px] font-bold text-brand-green dark:text-brand-green">
            {pdfImport.fileName} · {pdfImport.pageCount} halaman teks · {pdfImport.characterCount.toLocaleString('id-ID')} karakter siap direview.
          </p>
        )}
      </div>
    </section>
  );
}
