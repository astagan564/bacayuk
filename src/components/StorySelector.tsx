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
  onSelectStory: (story: Story, pageIndex?: number) => void;
  onOpenStoryMaker: () => void;
  onOpenStatsModal?: () => void;
  onOpenPaymentModal: (story: Story) => void;
  onOpenOfflineDownloadModal: (story: Story) => void;
  onTestRestReminder?: () => void;
  isNight?: boolean;
}

const categories = [
  'Semua',
  'Petualangan & Persahabatan',
  'Keberanian & Kepercayaan Diri',
  'Eksplorasi & Keajaiban',
  'Menjaga Lingkungan & Lautan',
];

const spinePalette = ['#2f8f6b', '#4a6fa5', '#e7a93b', '#d95d6a'];

export const StorySelector: React.FC<StorySelectorProps> = ({
  stories,
  bookmarks = {},
  completedStories = {},
  readingTimes = {},
  onSelectStory,
  onOpenStoryMaker,
  onOpenStatsModal,
  onOpenPaymentModal,
  onOpenOfflineDownloadModal,
  onTestRestReminder,
  isNight = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  const publicStories = stories.filter((story) => story.status !== 'draft');

  const filteredStories =
    selectedCategory === 'Semua'
      ? publicStories
      : publicStories.filter((story) => story.category.includes(selectedCategory) || selectedCategory.includes(story.category));

  const totalReadSeconds = (Object.values(readingTimes) as number[]).reduce((acc, curr) => acc + curr, 0);
  const adminSettings = adminStore.getSettings();
  const isVipUser = userAuthStore.isVip();
  const shelfTone = isNight ? 'bg-[#111b29]/80 border-blue-900/50' : 'bg-[#f1dfbd]/80 border-[#dfc99f]';

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-7">
      {adminSettings.promoBannerActive && adminSettings.promoBannerText && (
        <div
          className={`book-panel rounded-2xl px-4 py-3 flex items-start sm:items-center justify-between gap-3 animate-fade-in ${
            isNight ? 'text-blue-100' : 'text-[var(--ink)]'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 p-2 rounded-lg bg-[var(--warm-gold)]/20 text-[var(--warm-gold)]">
              <Megaphone className="w-4 h-4" />
            </div>
            <p className="text-xs sm:text-sm font-semibold leading-relaxed text-pretty">{adminSettings.promoBannerText}</p>
          </div>
          <span className="hidden sm:inline-flex px-2.5 py-1 rounded-md border border-[var(--warm-gold)]/40 text-[11px] font-bold text-[var(--muted-ink)] dark:text-blue-200">
            Berlaku sekarang
          </span>
        </div>
      )}

      <header
        className={`relative overflow-hidden rounded-[1.75rem] border p-6 sm:p-8 book-panel ${
          isNight ? 'text-slate-100' : 'text-[var(--ink)]'
        }`}
      >
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="flex flex-col gap-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-[var(--line)]/70 bg-white/60 px-3 py-1 text-[11px] font-bold text-[var(--muted-ink)] dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
              <BookOpen className="w-3.5 h-3.5 text-[var(--story-green)]" />
              <span>Perpustakaan cerita anak</span>
            </div>

            <div>
              <h1 className="max-w-3xl text-4xl sm:text-6xl leading-[0.98] text-balance">
                Rak cerita yang siap dibaca bersama.
              </h1>
              <p className="mt-4 max-w-2xl text-sm sm:text-base leading-7 font-medium text-[var(--muted-ink)] dark:text-blue-100/80 text-pretty">
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
                <button onClick={onOpenStatsModal} className="btn-secondary inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm">
                  <BarChart3 className="w-4 h-4" />
                  <span>Statistik membaca</span>
                </button>
              )}

              {onTestRestReminder && (
                <button onClick={onTestRestReminder} className="btn-secondary inline-flex items-center gap-2 px-3.5 py-2.5 text-xs">
                  <Eye className="w-4 h-4" />
                  <span>Istirahat {adminSettings.eyeRestIntervalMinutes || 20}m</span>
                </button>
              )}
            </div>
          </div>

          <div className={`rounded-2xl border p-4 ${shelfTone}`}>
            <div className="flex h-40 items-end gap-2 border-b-8 border-[#8f6745]/35 px-3 pb-3">
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
            <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-[var(--muted-ink)] dark:text-blue-200">
              <span>{filteredStories.length} buku tersedia</span>
              {totalReadSeconds > 0 && (
                <button onClick={onOpenStatsModal} className="inline-flex items-center gap-1 hover:text-[var(--magic-blue)]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDuration(totalReadSeconds)}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <nav className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none" aria-label="Filter kategori cerita">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all ${
              selectedCategory === cat
                ? 'bg-[var(--ink)] text-[#fff7e6] shadow-sm dark:bg-blue-100 dark:text-[#101923]'
                : 'bg-white/70 text-[var(--muted-ink)] hover:bg-white dark:bg-blue-950/40 dark:text-blue-200 dark:hover:bg-blue-900/70'
            }`}
          >
            {cat}
          </button>
        ))}
      </nav>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {filteredStories.map((story, index) => {
          const savedPage = bookmarks[story.id];
          const isCompleted = completedStories[story.id] || (savedPage !== undefined && savedPage >= story.pages.length - 1);
          const hasSavedBookmark = !isCompleted && savedPage !== undefined && savedPage > 0;
          const hasDownloadAccess = isVipUser || paymentStore.isStoryPurchased(story.id);
          const spineColor = spinePalette[index % spinePalette.length];

          return (
            <article
              key={story.id}
              onClick={() => onSelectStory(story, isCompleted ? 0 : hasSavedBookmark ? savedPage : 0)}
              className={`group relative min-h-[470px] cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
                isNight
                  ? 'bg-[#142033] border-blue-900/50 text-slate-100 shadow-xl shadow-black/20'
                  : 'bg-[#fffaf0] border-[#eadbc1] text-[var(--ink)] shadow-[0_18px_32px_rgba(46,31,22,0.09)]'
              }`}
            >
              <div className="absolute inset-y-0 left-0 w-3" style={{ backgroundColor: spineColor }} />
              <div className="flex h-full flex-col pl-3">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#f1dfbd]">
                  <div className={`absolute inset-0 bg-gradient-to-br ${story.coverBg} opacity-90`} />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent" />

                  <div className="absolute left-4 top-4 rounded-lg bg-white/88 px-2.5 py-1 text-[10px] font-extrabold text-[var(--ink)] shadow-sm">
                    {formatDuration(readingTimes[story.id] || 0)}
                  </div>

                  {(isCompleted || hasSavedBookmark) && (
                    <div className="absolute right-4 top-0 flex flex-col items-center">
                      <div className="h-16 w-8 rounded-b-md bg-[var(--warm-gold)] shadow-md" />
                      <span className="mt-1 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-bold text-[var(--ink)]">
                        {isCompleted ? 'Selesai' : `Hal ${savedPage + 1}`}
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-white">
                    <BookOpen className="w-10 h-10 drop-shadow" />
                    <span className="rounded-md bg-black/35 px-2 py-1 text-[10px] font-bold backdrop-blur-sm">
                      {story.pages.length} halaman
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-center justify-between gap-3 text-[11px] font-bold text-[var(--muted-ink)] dark:text-blue-200">
                    <span className="truncate">{story.category}</span>
                    <span className="inline-flex items-center gap-1 shrink-0">
                      <Users className="w-3.5 h-3.5" />
                      {story.targetAge}
                    </span>
                  </div>

                  <div className="flex-1">
                    <h2 className="mb-2 text-xl leading-tight text-balance">{story.title}</h2>
                    <p className="text-xs leading-6 font-medium text-[var(--muted-ink)] dark:text-blue-100/75 line-clamp-3">
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
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#eadbc1] bg-white/70 px-3 py-2.5 text-xs font-bold text-[var(--muted-ink)] transition-all hover:bg-white hover:text-[var(--ink)] active:scale-[0.98] dark:border-blue-900 dark:bg-blue-950/35 dark:text-blue-200"
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
    </section>
  );
};
