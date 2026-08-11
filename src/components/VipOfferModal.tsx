import React from 'react';
import { Sparkles, X, Lock, BookOpen, Wand2, ShieldCheck } from 'lucide-react';

interface VipOfferModalProps {
  onClose: () => void;
  onSubscribe: () => void;
}

export const VipOfferModal: React.FC<VipOfferModalProps> = ({ onClose, onSubscribe }) => {
  return (
    <div className="fixed inset-0 z-[60] bg-[var(--color-overlay)] backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="reader-modal rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative border-2 border-brand-gold/30">
        {/* Header */}
        <div className="absolute top-4 right-4">
          <button
            onClick={onClose}
            className="p-2 reader-soft-panel hover:bg-surface-hover text-secondary hover:text-primary rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 pb-6 flex flex-col items-center text-center mt-4">
          <div className="w-20 h-20 rounded-2xl bg-brand-gold flex items-center justify-center text-white mb-6 shadow-lg shadow-brand-gold/30">
            <Lock className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-black text-primary mb-2 tracking-tight">
            Fitur Eksklusif <span className="text-brand-gold">VIP</span>
          </h2>
          <p className="text-secondary text-sm mb-6 leading-relaxed">
            Wah! Fitur <strong>Buat Buku Cerita AI</strong> ini sangat ajaib, namun saat ini hanya terbuka untuk Pelanggan VIP.
          </p>

          <div className="w-full reader-soft-panel rounded-2xl p-4 border border-default mb-6 flex flex-col gap-3">
            <div className="flex items-start gap-3 text-left">
              <div className="mt-0.5 shrink-0 bg-brand-gold/20 p-1.5 rounded-lg text-brand-gold">
                <Wand2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-primary">Buat 10 Cerita AI / Bulan</h4>
                <p className="text-[10px] text-secondary">Rancang karakter & tema sendiri sebebasnya.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 text-left">
              <div className="mt-0.5 shrink-0 bg-brand-gold/20 p-1.5 rounded-lg text-brand-gold">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-primary">Bebas Unduh Semua Buku</h4>
                <p className="text-[10px] text-secondary">Akses cetak & PDF/EPUB semua koleksi buku tanpa bayar lagi.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-left">
              <div className="mt-0.5 shrink-0 bg-brand-gold/20 p-1.5 rounded-lg text-brand-gold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-primary">Aman Tanpa Iklan</h4>
                <p className="text-[10px] text-secondary">Lingkungan baca yang aman, nyaman, dan edukatif.</p>
              </div>
            </div>
          </div>

          <button
            onClick={onSubscribe}
            className="w-full py-3.5 rounded-2xl bg-brand-gold hover:opacity-90 text-white font-black text-sm uppercase tracking-wide shadow-xl flex items-center justify-center gap-2 transform transition-transform hover:scale-[1.02] active:scale-95"
          >
            <Sparkles className="w-5 h-5" />
            <span>Aktifkan VIP Sekarang</span>
          </button>

          <button
            onClick={onClose}
            className="mt-4 text-xs font-bold text-secondary hover:text-primary transition-colors"
          >
            Nanti Saja
          </button>
        </div>
      </div>
    </div>
  );
};
