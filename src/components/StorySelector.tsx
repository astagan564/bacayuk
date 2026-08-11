import React, { useState } from 'react';
import { Story } from '../types';
import {
  BarChart3,
  BookOpen,
  Bookmark,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Heart,
  History,
  Lock,
  Megaphone,
  RotateCcw,
  Sparkles,
  Users,
  Wand2,
} from 'lucide-react';
import { formatDuration } from './StatsModal';
import { paymentStore } from '../utils/paymentStore';
import { adminStore } from '../utils/adminStore';
import { userAuthStore } from '../utils/userAuthStore';

interface StorySelectorProps {
  stories: Story[];
  bookmarks?: Record<string, number>;
  completedStories?: Record<string, boolean>;
  readingTimes?: Record<string, number>;
  favoriteStoryIds?: string[];
  recentStoryIds?: string[];
  onSelectStory: (story: Story, pageIndex?: number) => void;
  onToggleFavorite: (storyId: string) => void;
  onOpenStoryMaker: () => void;
  onOpenStatsModal?: () => void;
  onOpenPaymentModal: (story: Story) => void;
  onOpenOfflineDownloadModal: (story: Story) => void;
  onTestRestReminder?: () => void;
  isNight?: boolean;
}

const categories = [
  'Semua',
  'Emosi & Keberanian',
  'Kebaikan & Petualangan',
  'Hewan & Petualangan',
  'Fabel Pertumbuhan',
];

const spinePalette = ['#2f8f6b', '#4a6fa5', '#e7a93b', '#d95d6a'];

const StoryCoverImage: React.FC<{ story: Story }> = ({ story }) => {
  const [failedToLoad, setFailedToLoad] = useState(false);
  const coverImage = story.coverImage?.trim();

  if (!coverImage || failedToLoad) return null;

  return (
    <>
      <img
        src={coverImage}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-55 blur-xl"
        onError={() => setFailedToLoad(true)}
      />
      <img
        src={coverImage}
        alt={`Sampul buku ${story.title}`}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-contain"
        onError={() => setFailedToLoad(true)}
      />
    </>
  );
};

