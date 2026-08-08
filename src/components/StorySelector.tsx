import React, { useState } from 'react';
import { Story } from '../types';
import { BookOpen, Sparkles, Wand2, Star, Users, Heart, Bookmark, Play, Clock, BarChart3, Eye, Download, Lock, CheckCircle2, RotateCcw, Megaphone, Tag } from 'lucide-react';
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

  const categories = ['Semua', 'Petualangan & Persahabatan', 'Keberanian & Kepercayaan Diri', 'Eksplorasi & Keajaiban', 'Menjaga Lingkungan & Lautan'];

  const filteredStories =
    selectedCategory === 'Semua'
      ? stories
      : stories.filter((s) => s.category.includes(selectedCategory) || selectedCategory.includes(s.category));

  // Total reading time across all books
  const totalReadSeconds = (Object.values(readingTimes) as number[]).reduce((acc: number, curr: number) => acc + curr, 0);

  const adminSettings = adminStore.getSettings();
  
  const user = userAuthStore.getUser();
  const purchases = paymentStore.getPurchases();
  const isVipUser = user && Object.keys(purchases).length > 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 flex flex-col gap-8">
      {/* Dynamic Admin Promo Banner */}
      {adminSettings.promoBannerActive && adminSettings.promoBannerText && (
        <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 text-white shadow-xl flex items-center justify-between gap-3 animate-fade-in border-2 border-pink-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 shrink-0">
              <Megaphone className="w-5 h-5 text-amber-200 animate-bounce" />
            </div>
            <p className="text-xs sm:text-sm font-black leading-snug">
              {adminSettings.promoBannerText}
            </p>
          </div>
          <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-white text-purple-900 text-xs font-black shrink-0 shadow-sm">
            Promo Aktif
          </span>
        </div>
      )}

      {/* Banner Header */}
      <div
        className={`relative rounded-3xl p-6 sm:p-10 text-white shadow-2xl overflow-hidden border-4 transition-all duration-500 ${isNight
            ? 'bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-950 border-indigo-700/60'
            : 'bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 border-amber-300/40'
          }`}
      >
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold w-fit border backdrop-blur-md ${isNight
                  ? 'bg-indigo-950/60 text-indigo-200 border-indigo-500/40'
                  : 'bg-amber-950/30 text-amber-100 border-amber-300/30'
                }`}
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Buku Cerita Anak Interaktif</span>
            </div>

            {totalReadSeconds > 0 && (
              <div
                onClick={onOpenStatsModal}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-amber-950 shadow-md cursor-pointer hover:bg-yellow-300 transition-transform hover:scale-105"
                title="Klik untuk membuka rincian statistik membaca"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{formatDuration(totalReadSeconds)} Dibaca</span>
              </div>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-amber-100 leading-tight tracking-tight drop-shadow-md">
            Dunia Cerita Ajaib
          </h1>
          <p className="text-amber-100/90 text-sm sm:text-base leading-relaxed font-medium">
            Nikmati pengalaman membaca buku cerita anak bergambar dengan efek flipbook 3D interaktif, narasi suara (read-aloud), penanda halaman (bookmark), kuis seru, serta statistik waktu membaca & pengingat istirahat!
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenStoryMaker}
              className={`px-5 py-2.5 rounded-2xl font-black shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-2 border-2 text-xs sm:text-sm ${
                isVipUser ? 'hover:scale-105' : 'opacity-95 hover:scale-100'
              } ${isNight
                  ? 'bg-gradient-to-r from-indigo-200 to-purple-100 text-indigo-950 border-white/90'
                  : 'bg-gradient-to-r from-amber-200 to-amber-100 text-amber-950 border-white/80'
                }`}
            >
              <Wand2 className="w-4 h-4 text-indigo-700" />
              <span>Buat Cerita (AI)</span>
              {!isVipUser && <Lock className="w-3.5 h-3.5 text-indigo-950/60 ml-0.5" />}
            </button>

            {onOpenStatsModal && (
              <button
                onClick={onOpenStatsModal}
                className="px-5 py-2.5 rounded-2xl bg-amber-950/60 hover:bg-amber-950/80 border border-amber-300/50 text-amber-100 font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 hover:scale-105"
              >
                <BarChart3 className="w-4 h-4 text-amber-300" />
                <span>Statistik Membaca</span>
              </button>
            )}

            {onTestRestReminder && (() => {
              const restInterval = adminSettings.eyeRestIntervalMinutes || 20;
              return (
                <button
                  onClick={onTestRestReminder}
                  className="px-3.5 py-2 rounded-2xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-400/50 text-emerald-200 font-extrabold text-xs shadow-sm transition-all flex items-center gap-1.5 hover:scale-105"
                  title={`Pengingat otomatis muncul setiap ${restInterval} menit membaca. Klik untuk menguji pop-up sekarang.`}
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Pengingat Istirahat ({restInterval}m)</span>
                </button>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex md:justify-center items-center gap-2 overflow-x-auto pb-4 pt-1 -mx-4 px-4 sm:-mx-0 sm:px-0 scrollbar-none after:content-[''] after:min-w-[16px] after:shrink-0 sm:after:min-w-0">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap transition-all shadow-sm ${selectedCategory === cat
                ? isNight
                  ? 'bg-indigo-600 text-white shadow-md scale-105'
                  : 'bg-amber-800 text-white shadow-md scale-105'
                : isNight
                  ? 'bg-slate-800/90 hover:bg-slate-700 text-indigo-200 border border-indigo-800/60'
                  : 'bg-amber-100/80 hover:bg-amber-200 text-amber-950 border border-amber-300/60'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Book Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredStories.map((story) => {
          const savedPage = bookmarks[story.id];
          const isCompleted = completedStories[story.id] || (savedPage !== undefined && savedPage >= story.pages.length - 1);
          const hasSavedBookmark = !isCompleted && savedPage !== undefined && savedPage > 0;

          return (
            <div
              key={story.id}
              onClick={() => onSelectStory(story, isCompleted ? 0 : hasSavedBookmark ? savedPage : 0)}
              className={`group relative rounded-3xl overflow-hidden border-2 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer flex flex-col justify-between ${isNight
                  ? 'bg-slate-900 border-indigo-900/80 text-slate-100'
                  : 'bg-white border-amber-200 text-amber-950'
                }`}
            >
              {/* Book Spine Accent Top */}
              <div className={`h-3 w-full bg-gradient-to-r ${story.coverBg}`} />

              <div className="p-5 flex flex-col gap-3 flex-1">
                {/* Category & Age */}
                <div
                  className={`flex items-center justify-between text-xs font-bold ${isNight ? 'text-indigo-300' : 'text-amber-800'
                    }`}
                >
                  <span
                    className={`px-2.5 py-1 rounded-full border truncate max-w-[130px] ${isNight
                        ? 'bg-indigo-950/80 border-indigo-800 text-indigo-200'
                        : 'bg-amber-100 border-amber-200'
                      }`}
                  >
                    {story.category}
                  </span>
                  <span className={`flex items-center gap-1 ${isNight ? 'text-indigo-300' : 'text-amber-700'}`}>
                    <Users className="w-3.5 h-3.5" />
                    {story.targetAge}
                  </span>
                </div>

                {/* Cover Graphic Card */}
                <div
                  className={`w-full aspect-[4/3] rounded-2xl bg-gradient-to-br ${story.coverBg} flex flex-col items-center justify-center text-white p-4 relative shadow-inner overflow-hidden group-hover:scale-[1.02] transition-transform duration-300`}
                >
                  <div className="absolute inset-0 bg-black/10 backdrop-blur-xs" />

                  {/* Ribbon Badge: Completed OR Bookmark */}
                  {isCompleted ? (
                    <div className="absolute top-2.5 right-2.5 bg-emerald-500 text-white font-black text-[10px] px-2.5 py-1 rounded-full shadow-lg z-20 flex items-center gap-1 ring-2 ring-emerald-300 animate-pulse">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                      <span>Selesai Dibaca</span>
                    </div>
                  ) : hasSavedBookmark ? (
                    <div className="absolute top-2.5 right-2.5 bg-yellow-400 text-amber-950 font-black text-[10px] px-2.5 py-1 rounded-full shadow-lg z-20 flex items-center gap-1 ring-2 ring-amber-900/40 animate-pulse">
                      <Bookmark className="w-3 h-3 fill-amber-950" />
                      <span>Hal {savedPage + 1}</span>
                    </div>
                  ) : null}

                  {/* Reading Duration Badge */}
                  <div
                    className="absolute top-2.5 left-2.5 bg-black/50 backdrop-blur-md text-amber-100 font-extrabold text-[10px] px-2.5 py-1 rounded-full z-20 flex items-center gap-1 border border-white/20 shadow-sm"
                    title={`Total waktu membaca buku ini: ${formatDuration(readingTimes[story.id] || 0)}`}
                  >
                    <Clock className="w-3 h-3 text-amber-300" />
                    <span>{formatDuration(readingTimes[story.id] || 0)}</span>
                  </div>

                  <BookOpen className="w-12 h-12 text-white/90 z-10 mb-2 drop-shadow-md group-hover:scale-110 transition-transform" />
                  <span className="z-10 text-xs font-semibold text-amber-200/90 tracking-wider uppercase">
                    {story.pages.length} Halaman
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3
                    className={`text-lg font-black transition-colors line-clamp-2 ${isNight ? 'text-slate-100 group-hover:text-indigo-300' : 'text-amber-950 group-hover:text-amber-700'
                      }`}
                  >
                    {story.title}
                  </h3>
                  <p
                    className={`text-xs line-clamp-3 mt-1.5 leading-relaxed ${isNight ? 'text-slate-400' : 'text-amber-800/80'
                      }`}
                  >
                    {story.description}
                  </p>
                </div>
              </div>

              {/* Bottom Footer Action */}
              <div
                className={`p-3.5 border-t flex flex-col gap-2 ${isNight
                    ? 'bg-slate-950/80 border-indigo-900/50'
                    : 'bg-amber-50/80 border-amber-100'
                  }`}
              >
                <div className="flex flex-col gap-2 w-full">
                  {/* Button 1: Baca Online / Lanjutkan / Baca Ulang */}
                  {isCompleted ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStory(story, 0);
                      }}
                      className="py-2 px-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm hover:scale-[1.02]"
                      title="Membaca ulang buku cerita dari awal (Halaman 1)"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Baca Ulang</span>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStory(story, hasSavedBookmark ? savedPage : 0);
                      }}
                      className={`py-2 px-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.02] ${isNight
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          : 'bg-amber-700 hover:bg-amber-600 text-white'
                        }`}
                      title="Membaca buku cerita di dalam web secara gratis"
                    >
                      <BookOpen className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{hasSavedBookmark ? `Lanjutkan (${savedPage + 1})` : 'Baca Online (Gratis)'}</span>
                    </button>
                  )}

                  {/* Button 2: Unduh Versi Offline (Berbayar) */}
                  {isVipUser || paymentStore.isStoryPurchased(story.id) ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenOfflineDownloadModal(story);
                      }}
                      className="py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md hover:scale-[1.02]"
                      title={isVipUser ? "Akses VIP: Unduh Gratis" : "File PDF & EPUB Sudah Dibeli. Klik untuk mengunduh!"}
                    >
                      {isVipUser ? <Sparkles className="w-3.5 h-3.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                      <span className="truncate">Unduh (PDF/EPUB)</span>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPaymentModal(story);
                      }}
                      className="py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-amber-950 shadow-md hover:scale-[1.02]"
                      title="Beli lisensi unduh offline atau langganan VIP"
                    >
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Unduh (Rp {((story.ebookPrice || adminSettings.defaultEbookPrice) / 1000).toFixed(0)}rb / VIP)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
