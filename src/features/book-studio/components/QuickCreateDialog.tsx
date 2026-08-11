import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from 'react';
import { AlertCircle, Check, RefreshCw, Settings, Sparkles, Upload, X } from 'lucide-react';
import type { QuickCreateForm } from '../types';

interface QuickCreateDialogProps {
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
  <div className="reader-modal w-full max-w-4xl rounded-[1.6rem] p-5 sm:p-7 relative my-auto flex flex-col gap-5 max-h-[92vh] overflow-y-auto">
    <div className="flex items-start sm:items-center justify-between gap-3 pb-3 border-b reader-divider">
      <div>
        <div className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-black text-brand-green dark:text-brand-green">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Quick Create</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-balance">Mulai dari satu ide</h3>
        <p className="mt-1.5 max-w-2xl text-xs leading-5 text-secondary">
          Ceritakan premisnya dengan bahasa biasa. BacaYuk akan menyusun naskah, karakter, halaman, dan arahan ilustrasinya.
        </p>
      </div>
      <button
        onClick={onClose}
        className="p-2 rounded-full hover:bg-surface-hover transition-colors"
        type="button"
        aria-label="Tutup quick create"
      >
        <X className="w-5 h-5" />
      </button>
    </div>

    <form onSubmit={onSubmit} className="flex flex-col gap-4 text-xs font-semibold">
      {errors.length > 0 && (
        <div className="rounded-2xl border border-error bg-error/10 p-3 text-error dark:border-error dark:bg-error/40 dark:text-error">
          <div className="flex items-center gap-2 font-black mb-2">
            <AlertCircle className="w-4 h-4" />
            <span>Perlu dilengkapi dulu</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 font-semibold">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-[1.35rem] bg-brand-green/10 p-3 sm:p-4 ring-1 ring-brand-green/20">
        <label className="mb-2 flex items-center justify-between gap-3 font-black text-sm">
          <span>Ide cerita atau naskah</span>
          <span className="text-[10px] font-bold text-secondary">Wajib</span>
        </label>
        <textarea
          rows={7}
          value={form.brief}
          onChange={(e) => onFormChange({ ...form, brief: e.target.value })}
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
              <label className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-brand-green/30 bg-surface px-3 py-2 text-[11px] font-black text-brand-green transition-colors hover:bg-brand-green/10  ${
                isExtractingPdf || isGenerating ? 'pointer-events-none opacity-60' : 'cursor-pointer'
              }`}>
                {isExtractingPdf ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {isExtractingPdf ? 'Membaca PDF…' : 'Pilih PDF'}
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  onChange={onPdfImport}
                  disabled={isExtractingPdf || isGenerating}
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
        </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.35fr_0.65fr] gap-4">
        <fieldset>
          <legend className="mb-2 font-black text-xs">Untuk usia berapa?</legend>
          <div className="grid grid-cols-3 gap-2">
            {([
              ['3-5', '3–5 tahun', 'Singkat & repetitif'],
              ['6-8', '6–8 tahun', 'Alur & dialog ringan'],
              ['9-12', '9–12 tahun', 'Cerita lebih kaya'],
            ] as const).map(([value, label, hint]) => (
              <button
                key={value}
                type="button"
                aria-pressed={form.targetAge === value}
                onClick={() => onFormChange({ ...form, targetAge: value })}
                className={`rounded-xl px-2.5 py-3 text-left transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--story-green)] ${
                  form.targetAge === value
                    ? 'bg-brand-green text-white shadow-sm'
                    : 'reader-field hover:-translate-y-0.5'
                }`}
              >
                <span className="block text-xs font-black">{label}</span>
                <span className={`mt-1 block text-[9px] leading-4 ${form.targetAge === value ? 'text-white/80' : 'text-secondary'}`}>
                  {hint}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 font-black text-xs">Bahasa utama</legend>
          <div className="reader-field grid grid-cols-2 gap-1 rounded-xl p-1">
            {([
              ['id', 'Indonesia'],
              ['en', 'English'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={form.primaryLanguage === value}
                onClick={() => onFormChange({ ...form, primaryLanguage: value })}
                className={`rounded-lg px-2 py-3 text-[11px] font-black transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--story-green)] ${
                  form.primaryLanguage === value
                    ? 'bg-primary text-inverse shadow-sm'
                    : 'hover:text-primary text-secondary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

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

      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-[1.25rem] border border-default bg-surface p-3.5">
          <div>
            <label className="block font-bold mb-1">Judul <span className="font-semibold text-secondary">(opsional)</span></label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => onFormChange({ ...form, title: e.target.value })}
              className="reader-field w-full px-3 py-2.5 rounded-xl"
              placeholder="Biarkan AI memilih judul"
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Jumlah halaman</label>
            <select
              value={form.pageCount}
              onChange={(e) => onFormChange({ ...form, pageCount: Number(e.target.value) as QuickCreateForm['pageCount'] })}
              className="reader-field w-full px-3 py-2.5 rounded-xl"
            >
              <option value={8}>8 halaman — ringkas</option>
              <option value={10}>10 halaman — standar</option>
              <option value={12}>12 halaman — lebih lengkap</option>
            </select>
          </div>
          <div>
            <label className="block font-bold mb-1">Pesan yang ingin disampaikan</label>
            <input
              type="text"
              value={form.moralMessage}
              onChange={(e) => onFormChange({ ...form, moralMessage: e.target.value })}
              className="reader-field w-full px-3 py-2.5 rounded-xl"
              placeholder="Misalnya berani mencoba"
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Gaya ilustrasi</label>
            <select
              value={form.visualPreset}
              onChange={(e) => onFormChange({ ...form, visualPreset: e.target.value as QuickCreateForm['visualPreset'] })}
              className="reader-field w-full px-3 py-2.5 rounded-xl"
            >
              <option value="auto">Otomatis sesuai usia</option>
              <option value="soft-2d-cartoon">Soft 2D cartoon</option>
              <option value="colorful-storybook">Colorful storybook</option>
              <option value="stylized-adventure-cartoon">Stylized adventure</option>
            </select>
          </div>
          <div>
            <label className="block font-bold mb-1">Gambaran karakter</label>
            <textarea
              rows={3}
              value={form.characterHints}
              onChange={(e) => onFormChange({ ...form, characterHints: e.target.value })}
              className="reader-field w-full px-3 py-2.5 rounded-xl leading-5"
              placeholder="Nama, ciri fisik, pakaian, atau sifat"
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Konten yang dihindari</label>
            <textarea
              rows={3}
              value={form.tabooContent}
              onChange={(e) => onFormChange({ ...form, tabooContent: e.target.value })}
              className="reader-field w-full px-3 py-2.5 rounded-xl leading-5"
              placeholder="Pisahkan dengan koma, misalnya laba-laba, suasana gelap"
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-[10px] font-black text-secondary">
        {['Naskah & halaman', 'Character bible', 'Prompt ilustrasi', 'Kuis kandidat'].map((item) => (
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
          {isGenerating || isExtractingPdf ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>{isGenerating ? 'Membuat buku…' : isExtractingPdf ? 'Membaca PDF…' : 'Buat buku'}</span>
        </button>
      </div>
    </form>
  </div>
</div>
  );
}
