import React from 'react';
import { Eye, Coffee, Heart, Sparkles, CheckCircle2, BookOpen } from 'lucide-react';

interface RestReminderModalProps {
  onCloseAndContinue: () => void;
  onCloseAndGoLibrary: () => void;
  isNight?: boolean;
  restMinutes?: number;
}

export const RestReminderModal: React.FC<RestReminderModalProps> = ({
  onCloseAndContinue,
  onCloseAndGoLibrary,
  restMinutes = 20,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div
        className="reader-modal w-full max-w-lg rounded-[1.35rem] p-6 sm:p-8 text-center relative overflow-hidden flex flex-col items-center gap-5"
      >
        {/* Big Friendly Badge */}
        <div className="p-4 rounded-2xl bg-[var(--story-green)] text-white shadow-xl animate-bounce">
          <Eye className="w-12 h-12" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700 text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pengingat Kesehatan Mata</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Waktunya Istirahat Sejenak! 🌿
          </h2>
          <p className="text-xs sm:text-sm mt-2 leading-relaxed opacity-90 max-w-sm mx-auto">
            Adik sudah membaca cerita selama <span className="font-extrabold text-emerald-600 dark:text-emerald-300">{restMinutes} menit</span>. Mari istirahatkan mata dan tubuh sejenak.
          </p>
        </div>

        {/* 3 Rest Steps Cards */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="reader-soft-panel p-3.5 rounded-2xl flex flex-col gap-1">
            <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-xs">
              <Eye className="w-4 h-4 text-emerald-600" />
              <span>Aturan 20-20</span>
            </div>
            <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
              Tatap benda sejauh 6 meter selama 20 detik.
            </p>
          </div>

          <div className="reader-soft-panel p-3.5 rounded-2xl flex flex-col gap-1">
            <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-xs">
              <Coffee className="w-4 h-4 text-amber-600" />
              <span>Minum Air</span>
            </div>
            <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
              Minum segelas air putih agar tubuh tetap segar.
            </p>
          </div>

          <div className="reader-soft-panel p-3.5 rounded-2xl flex flex-col gap-1">
            <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-xs">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>Peregangan</span>
            </div>
            <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
              Regangkan leher dan pundak secara perlahan.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="w-full flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={onCloseAndContinue}
            className="btn-primary w-full py-3.5 px-6 text-sm flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Saya Sudah Istirahat! (Lanjutkan)</span>
          </button>

          <button
            onClick={onCloseAndGoLibrary}
            className="btn-secondary w-full sm:w-auto py-3.5 px-5 text-xs whitespace-nowrap flex items-center justify-center gap-1.5"
          >
            <BookOpen className="w-4 h-4" />
            <span>Ke Perpustakaan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
