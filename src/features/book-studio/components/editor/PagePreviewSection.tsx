import type { Dispatch, SetStateAction } from 'react';
import type { Story } from '@/types';
import { Eye } from 'lucide-react';

interface PagePreviewSectionProps {
  story: Story;
  previewPageIndex: number;
  onPreviewPageChange: Dispatch<SetStateAction<number>>;
}

export function PagePreviewSection({
  story,
  previewPageIndex,
  onPreviewPageChange,
}: PagePreviewSectionProps) {
  return (
    <>
      {story.pages.length > 0 && (
        <div className="reader-soft-panel p-3.5 rounded-2xl flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-black text-xs uppercase text-secondary flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-brand-green" />
              Preview halaman
            </span>
            <select
              value={Math.min(previewPageIndex, story.pages.length - 1)}
              onChange={(e) => onPreviewPageChange(Number(e.target.value))}
              className="reader-field px-2 py-1 rounded-lg text-[11px]"
            >
              {story.pages.map((page, idx) => (
                <option key={`${page.pageNumber}-${idx}`} value={idx}>
                  Halaman {idx + 1}
                </option>
              ))}
            </select>
          </div>
          {(() => {
            const page = story.pages[Math.min(previewPageIndex, story.pages.length - 1)];
            return (
              <div className="rounded-2xl border border-default overflow-hidden bg-background">
                <div className="p-4 bg-surface">
                  <div className="min-h-36 rounded-2xl bg-card/70 p-4 flex flex-col justify-end">
                    <p className="text-[11px] font-black text-brand-green uppercase">
                      {page.illustrationType}
                    </p>
                    <h4 className="text-base font-black mb-1">{page.title || `Halaman ${page.pageNumber}`}</h4>
                    <p className="text-sm leading-relaxed font-bold text-primary">
                      {page.text || 'Teks cerita halaman ini belum diisi.'}
                    </p>
                    {page.textEn && (
                      <p className="mt-2 text-xs leading-relaxed text-brand-blue dark:text-brand-blue">
                        {page.textEn}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

    </>
  );
}
