import React, { useEffect } from 'react';
import { Story } from '../types';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Star,
  BookOpen,
  RotateCcw,
  HelpCircle,
  Download,
  ArrowLeft,
  Trophy,
  CheckCircle2,
  Heart,
} from 'lucide-react';

interface BookCompletionModalProps {
  story: Story;
  onClose: () => void;
  onReadAgain: () => void;
  onBackToCatalog: () => void;
  onOpenQuiz?: () => void;
  onOpenOfflineDownload?: () => void;
  isNight?: boolean;
}

export const BookCompletionModal: React.FC<BookCompletionModalProps> = ({
  story,
  onClose,
  onReadAgain,
  onBackToCatalog,
  onOpenQuiz,
  onOpenOfflineDownload,
  isNight = false,
}) => {
  // Fire digital fireworks confetti on modal open
  useEffect(() => {
    // Burst 1
    confetti({
      particleCount: 80,
      spread: 80,
      origin: { y: 0.6 },
    });

    // Burst 2 after delay
    const timer = setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.5 },
      });
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border-4 relative overflow-hidden flex flex-col items-center text-center gap-6 ${
          isNight
            ? 'bg-slate-900 text-slate-100 border-indigo-500/80'
            : 'bg-amber-50 text-amber-950 border-amber-300'
        }`}
      >
        {/* Glowing Background FX */}
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-amber-400/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-orange-500/25 rounded-full blur-3xl pointer-events-none" />

        {/* Top Trophy & Stars Celebration */}
        <div className="relative flex flex-col items-center gap-2">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 flex items-center justify-center shadow-xl border-4 border-white animate-bounce">
              <Trophy className="w-10 h-10 text-amber-950 fill-amber-950" />
            </div>
            <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-1 -right-1 animate-spin" />
            <Sparkles className="w-5 h-5 text-amber-500 absolute -bottom-1 -left-1 animate-pulse" />
          </div>

          {/* 5 Animated Golden Stars */}
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="w-7 h-7 text-yellow-400 fill-yellow-400 drop-shadow-md animate-pulse"
                style={{ animationDelay: `${star * 150}ms` }}
              />
            ))}
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-400/50 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Selesai Membaca • Buku Tamat</span>
          </div>
        </div>

        {/* Title Appreciation Heading */}
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl sm:text-3xl font-black text-amber-900 dark:text-amber-100 leading-tight">
            Hebat! Kamu Sudah Menyelesaikan Buku Ini! 🌟
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
            Selamat telah membaca <strong className="text-amber-800 dark:text-amber-200">"{story.title}"</strong> dari awal hingga akhir!
          </p>
        </div>

        {/* Moral Message Box */}
        {story.moralMessage && (
          <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-100 via-orange-100 to-amber-100 dark:from-slate-800 dark:to-slate-850 border border-amber-300 dark:border-indigo-700 text-left flex items-start gap-3 shadow-inner">
            <Heart className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                Pesan Moral Cerita
              </span>
              <p className="text-xs font-medium leading-relaxed text-slate-800 dark:text-slate-200">
                "{story.moralMessage}"
              </p>
            </div>
          </div>
        )}

        {/* Interactive Action Buttons */}
        <div className="w-full flex flex-col gap-2.5 pt-2">
          {/* Button 1: Pilih Buku Lain (Back to Catalog) */}
          <button
            onClick={onBackToCatalog}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white font-black text-xs sm:text-sm shadow-xl transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>Pilih Buku Lain Di Katalog</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            {/* Button 2: Baca Ulang */}
            <button
              onClick={onReadAgain}
              className="py-3 px-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-amber-300 dark:border-indigo-700 hover:border-amber-500 text-amber-950 dark:text-amber-100 font-extrabold text-xs shadow-md transition-transform hover:scale-[1.02] flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <span>Baca Dari Awal</span>
            </button>

            {/* Button 3: Kuis Cerita (if exists) */}
            {onOpenQuiz ? (
              <button
                onClick={onOpenQuiz}
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-md transition-transform hover:scale-[1.02] flex items-center justify-center gap-1.5"
              >
                <HelpCircle className="w-4 h-4 text-amber-300" />
                <span>Mulai Kuis Seru</span>
              </button>
            ) : onOpenOfflineDownload ? (
              <button
                onClick={onOpenOfflineDownload}
                className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-transform hover:scale-[1.02] flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Offline</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
