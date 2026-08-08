import React, { useState } from 'react';
import { userAuthStore, UserAccount } from '../utils/userAuthStore';
import {
  Sparkles,
  Lock,
  X,
  CheckCircle2,
  ShieldCheck,
  Phone,
  Mail,
  BookOpen,
  Gift,
  Heart,
  ArrowRight,
} from 'lucide-react';

interface ParentLoginModalProps {
  onClose: () => void;
  onLoginSuccess: (user: UserAccount) => void;
  attemptedStoryTitle?: string;
  isNight?: boolean;
}

export const ParentLoginModal: React.FC<ParentLoginModalProps> = ({
  onClose,
  onLoginSuccess,
  attemptedStoryTitle,
  isNight = false,
}) => {
  const [tab, setTab] = useState<'google' | 'whatsapp' | 'email'>('google');
  const [parentName, setParentName] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTabChange = (newTab: 'google' | 'whatsapp' | 'email') => {
    setTab(newTab);
    setErrorMsg(null);
  };

  // Quick Google Sign-In Simulation
  const handleGoogleSignIn = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const googleUser: UserAccount = {
        id: `usr_g_${Math.floor(100000 + Math.random() * 900000)}`,
        name: parentName.trim() || 'Orang Tua Hebat',
        email: emailInput.trim() || 'orangtua.bunda@gmail.com',
        loginMethod: 'google',
        createdAt: new Date().toISOString(),
      };
      userAuthStore.setUser(googleUser);
      setIsSubmitting(false);
      onLoginSuccess(googleUser);
    }, 1200);
  };

  // WhatsApp Login Simulation
  const handleWhatsAppLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPhone = phoneInput.replace(/\D/g, '');
    if (!numericPhone || numericPhone.length < 8) {
      setErrorMsg('Mohon masukkan nomor WhatsApp yang valid (minimal 8 angka)!');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);

    setTimeout(() => {
      const waUser: UserAccount = {
        id: `usr_wa_${Math.floor(100000 + Math.random() * 900000)}`,
        name: parentName.trim() || `Orang Tua (${phoneInput.slice(-4)})`,
        email: emailInput.trim() || `wa.${phoneInput.replace(/\D/g, '')}@buku-cerita.com`,
        phone: phoneInput.trim(),
        loginMethod: 'whatsapp',
        createdAt: new Date().toISOString(),
      };
      userAuthStore.setUser(waUser);
      setIsSubmitting(false);
      onLoginSuccess(waUser);
    }, 1200);
  };

  // Email Login
  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentName.trim()) {
      setErrorMsg('Mohon isi nama Orang Tua/Bunda!');
      return;
    }
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setErrorMsg('Mohon masukkan alamat email yang valid!');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);

    setTimeout(() => {
      const emailUser: UserAccount = {
        id: `usr_em_${Math.floor(100000 + Math.random() * 900000)}`,
        name: parentName.trim(),
        email: emailInput.trim().toLowerCase(),
        phone: phoneInput.trim() || undefined,
        loginMethod: 'email',
        createdAt: new Date().toISOString(),
      };
      userAuthStore.setUser(emailUser);
      setIsSubmitting(false);
      onLoginSuccess(emailUser);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border-4 relative overflow-hidden flex flex-col gap-6 ${
          isNight
            ? 'bg-slate-900 text-slate-100 border-indigo-500/80'
            : 'bg-amber-50 text-amber-950 border-amber-300'
        }`}
      >
        {/* Decorative Glow */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-amber-400/25 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-amber-200/50">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-amber-950 font-black shadow-md shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-indigo-300">
                <Gift className="w-3.5 h-3.5 text-amber-600" />
                <span>Akses Akun Gratis Pembaca</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Daftar Akun Gratis Orang Tua</h2>
            </div>
          </div>

          <button
            onClick={() => !isSubmitting && onClose()}
            disabled={isSubmitting}
            className={`p-2 rounded-full hover:bg-black/10 transition-colors ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Tutup Modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Locked Message Callout */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-100 to-orange-100 dark:from-slate-800 dark:to-slate-900 border border-amber-300 dark:border-indigo-700/80 flex flex-col gap-1.5 text-xs shadow-sm">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-black text-sm">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Suka dengan cerita kami?</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
            {attemptedStoryTitle ? (
              <>
                Anda telah menyelesaikan 1 cerita gratis! Buat akun gratis untuk membuka akses baca online tak terbatas untuk cerita{' '}
                <strong>"{attemptedStoryTitle}"</strong> dan semua buku lainnya!
              </>
            ) : (
              'Yuk, buat akun gratis untuk membaca semua koleksi buku cerita anak interaktif di website kami!'
            )}
          </p>
        </div>

        {/* Perks Checklist */}
        <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Akses Baca Online Semua Buku</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Info Notifikasi Rilis Cerita Baru</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Tips Parenting & Dongeng Anak</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Voucher Diskon Unduh PDF/EPUB</span>
          </div>
        </div>

        {/* Login Method Tabs */}
        <div className="flex rounded-2xl bg-black/5 dark:bg-white/5 p-1 gap-1">
          <button
            type="button"
            onClick={() => handleTabChange('google')}
            className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 ${
              tab === 'google'
                ? 'bg-white dark:bg-slate-800 shadow-md text-amber-950 dark:text-amber-200'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('whatsapp')}
            className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 ${
              tab === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('email')}
            className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 ${
              tab === 'email'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Tab 1: Google One-Click Login */}
        {tab === 'google' && (
          <div className="flex flex-col gap-4 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Masuk secara instan dengan akun Google Anda tanpa perlu mengingat kata sandi.
            </p>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full py-3.5 px-5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-amber-400 text-slate-800 dark:text-slate-100 font-black text-xs shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                  <span>Menghubungkan Akun Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Lanjutkan Dengan Google Sign-In</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Tab 2: WhatsApp Login */}
        {tab === 'whatsapp' && (
          <form onSubmit={handleWhatsAppLogin} className="flex flex-col gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Nomor WhatsApp Orang Tua
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3 text-emerald-600" />
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="0812 3456 7890"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Nama Panggilan (Opsional)
              </label>
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Contoh: Bunda Ani"
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifikasi WhatsApp...</span>
                </>
              ) : (
                <>
                  <span>Masuk Dengan WhatsApp</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Tab 3: Standard Email Form */}
        {tab === 'email' && (
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Nama Lengkap Orang Tua / Bunda
              </label>
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Alamat Email Orang Tua
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="orangtua@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white font-black text-xs shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Mendaftarkan Akun Orang Tua...</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  <span>Daftar & Buka Semua Koleksi Buku</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Security Privacy Guarantee */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-900 dark:text-indigo-200 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Data email/nomor kontak Anda 100% aman dan hanya digunakan untuk mengirimkan kabar rilis cerita baru & tips parenting bersama anak.
          </span>
        </div>
      </div>
    </div>
  );
};
