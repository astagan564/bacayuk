import {
  BookOpen,
  CheckCircle2,
  Download,
  Heart,
  RotateCcw,
  Sparkles,
  Users,
} from 'lucide-react';
import type { Story } from '@/types';
import { formatReadingDuration } from '@/features/reader/helpers/readingDuration';
import { StoryCoverImage } from '@/features/reader/components/catalog/StoryCoverImage';
import type { StoryProgress } from '@/features/reader/types/storyCatalog';

interface StoryCatalogCardProps {
  story: Story;
  progress: StoryProgress;
  readingSeconds: number;
  spineColor: string;
  isFavorite: boolean;
  isVipUser: boolean;
  hasDownloadAccess: boolean;
  defaultEbookPrice: number;
  onSelectStory: (story: Story, pageIndex?: number) => void;
  onToggleFavorite: (storyId: string) => void;
  onOpenPaymentModal: (story: Story) => void;
  onOpenOfflineDownloadModal: (story: Story) => void;
}

export function StoryCatalogCard({
  story,
  progress,
  readingSeconds,
  spineColor,
  isFavorite,
  isVipUser,
  hasDownloadAccess,
  defaultEbookPrice,
  onSelectStory,
  onToggleFavorite,
  onOpenPaymentModal,
  onOpenOfflineDownloadModal,
}: StoryCatalogCardProps) {
  const targetPage = progress.hasSavedBookmark ? progress.savedPage ?? 0 : 0;

  return (
    <article
      onClick={() => onSelectStory(story, progress.isCompleted ? 0 : targetPage)}
      className="group relative min-h-[470px] cursor-pointer overflow-hidden rounded-2xl border border-default transition-all duration-300 hover:-translate-y-1 bg-surface text-primary shadow-sm"
    >
      <div className="absolute inset-y-0 left-0 w-3" style={{ backgroundColor: spineColor }} />
      <div className="flex h-full flex-col pl-3">
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-hover">
          <div className={`absolute inset-0 bg-gradient-to-br ${story.coverBg} opacity-90`} />
          <StoryCoverImage key={story.coverImage} story={story} />
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent" />

          <div className="absolute left-4 top-4 rounded-lg bg-surface/90 px-2.5 py-1 text-[10px] font-extrabold text-primary shadow-sm">
            {formatReadingDuration(readingSeconds)}
          </div>

          <div className="absolute right-4 top-0 flex flex-row items-start gap-3">
            {(progress.isCompleted || progress.hasSavedBookmark) && (
              <div className="flex flex-col items-center">
                <div className="h-16 w-8 rounded-b-md bg-brand-gold shadow-md" />
                <span className="mt-1 rounded-md bg-surface/90 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {progress.isCompleted ? 'Selesai' : `Hal ${targetPage + 1}`}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggleFavorite(story.id);
              }}
              aria-label={isFavorite ? `Hapus ${story.title} dari favorit` : `Tambah ${story.title} ke favorit`}
              aria-pressed={isFavorite}
              className={`mt-4 grid h-10 w-10 place-items-center rounded-xl shadow-sm transition-transform hover:scale-105 active:scale-95 ${
                isFavorite ? 'bg-brand-rose text-white' : 'bg-surface/90 text-secondary'
              }`}
            >
              <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-white">
            <BookOpen className="w-10 h-10 drop-shadow" />
            <span className="rounded-md bg-black/35 px-2 py-1 text-[10px] font-bold backdrop-blur-sm">
              {story.pages.length} halaman
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-center justify-between gap-3 text-[11px] font-bold text-secondary">
            <span className="truncate">{story.category}</span>
            <span className="inline-flex items-center gap-1 shrink-0">
              <Users className="w-3.5 h-3.5" />
              {story.targetAge}
            </span>
          </div>

          <div className="flex-1">
            <h2 className="mb-2 text-xl leading-tight text-balance">{story.title}</h2>
            <p className="text-xs leading-6 font-medium text-secondary line-clamp-3">{story.description}</p>
          </div>

          <div className="grid gap-2 pt-1">
            {progress.isCompleted ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectStory(story, 0);
                }}
                className="btn-primary inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Baca ulang</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectStory(story, targetPage);
                }}
                className="btn-primary inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs"
              >
                <BookOpen className="w-4 h-4" />
                <span>{progress.hasSavedBookmark ? `Lanjut halaman ${targetPage + 1}` : 'Baca gratis'}</span>
              </button>
            )}

            {hasDownloadAccess ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenOfflineDownloadModal(story);
                }}
                className="btn-secondary inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs"
                title={isVipUser ? 'Akses langganan: unduh semua buku' : 'File sudah dibeli'}
              >
                {isVipUser ? <Sparkles className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Unduh PDF/EPUB</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenPaymentModal(story);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-default bg-surface px-3 py-2.5 text-xs font-bold text-secondary transition-all hover:bg-surface-hover hover:text-primary active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>Unduh</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
