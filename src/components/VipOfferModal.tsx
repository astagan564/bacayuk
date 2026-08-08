import React from 'react';
import { Sparkles, X, Lock, BookOpen, Wand2, ShieldCheck } from 'lucide-react';

interface VipOfferModalProps {
  onClose: () => void;
  onSubscribe: () => void;
}

export const VipOfferModal: React.FC<VipOfferModalProps> = ({ onClose, onSubscribe }) => {
  return (
    <div className="fixed inset-0 z-[60] bg-indigo-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-gradient-to-b from-indigo-900 to-purple-900 border-2 border-indigo-500 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="absolute top-4 right-4">
          <button
            onClick={onClose}
            className="p-2 bg-indigo-950/50 hover:bg-indigo-950 text-indigo-300 hover:text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 pb-6 flex flex-col items-center text-center mt-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-500 to-rose-500 flex items-center justify-center text-white mb-6 shadow-lg shadow-purple-500/30">
            <Lock className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
            Fitur Eksklusif <span className="text-amber-400">VIP</span>
          </h2>
          <p className="text-indigo-200 text-sm mb-6 leading-relaxed">
            Wah! Fitur <strong>Buat Buku Cerita AI</strong> ini sangat ajaib, namun saat ini hanya terbuka untuk Pelanggan VIP.
          </p>

          <div className="w-full bg-indigo-950/40 rounded-2xl p-4 border border-indigo-800 mb-6 flex flex-col gap-3">
            <div className="flex items-start gap-3 text-left">
              <div className="mt-0.5 shrink-0 bg-indigo-800 p-1.5 rounded-lg text-indigo-300">
                <Wand2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-indigo-100">Buat 10 Cerita AI / Bulan</h4>
                <p className="text-[10px] text-indigo-300">Rancang karakter & tema sendiri sebebasnya.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 text-left">
              <div className="mt-0.5 shrink-0 bg-indigo-800 p-1.5 rounded-lg text-indigo-300">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-indigo-100">Bebas Unduh Semua Buku</h4>
                <p className="text-[10px] text-indigo-300">Akses cetak & PDF/EPUB semua koleksi buku tanpa bayar lagi.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-left">
              <div className="mt-0.5 shrink-0 bg-indigo-800 p-1.5 rounded-lg text-indigo-300">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-indigo-100">Aman Tanpa Iklan</h4>
                <p className="text-[10px] text-indigo-300">Lingkungan baca yang aman, nyaman, dan edukatif.</p>
              </div>
            </div>
          </div>

          <button
            onClick={onSubscribe}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-amber-950 font-black text-sm uppercase tracking-wide shadow-xl flex items-center justify-center gap-2 transform transition-transform hover:scale-[1.02] active:scale-95"
          >
            <Sparkles className="w-5 h-5" />
            <span>Aktifkan VIP Sekarang</span>
          </button>

          <button
            onClick={onClose}
            className="mt-4 text-xs font-bold text-indigo-300 hover:text-white transition-colors"
          >
            Nanti Saja
          </button>
        </div>
      </div>
    </div>
  );
};
