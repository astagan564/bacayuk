import type { Dispatch, SetStateAction } from 'react';
import type { Story, StoryPage } from '@/types';
import { createBlankPage } from '@/features/book-studio/helpers/storyDraft';
import { Languages } from 'lucide-react';

interface BilingualPagesEditorProps {
  story: Story;
  previewPageIndex: number;
  onStoryChange: Dispatch<SetStateAction<Story | null>>;
  onPreviewPageChange: Dispatch<SetStateAction<number>>;
}

export function BilingualPagesEditor({
  story,
  previewPageIndex,
  onStoryChange,
  onPreviewPageChange,
}: BilingualPagesEditorProps) {
  return (
    <>
      {/* --- 1. MANAJEMEN HALAMAN BILINGUAL (TEKS GANDA INDONESIA ⇄ INGGRIS) --- */}
      <div className="reader-soft-panel p-3.5 rounded-2xl flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="font-black text-xs uppercase text-brand-blue dark:text-brand-blue flex items-center gap-1.5">
            <Languages className="w-4 h-4 text-brand-blue shrink-0" />
            <span>Teks dua bahasa</span>
          </span>
          <span className="text-[10px] bg-brand-blue text-brand-blue font-bold px-2 py-0.5 rounded-full">
            {story.pages.length} Halaman
          </span>
          <button
            type="button"
            onClick={() => {
              const nextPage = createBlankPage(story.pages.length + 1);
              onStoryChange({ ...story, pages: [...story.pages, nextPage] });
              onPreviewPageChange(story.pages.length);
            }}
            className="px-2.5 py-1 rounded-lg bg-brand-blue hover:bg-brand-blue text-white font-bold text-[11px]"
          >
            + Tambah Halaman
          </button>
        </div>

        <div className="flex flex-col gap-3 max-h-[28rem] overflow-y-auto pr-1">
          {story.pages.map((pg, idx) => (
            <div
              key={idx}
              className="reader-soft-panel p-3 rounded-xl flex flex-col gap-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onPreviewPageChange(idx)}
                  className={`text-left font-extrabold text-xs ${
                    previewPageIndex === idx ? 'text-brand-green' : 'text-brand-blue dark:text-brand-blue'
                  }`}
                >
                  Halaman {idx + 1}
                </button>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const newPages = [...story.pages];
                      const copy = {
                        ...pg,
                        pageNumber: idx + 2,
                        title: `${pg.title || `Halaman ${idx + 1}`} (salinan)`,
                      };
                      newPages.splice(idx + 1, 0, copy);
                      onStoryChange({ ...story, pages: newPages });
                      onPreviewPageChange(idx + 1);
                    }}
                    className="px-2 py-1 rounded-lg bg-card text-[10px] font-bold"
                  >
                    Duplikat
                  </button>
                  <button
                    type="button"
                    disabled={story.pages.length <= 1}
                    onClick={() => {
                      const newPages = story.pages.filter((_, pageIdx) => pageIdx !== idx);
                      onStoryChange({ ...story, pages: newPages });
                      onPreviewPageChange(Math.max(0, Math.min(previewPageIndex, newPages.length - 1)));
                    }}
                    className="px-2 py-1 rounded-lg bg-error/10 text-error disabled:opacity-40 text-[10px] font-bold"
                  >
                    Hapus
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_12rem] gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--muted-ink)] text-secondary">
                    Judul halaman
                  </label>
                  <input
                    type="text"
                    value={pg.title || ''}
                    onChange={(e) => {
                      const newPages = [...story.pages];
                      newPages[idx] = { ...newPages[idx], title: e.target.value };
                      onStoryChange({ ...story, pages: newPages });
                    }}
                    className="reader-field w-full p-2 text-[11px] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--muted-ink)] text-secondary">
                    Ilustrasi
                  </label>
                  <select
                    value={pg.illustrationType}
                    onChange={(e) => {
                      const newPages = [...story.pages];
                      newPages[idx] = { ...newPages[idx], illustrationType: e.target.value as StoryPage['illustrationType'] };
                      onStoryChange({ ...story, pages: newPages });
                    }}
                    className="reader-field w-full p-2 text-[11px] rounded-lg"
                  >
                    <option value="forest">Forest</option>
                    <option value="dragon">Dragon</option>
                    <option value="space">Space</option>
                    <option value="sea">Sea</option>
                    <option value="castle">Castle</option>
                    <option value="garden">Garden</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-warning dark:text-warning">
                    🇮🇩 Teks Bahasa Indonesia
                  </label>
                  <textarea
                    rows={2}
                    value={pg.text}
                    onChange={(e) => {
                      const newPages = [...story.pages];
                      newPages[idx] = { ...newPages[idx], text: e.target.value };
                      onStoryChange({ ...story, pages: newPages });
                    }}
                    className="reader-field w-full p-2 text-[11px] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-brand-blue dark:text-brand-blue">
                    🇬🇧 English Translation (Edisi Belajar)
                  </label>
                  <input
                    type="text"
                    value={pg.titleEn || ''}
                    placeholder="English page title"
                    onChange={(e) => {
                      const newPages = [...story.pages];
                      newPages[idx] = { ...newPages[idx], titleEn: e.target.value };
                      onStoryChange({ ...story, pages: newPages });
                    }}
                    className="reader-field mb-2 w-full p-2 text-[11px] rounded-lg"
                  />
                  <textarea
                    rows={2}
                    value={pg.textEn || ''}
                    placeholder="Masukkan teks versi bahasa Inggris..."
                    onChange={(e) => {
                      const newPages = [...story.pages];
                      newPages[idx] = { ...newPages[idx], textEn: e.target.value };
                      onStoryChange({ ...story, pages: newPages });
                    }}
                    className="reader-field w-full p-2 text-[11px] rounded-lg"
                  />
                </div>
              </div>

              {pg.illustrationType === 'custom' && (
                <div>
                  <label className="block text-[10px] font-bold text-[var(--muted-ink)] text-secondary">
                    Prompt ilustrasi custom / catatan aset
                  </label>
                  <textarea
                    rows={2}
                    value={pg.illustrationPrompt || ''}
                    onChange={(e) => {
                      const newPages = [...story.pages];
                      newPages[idx] = { ...newPages[idx], illustrationPrompt: e.target.value };
                      onStoryChange({ ...story, pages: newPages });
                    }}
                    className="reader-field w-full p-2 text-[11px] rounded-lg"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
