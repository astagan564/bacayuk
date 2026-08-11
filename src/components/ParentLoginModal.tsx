import React, { useState } from 'react';
import { userAuthStore, UserAccount } from '../utils/userAuthStore';
import { CheckCircle2, Gift, Lock, ShieldCheck, Sparkles, X } from 'lucide-react';

interface ParentLoginModalProps {
  onClose: () => void;
  onLoginSuccess: (user: UserAccount) => void;
  attemptedStoryTitle?: string;
  isNight?: boolean;
}

export const ParentLoginModal: React.FC<ParentLoginModalProps> = ({
  onClose,
  attemptedStoryTitle,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await userAuthStore.signInWithGoogle();
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Google Sign-In gagal dimulai.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-overlay)] backdrop-blur-sm animate-fade-in">
      <div className="app-modal w-full max-w-lg rounded-[1.35rem] p-6 sm:p-8 relative overflow-hidden flex flex-col gap-6">
        <div className="flex items-start justify-between pb-3 border-b border-default">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-brand-green text-white font-black shadow-md shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-secondary">
                <Gift className="w-3.5 h-3.5 text-brand-green" />
                <span>Akses internal pembaca</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Masuk dengan Google</h2>
            </div>
          </div>

          <button
            onClick={() => !isSubmitting && onClose()}
            disabled={isSubmitting}
            className={`p-2 rounded-full hover:bg-surface text-secondary transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Tutup modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="reader-soft-panel p-4 rounded-2xl flex flex-col gap-1.5 text-xs">
          <div className="flex items-center gap-2 text-primary font-black text-sm">
            <Sparkles className="w-4 h-4 text-brand-gold" />
            <span>Akun Google internal BacaYuk</span>
          </div>
          <p className="text-secondary font-medium leading-relaxed">
            {attemptedStoryTitle ? (
              <>
                Masuk dengan akun Google yang telah diizinkan untuk membuka cerita <strong>“{attemptedStoryTitle}”</strong> dan koleksi internal lainnya.
              </>
            ) : (
              'Gunakan salah satu akun Google internal yang telah diizinkan pada konfigurasi OAuth BacaYuk.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-secondary">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            <span>Sesi Supabase Auth</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            <span>Google OAuth terverifikasi</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-error/10 border border-error/30 text-error text-xs font-bold">
            {errorMsg}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className="reader-field w-full py-3.5 px-5 rounded-2xl hover:border-brand-blue font-black text-xs shadow-sm transition-transform hover:scale-[1.02] flex items-center justify-center gap-2.5 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
              <span>Menghubungkan akun Google...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Lanjutkan dengan Google</span>
            </>
          )}
        </button>

        <div className="reader-soft-panel p-3 rounded-xl text-[11px] text-secondary flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-green shrink-0" />
          <span>Login diverifikasi melalui Google OAuth dan Supabase Auth.</span>
        </div>
      </div>
    </div>
  );
};
