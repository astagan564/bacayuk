import type { Dispatch, SetStateAction } from 'react';
import type { QuickCreateForm } from '@/features/book-studio/types';

interface QuickCreateAudienceFieldsProps {
  form: QuickCreateForm;
  onFormChange: Dispatch<SetStateAction<QuickCreateForm>>;
}

const AGE_OPTIONS = [
  ['3-5', '3–5 tahun', 'Singkat & repetitif'],
  ['6-8', '6–8 tahun', 'Alur & dialog ringan'],
  ['9-12', '9–12 tahun', 'Cerita lebih kaya'],
] as const;

const LANGUAGE_OPTIONS = [
  ['id', 'Indonesia'],
  ['en', 'English'],
] as const;

export function QuickCreateAudienceFields({
  form,
  onFormChange,
}: QuickCreateAudienceFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1.35fr_0.65fr] gap-4">
      <fieldset>
        <legend className="mb-2 font-black text-xs">Untuk usia berapa?</legend>
        <div className="grid grid-cols-3 gap-2">
          {AGE_OPTIONS.map(([value, label, hint]) => (
            <button
              key={value}
              type="button"
              aria-pressed={form.targetAge === value}
              onClick={() => onFormChange({ ...form, targetAge: value })}
              className={`rounded-xl px-2.5 py-3 text-left transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--story-green)] ${form.targetAge === value ? 'bg-brand-green text-white shadow-sm' : 'reader-field hover:-translate-y-0.5'}`}
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
          {LANGUAGE_OPTIONS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={form.primaryLanguage === value}
              onClick={() => onFormChange({ ...form, primaryLanguage: value })}
              className={`rounded-lg px-2 py-3 text-[11px] font-black transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--story-green)] ${form.primaryLanguage === value ? 'bg-primary text-inverse shadow-sm' : 'hover:text-primary text-secondary'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
