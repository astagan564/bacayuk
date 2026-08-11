import type { Dispatch, SetStateAction } from 'react';
import type { Story } from '@/types';

interface GlossaryReviewSectionProps {
  story: Story;
  isGenerating: boolean;
  onStoryChange: Dispatch<SetStateAction<Story | null>>;
  onGenerate: () => Promise<void>;
  onRefresh: () => void;
}

export function GlossaryReviewSection({
  story,
  isGenerating,
  onStoryChange,
  onGenerate,
  onRefresh,
}: GlossaryReviewSectionProps) {
  const glossary = story.glossary || [];

  return (
    <section className="reader-soft-panel rounded-2xl p-3.5 flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="font-black text-xs text-secondary">Glosarium terdeteksi — {glossary.length} kata</span>
          <p className="mt-1 text-[11px] leading-5 text-secondary">
            Approve kata yang layak masuk kamus sentuh. Kata yang dihapus tidak ikut tersimpan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onGenerate} disabled={isGenerating} className="rounded-xl bg-brand-green/12 px-3 py-2 text-[11px] font-black text-brand-green disabled:opacity-50 dark:text-brand-green">
            {isGenerating ? 'Generating...' : 'Generate AI'}
          </button>
          <button type="button" onClick={onRefresh} className="rounded-xl bg-brand-blue/12 px-3 py-2 text-[11px] font-black text-info">
            Generate ulang
          </button>
          <button type="button" onClick={() => onStoryChange({ ...story, glossary: [] })} className="rounded-xl bg-error/10 px-3 py-2 text-[11px] font-black text-error">
            Kosongkan
          </button>
        </div>
      </div>
      {glossary.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {glossary.map((item) => (
            <label key={item.id} className="reader-field rounded-xl p-2.5 flex items-center gap-2 text-[11px] cursor-pointer">
              <input
                type="checkbox"
                checked
                onChange={() => onStoryChange({ ...story, glossary: glossary.filter((entry) => entry.id !== item.id) })}
              />
              <span className="text-base leading-none">{item.emoji || '•'}</span>
              <span className="min-w-0">
                <span className="block font-black truncate">{item.wordEn}</span>
                <span className="block text-secondary truncate">{item.translationId}</span>
              </span>
            </label>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-default p-4 text-center text-[11px] font-bold text-secondary">
          Belum ada kandidat glosarium. Klik Generate ulang setelah teks halaman siap.
        </div>
      )}
    </section>
  );
}
