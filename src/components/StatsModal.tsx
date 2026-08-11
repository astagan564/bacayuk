import React from 'react';
import { Story } from '../types';
import { BarChart3, Clock, BookOpen, Award, Flame, X, RotateCcw, CheckCircle2 } from 'lucide-react';

interface StatsModalProps {
  stories: Story[];
  readingTimes: Record<string, number>; // storyId -> seconds
  bookmarks: Record<string, number>; // storyId -> last page
  onClose: () => void;
  onResetStats?: () => void;
  isNight?: boolean;
}

export const formatDuration = (totalSeconds: number): string => {
  if (!totalSeconds || totalSeconds <= 0) return '0 dtk';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours} jam ${minutes} mnt`;
  }
  if (minutes > 0) {
    return `${minutes} mnt ${seconds} dtk`;
  }
  return `${seconds} dtk`;
};

export const StatsModal: React.FC<StatsModalProps> = ({
  stories,
  readingTimes,
  bookmarks,
  onClose,
  onResetStats,
}) => {
  const totalSeconds = (Object.values(readingTimes) as number[]).reduce((acc: number, curr: number) => acc + curr, 0);
  const readBooksCount = Object.keys(readingTimes).filter((id) => (readingTimes[id] || 0) > 0).length;

  // Find most read book
  let mostReadStory: Story | null = null;
  let maxTime = 0;
  stories.forEach((story) => {
    const time = readingTimes[story.id] || 0;
    if (time > maxTime) {
      maxTime = time;
      mostReadStory = story;
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-overlay)] backdrop-blur-md animate-fade-in">
      <div
        className="reader-modal w-full max-w-2xl rounded-[1.35rem] p-6 sm:p-8 relative max-h-[90vh] flex flex-col justify-between overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b reader-divider">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-brand-green text-white font-black shadow-md">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Statistik Membaca Anak</h2>
              <p className="text-xs text-secondary font-medium">
                Catatan durasi waktu & aktivitas membaca buku cerita
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-hover transition-colors"
            title="Tutup Modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto py-4 flex flex-col gap-6 my-2 pr-1">
          {/* Summary Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="reader-soft-panel p-4 rounded-2xl text-primary font-bold flex flex-col gap-1">
              <div className="flex items-center justify-between opacity-80 text-xs">
                <span>Total Durasi</span>
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-2xl sm:text-3xl font-black tracking-tight">
                {formatDuration(totalSeconds)}
              </span>
              <span className="text-[10px] font-semibold opacity-75">Waktu membaca total</span>
            </div>

            <div className="reader-soft-panel p-4 rounded-2xl text-primary font-bold flex flex-col gap-1">
              <div className="flex items-center justify-between opacity-80 text-xs">
                <span>Buku Dibuka</span>
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-2xl sm:text-3xl font-black tracking-tight">
                {readBooksCount} / {stories.length}
              </span>
              <span className="text-[10px] font-semibold opacity-75">Judul buku dibuka</span>
            </div>

            <div className="reader-soft-panel p-4 rounded-2xl text-primary font-bold flex flex-col gap-1">
              <div className="flex items-center justify-between opacity-80 text-xs">
                <span>Favorit Utama</span>
                <Flame className="w-4 h-4 text-brand-gold" />
              </div>
              <span className="text-base font-black truncate max-w-full">
                {mostReadStory ? (mostReadStory as Story).title : 'Belum Ada'}
              </span>
              <span className="text-[10px] font-semibold opacity-75">
                {maxTime > 0 ? formatDuration(maxTime) : 'Belum dibaca'}
              </span>
            </div>
          </div>

          {/* Detailed Breakdown Per Book */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider opacity-80 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-brand-gold" />
              <span>Rincian Waktu Per Judul Buku</span>
            </h3>

            <div className="flex flex-col gap-2">
              {stories.map((story) => {
                const seconds = readingTimes[story.id] || 0;
                const lastPage = bookmarks[story.id];
                const percentage = totalSeconds > 0 ? Math.round((seconds / totalSeconds) * 100) : 0;

                return (
                  <div
                    key={story.id}
                    className="reader-soft-panel p-3.5 rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-3 h-10 rounded-full bg-gradient-to-b ${story.coverBg} shrink-0`} />
                      <div className="min-w-0">
                        <h4 className="text-sm font-extrabold text-primary truncate">{story.title}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-secondary font-medium">
                          <span>{story.category}</span>
                          {lastPage !== undefined && (
                            <span className="text-brand-gold font-bold">• Terakhir Hal {lastPage + 1}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-sm font-black text-primary">{formatDuration(seconds)}</span>
                      {percentage > 0 && (
                        <span className="text-[10px] font-extrabold text-success">{percentage}% total</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t reader-divider flex items-center justify-between gap-3">
          {onResetStats && (
            <button
              onClick={() => {
                if (confirm('Apakah Anda yakin ingin menghapus seluruh catatan statistik membaca?')) {
                  onResetStats();
                }
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-error hover:bg-error/10 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Statistik</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="btn-primary px-6 py-2.5 text-xs ml-auto"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
