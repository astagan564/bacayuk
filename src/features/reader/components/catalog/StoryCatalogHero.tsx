import {
  BarChart3,
  BookOpen,
  Clock,
  Eye,
  Lock,
  Wand2,
} from 'lucide-react';
import type { Story } from '@/types';
import { formatReadingDuration } from '@/features/reader/helpers/readingDuration';
import { STORY_SPINE_PALETTE } from '@/features/reader/helpers/storyCatalog';
import type { StoryCatalogController } from '@/features/reader/hooks/useStoryCatalogController';

interface StoryCatalogHeroProps {
  controller: StoryCatalogController;
  onSelectStory: (story: Story, pageIndex?: number) => void;
  onOpenStoryMaker: () => void;
  onOpenVip: () => void;
  onOpenStatsModal?: () => void;
  onTestRestReminder?: () => void;
}

export function StoryCatalogHero({
  controller,
  onSelectStory,
  onOpenStoryMaker,
  onOpenVip,
  onOpenStatsModal,
  onTestRestReminder,
}: StoryCatalogHeroProps) {
  return (
    <header className="relative overflow-hidden rounded-[1.75rem] border border-default p-6 sm:p-8 book-panel text-primary">
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
            <button type="button" onClick={onOpenVip} className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm">
              <Lock className="w-4 h-4" />
              <span>Gabung VIP</span>
            </button>

            <button type="button" onClick={onOpenStoryMaker} className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm">
              <Wand2 className="w-4 h-4" />
              <span>AI segera hadir</span>
            </button>

            {onOpenStatsModal && (
              <button type="button" onClick={onOpenStatsModal} className="btn-secondary bg-surface text-secondary inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm">
                <BarChart3 className="w-4 h-4" />
                <span>Statistik membaca</span>
              </button>
            )}

            {onTestRestReminder && (
              <button type="button" onClick={onTestRestReminder} className="btn-secondary bg-surface text-secondary inline-flex items-center gap-2 px-3.5 py-2.5 text-xs">
                <Eye className="w-4 h-4" />
                <span>Istirahat {controller.adminSettings.eyeRestIntervalMinutes || 20}m</span>
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-default p-4 bg-surface">
          <div className="flex h-40 items-end gap-2 border-b-8 border-default px-3 pb-3">
            {controller.filteredStories.slice(0, 7).map((story, index) => (
              <button
                key={story.id}
                type="button"
                onClick={() => onSelectStory(story, 0)}
                className="group relative flex min-w-8 flex-1 items-center justify-center rounded-t-md text-white shadow-md transition-transform hover:-translate-y-2"
                style={{
                  height: `${84 + (index % 4) * 14}px`,
                  backgroundColor: STORY_SPINE_PALETTE[index % STORY_SPINE_PALETTE.length],
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
            <span>{controller.filteredStories.length} buku tersedia</span>
            {controller.totalReadSeconds > 0 && (
              <button type="button" onClick={onOpenStatsModal} className="inline-flex items-center gap-1 hover:text-brand-blue">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatReadingDuration(controller.totalReadSeconds)}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