export const StorySelector: React.FC<StorySelectorProps> = ({
  stories,
  bookmarks = {},
  completedStories = {},
  readingTimes = {},
  favoriteStoryIds = [],
  recentStoryIds = [],
  onSelectStory,
  onToggleFavorite,
  onOpenStoryMaker,
  onOpenStatsModal,
  onOpenPaymentModal,
  onOpenOfflineDownloadModal,
  onTestRestReminder,
  isNight = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [libraryView, setLibraryView] = useState<'all' | 'continue' | 'favorites' | 'recent' | 'completed'>('all');

  const publicStories = stories.filter((story) => story.status !== 'draft');

  const getStoryProgress = (story: Story) => {
    const savedPage = bookmarks[story.id];
    const isCompleted = completedStories[story.id] || (savedPage !== undefined && savedPage >= story.pages.length - 1);
    return {
      savedPage,
      isCompleted,
      hasSavedBookmark: !isCompleted && savedPage !== undefined && savedPage > 0,
    };
  };

  const favoriteStories = publicStories.filter((story) => favoriteStoryIds.includes(story.id));
  const recentStories = recentStoryIds
    .map((storyId) => publicStories.find((story) => story.id === storyId))
    .filter((story): story is Story => Boolean(story));
  const continueStories = publicStories.filter((story) => getStoryProgress(story).hasSavedBookmark);
  const completedStoryList = publicStories.filter((story) => getStoryProgress(story).isCompleted);

  const libraryStories = {
    all: publicStories,
    continue: continueStories,
    favorites: favoriteStories,
    recent: recentStories,
    completed: completedStoryList,
  }[libraryView];

  const filteredStories =
    selectedCategory === 'Semua'
      ? libraryStories
      : libraryStories.filter((story) => story.category.includes(selectedCategory) || selectedCategory.includes(story.category));

  const totalReadSeconds = (Object.values(readingTimes) as number[]).reduce((acc, curr) => acc + curr, 0);
  const adminSettings = adminStore.getSettings();
  const isVipUser = userAuthStore.isVip();
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-7 text-primary">
      {adminSettings.promoBannerActive && adminSettings.promoBannerText && (
        <div
          className="book-panel rounded-2xl px-4 py-3 flex items-start sm:items-center justify-between gap-3 animate-fade-in text-primary"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 p-2 rounded-lg bg-default/40">
              <Megaphone className="w-4 h-4" />
            </div>
            <p className="text-xs sm:text-sm font-semibold leading-relaxed text-pretty">{adminSettings.promoBannerText}</p>
          </div>
          <span className="hidden sm:inline-flex px-2.5 py-1 rounded-md border border-default text-[11px] font-bold text-secondary">
            Berlaku Sekarang
          </span>
        </div>
      )}

      <header
        className="relative overflow-hidden rounded-[1.75rem] border border-default p-6 sm:p-8 book-panel text-primary"
      >
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="flex flex-col gap-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-lg reader-soft-panel border border-default px-3 py-1 text-[11px] font-bold text-secondary">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Perpustakaan cerita anak</span>
            </div>

            <div>
              <h1 className="max-w-3xl text-4xl sm:text-6xl leading-[0.98] text-balance">
                Rak cerita yang siap dibaca bersama.
              </h1>
              <p className="mt-4 max-w-2xl text-sm sm:text-base leading-7 font-medium text-secondary text-pretty">
                Pilih buku, lanjutkan halaman terakhir, rekam suara orang tua, atau simpan versi offline untuk waktu membaca yang lebih tenang.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button onClick={onOpenStoryMaker} className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm">
                <Wand2 className="w-4 h-4" />
                <span>Buat cerita</span>
                {!isVipUser && <Lock className="w-3.5 h-3.5 opacity-70" />}
              </button>

              {onOpenStatsModal && (
                <button onClick={onOpenStatsModal} className="btn-secondary bg-surface text-secondary inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm">
                  <BarChart3 className="w-4 h-4" />
                  <span>Statistik membaca</span>
                </button>
              )}

              {onTestRestReminder && (
                <button onClick={onTestRestReminder} className="btn-secondary bg-surface text-secondary inline-flex items-center gap-2 px-3.5 py-2.5 text-xs">
                  <Eye className="w-4 h-4" />
                  <span>Istirahat {adminSettings.eyeRestIntervalMinutes || 20}m</span>
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-default p-4 bg-surface">
            <div className="flex h-40 items-end gap-2 border-b-8 border-default px-3 pb-3">
              {filteredStories.slice(0, 7).map((story, index) => (
                <button
                  key={story.id}
                  type="button"
                  onClick={() => onSelectStory(story, 0)}
                  className="group relative flex min-w-8 flex-1 items-center justify-center rounded-t-md text-white shadow-md transition-transform hover:-translate-y-2"
                  style={{
                    height: `${84 + (index % 4) * 14}px`,
                    backgroundColor: spinePalette[index % spinePalette.length],
                  }}
                  title={story.title}
                >
                  <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-extrabold tracking-normal opacity-90 line-clamp-1">
                    {story.title.slice(0, 22)}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-secondary">
              <span>{filteredStories.length} buku tersedia</span>
              {totalReadSeconds > 0 && (
                <button onClick={onOpenStatsModal} className="inline-flex items-center gap-1 hover:text-brand-blue">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDuration(totalReadSeconds)}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="book-panel rounded-2xl border border-default p-4 sm:p-5 text-primary" aria-labelledby="personal-library-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-secondary">Untuk waktu baca berikutnya</p>
            <h2 id="personal-library-title" className="mt-1 text-2xl sm:text-3xl">Koleksi saya</h2>
          </div>
          <p className="max-w-md text-xs leading-5 font-medium text-secondary">
            Simpan buku kesukaan dan temukan kembali cerita yang terakhir dibaca.
          </p>
        </div>
        <nav className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" aria-label="Filter koleksi pribadi">
          {[
            { id: 'all' as const, label: 'Semua buku', count: publicStories.length, icon: BookOpen },
            { id: 'continue' as const, label: 'Lanjutkan', count: continueStories.length, icon: Bookmark },
            { id: 'favorites' as const, label: 'Favorit', count: favoriteStories.length, icon: Heart },
            { id: 'recent' as const, label: 'Terakhir dibaca', count: recentStories.length, icon: History },
            { id: 'completed' as const, label: 'Selesai', count: completedStoryList.length, icon: CheckCircle2 },
          ].map(({ id, label, count, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setLibraryView(id)}
              aria-pressed={libraryView === id}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                libraryView === id
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'bg-surface text-secondary hover:bg-surface-hover'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] ${libraryView === id ? 'bg-white/20' : 'bg-black/5 '}`}>{count}</span>
            </button>
          ))}
        </nav>
      </section>

      <nav className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none" aria-label="Filter kategori cerita">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all ${
              selectedCategory === cat
                ? 'bg-primary text-inverse shadow-sm'
                : 'bg-surface text-secondary hover:bg-surface-hover'
            }`}
          >
            {cat}
          </button>
        ))}
      </nav>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {filteredStories.map((story, index) => {
          const { savedPage, isCompleted, hasSavedBookmark } = getStoryProgress(story);
          const hasDownloadAccess = isVipUser || paymentStore.isStoryPurchased(story.id);
          const spineColor = spinePalette[index % spinePalette.length];
          const isFavorite = favoriteStoryIds.includes(story.id);

          return (
            <article
              key={story.id}
              onClick={() => onSelectStory(story, isCompleted ? 0 : hasSavedBookmark ? savedPage : 0)}
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
                     {formatDuration(readingTimes[story.id] || 0)}
                   </div>

                    <div className="absolute right-4 top-0 flex flex-row items-start gap-3">
                      {(isCompleted || hasSavedBookmark) && (
                        <div className="flex flex-col items-center">
                          <div className="h-16 w-8 rounded-b-md bg-brand-gold shadow-md" />
                          <span className="mt-1 rounded-md bg-surface/90 px-2 py-0.5 text-[10px] font-bold text-primary">
                            {isCompleted ? 'Selesai' : `Hal ${savedPage + 1}`}
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
                    <p className="text-xs leading-6 font-medium text-secondary line-clamp-3">
                      {story.description}
                    </p>
                  </div>

                  <div className="grid gap-2 pt-1">
                    {isCompleted ? (
                      <button
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
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectStory(story, hasSavedBookmark ? savedPage : 0);
                        }}
                        className="btn-primary inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>{hasSavedBookmark ? `Lanjut halaman ${savedPage + 1}` : 'Baca sekarang'}</span>
                      </button>
                    )}

                    {hasDownloadAccess ? (
                      <button
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
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenPaymentModal(story);
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-default bg-surface px-3 py-2.5 text-xs font-bold text-secondary transition-all hover:bg-surface-hover hover:text-primary active:scale-[0.98]"
                      >
                        <Download className="w-4 h-4" />
                        <span>Unduh Rp {((story.ebookPrice || adminSettings.defaultEbookPrice) / 1000).toFixed(0)}rb</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {filteredStories.length === 0 && (
        <div className="rounded-2xl border border-dashed border-default p-8 text-center bg-surface text-primary">
          <Heart className="mx-auto h-8 w-8 text-brand-rose" />
          <h2 className="mt-3 text-xl">Belum ada buku di bagian ini</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-secondary">
            Pilih buku dari rak lalu tekan ikon hati untuk menyimpannya, atau lanjutkan cerita yang pernah dibaca.
          </p>
          <button type="button" onClick={() => setLibraryView('all')} className="btn-secondary mt-4 px-4 py-2.5 text-xs">
            Lihat semua buku
          </button>
        </div>
      )}
    </section>
  );
};
