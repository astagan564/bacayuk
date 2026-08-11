import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from 'react';
import { AlertCircle, Settings, Sparkles, X } from 'lucide-react';
import type { QuickCreateForm } from '@/features/book-studio/types';
import { QuickCreateAdvancedFields } from '@/features/book-studio/components/quick-create/QuickCreateAdvancedFields';
import { QuickCreateAudienceFields } from '@/features/book-studio/components/quick-create/QuickCreateAudienceFields';
import { QuickCreateBriefSection } from '@/features/book-studio/components/quick-create/QuickCreateBriefSection';
import { QuickCreateSubmitFooter } from '@/features/book-studio/components/quick-create/QuickCreateSubmitFooter';

export interface QuickCreateDialogProps {
  form: QuickCreateForm;
  errors: string[];
  pdfImport: { fileName: string; pageCount: number; characterCount: number } | null;
  pdfImportProgress: string | null;
  isExtractingPdf: boolean;
  isGenerating: boolean;
  showAdvanced: boolean;
  onFormChange: Dispatch<SetStateAction<QuickCreateForm>>;
  onAdvancedChange: Dispatch<SetStateAction<boolean>>;
  onPdfImport: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent) => void;
  onClose: () => void;
}

export function QuickCreateDialog({
  form,
  errors,
  pdfImport,
  pdfImportProgress,
  isExtractingPdf,
  isGenerating,
  showAdvanced,
  onFormChange,
  onAdvancedChange,
  onPdfImport,
  onSubmit,
  onClose,
}: QuickCreateDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-overlay)] backdrop-blur-md animate-fade-in overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-create-title"
        className="reader-modal w-full max-w-4xl rounded-[1.6rem] p-5 sm:p-7 relative my-auto flex flex-col gap-5 max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-start sm:items-center justify-between gap-3 pb-3 border-b reader-divider">
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-black text-brand-green dark:text-brand-green">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quick Create</span>
            </div>
            <h3 id="quick-create-title" className="text-xl sm:text-2xl font-black tracking-tight text-balance">
              Mulai dari satu ide
            </h3>
            <p className="mt-1.5 max-w-2xl text-xs leading-5 text-secondary">
              Ceritakan premisnya dengan bahasa biasa. BacaYuk akan menyusun naskah, karakter, halaman, dan arahan ilustrasinya.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-surface-hover transition-colors" aria-label="Tutup quick create">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 text-xs font-semibold">
          {errors.length > 0 && (
            <div role="alert" className="rounded-2xl border border-error bg-error/10 p-3 text-error dark:border-error dark:bg-error/40 dark:text-error">
              <div className="flex items-center gap-2 font-black mb-2">
                <AlertCircle className="w-4 h-4" />
                <span>Perlu dilengkapi dulu</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 font-semibold">
                {errors.map((error) => <li key={error}>{error}</li>)}
              </ul>
            </div>
          )}

          <QuickCreateBriefSection
            form={form}
            pdfImport={pdfImport}
            pdfImportProgress={pdfImportProgress}
            isExtractingPdf={isExtractingPdf}
            isGenerating={isGenerating}
            onFormChange={onFormChange}
            onPdfImport={onPdfImport}
          />
          <QuickCreateAudienceFields form={form} onFormChange={onFormChange} />

          <button
            type="button"
            aria-expanded={showAdvanced}
            onClick={() => onAdvancedChange((value) => !value)}
            className="reader-soft-panel rounded-xl px-3.5 py-3 flex items-center justify-between gap-3 text-left transition-transform active:scale-[0.99]"
          >
            <span className="flex items-center gap-2.5">
              <Settings className="h-4 w-4 text-brand-green" />
              <span>
                <span className="block text-xs font-black">Pengaturan tambahan</span>
                <span className="mt-0.5 block text-[10px] font-bold text-secondary">
                  Judul, pesan moral, karakter, panjang, dan gaya visual
                </span>
              </span>
            </span>
            <span className="rounded-lg bg-surface/70 px-2.5 py-1 text-[10px] font-black">
              {showAdvanced ? 'Tutup' : 'Atur'}
            </span>
          </button>

          {showAdvanced && <QuickCreateAdvancedFields form={form} onFormChange={onFormChange} />}
          <QuickCreateSubmitFooter isGenerating={isGenerating} isExtractingPdf={isExtractingPdf} />
        </form>
      </div>
    </div>
  );
}
