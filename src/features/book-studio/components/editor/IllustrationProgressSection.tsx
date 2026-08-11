import { RefreshCw, Sparkles } from 'lucide-react';
import type { Story } from '@/types';
import { isPlaceholderCover } from '@/features/book-studio/helpers/storyDraft';

interface IllustrationProgressSectionProps {
  story: Story;
  generatingImagePageNumber: number | null;
  progress: { completed: number; total: number; label: string } | null;
  onGenerateAllImages: () => Promise<void>;
}

export function IllustrationProgressSection({
  story,
  generatingImagePageNumber,
  progress,
  onGenerateAllImages,
}: IllustrationProgressSectionProps) {
  const generatedPageCount = story.pages.filter((page) => Boolean(page.imageUrl?.trim())).length;
  const coverReady = !isPlaceholderCover(story.coverImage);
  const allImagesReady = coverReady && generatedPageCount === story.pages.length;
  const completedAssetCount = generatedPageCount + (coverReady ? 1 : 0);
  const totalAssetCount = story.pages.length + 1;
  const progressCompleted = progress?.completed ?? completedAssetCount;
  const progressTotal = progress?.total ?? totalAssetCount;

  return (
    <section className="reader-soft-panel rounded-2xl p-3.5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black">Produksi ilustrasi</span>
            <span className={`rounded-lg px-2 py-1 text-[9px] font-black ${allImagesReady ? 'bg-brand-green/12 text-success' : 'bg-warning/12 text-warning'}`}>
              {allImagesReady ? 'Semua siap' : `${completedAssetCount}/${totalAssetCount} gambar`}
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-5 text-secondary">
            {progress
              ? progress.label
              : allImagesReady
                ? 'Cover dan seluruh halaman sudah memiliki gambar.'
                : `Cover ${coverReady ? 'siap' : 'belum dibuat'} · ${generatedPageCount} dari ${story.pages.length} halaman siap.`}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-hover">
            <div
              className="h-full rounded-full bg-brand-green transition-all duration-300"
              style={{ width: `${Math.round((progressCompleted / Math.max(1, progressTotal)) * 100)}%` }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={onGenerateAllImages}
          disabled={Boolean(progress) || allImagesReady || generatingImagePageNumber !== null}
          className="btn-primary min-w-[12rem] px-4 py-3 text-xs flex items-center justify-center gap-2 disabled:opacity-55 disabled:cursor-not-allowed"
        >
          {progress ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          <span>
            {progress
              ? `${progress.completed}/${progress.total} selesai`
              : allImagesReady
                ? 'Semua gambar siap'
                : completedAssetCount > 0
                  ? 'Lanjutkan gambar'
                  : 'Generate semua gambar'}
          </span>
        </button>
      </div>
    </section>
  );
}
