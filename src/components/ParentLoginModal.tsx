import React, { useState } from 'react';
import { Lock, Mail, ShieldCheck, X } from 'lucide-react';
import { userAuthStore } from '../utils/userAuthStore';
import type { UserAccount } from '../utils/userAuthStore';

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
}) => {
  const [submittingProvider, setSubmittingProvider] = useState<'google' | 'facebook' | null>(null);
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [parentName, setParentName] = useState('');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  const handleSignIn = async (provider: 'google' | 'facebook') => {
    setSubmittingProvider(provider);
    setErrorMsg(null);
    setNoticeMsg(null);
    try {
      if (provider === 'google') await userAuthStore.signInWithGoogle();
      else await userAuthStore.signInWithFacebook();
    } catch (error) {
      const providerName = provider === 'google' ? 'Google' : 'Facebook';
      setErrorMsg(error instanceof Error ? error.message : `${providerName} Sign-In gagal dimulai.`);
      setSubmittingProvider(null);
    }
  };

  const handleEmailAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg(null);
    setNoticeMsg(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setErrorMsg('Isi email dan kata sandi terlebih dahulu.');
      return;
    }
    if (emailMode === 'signup' && parentName.trim().length < 2) {
      setErrorMsg('Masukkan nama orang tua minimal 2 karakter.');
      return;
    }
    if (emailMode === 'signup' && password.length < 8) {
      setErrorMsg('Kata sandi baru minimal 8 karakter.');
      return;
    }

    setIsSubmittingEmail(true);
    try {
      if (emailMode === 'signin') {
        const user = await userAuthStore.signInWithEmail(normalizedEmail, password);
        await onLoginSuccess(user);
        return;
      }

      const result = await userAuthStore.signUpWithEmail(normalizedEmail, password, parentName);
      if (result.user) {
        await onLoginSuccess(result.user);
        return;
      }

      if (result.requiresEmailConfirmation) {
        setNoticeMsg('Periksa inbox email Anda untuk mengonfirmasi akun, lalu kembali dan masuk.');
        setEmailMode('signin');
        setPassword('');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      if (message.includes('invalid login credentials')) {
        setErrorMsg('Email atau kata sandi tidak cocok.');
      } else if (message.includes('email not confirmed')) {
        setErrorMsg('Email belum dikonfirmasi. Periksa inbox Anda terlebih dahulu.');
      } else if (message.includes('user already registered')) {
        setErrorMsg('Email ini sudah terdaftar. Silakan pilih Masuk.');
      } else if (message.includes('password')) {
        setErrorMsg('Kata sandi belum memenuhi persyaratan keamanan.');
      } else {
        setErrorMsg('Autentikasi email gagal. Coba lagi beberapa saat.');
      }
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const isSubmitting = submittingProvider !== null || isSubmittingEmail;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] p-4 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="parent-login-title"
        className="app-modal relative flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col gap-5 overflow-y-auto rounded-[1.35rem] p-6 md:max-w-2xl sm:p-8"
      >
        {/* Header — compact, single line */}
        <div className="flex items-start justify-between border-b border-default pb-3">
          <div className="flex items-center gap-3">
            <div className="shrink-0 rounded-2xl bg-brand-green p-3 font-black text-white shadow-md">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <h2 id="parent-login-title" className="text-xl font-black tracking-tight sm:text-2xl">Masuk akun orang tua</h2>
              <p className="text-xs font-medium text-secondary">
                {attemptedStoryTitle
                  ? <>Buka cerita <strong>"{attemptedStoryTitle}"</strong> dan koleksi lainnya</>
                  : 'Lanjutkan ke koleksi BacaYuk'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !isSubmitting && onClose()}
            disabled={isSubmitting}
            className="rounded-full p-2 text-secondary transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Tutup modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Alert messages — full width above the two columns */}
        {errorMsg && <div role="alert" className="rounded-xl border border-error/30 bg-error/10 p-3 text-xs font-bold text-error">{errorMsg}</div>}
        {noticeMsg && <div role="status" className="rounded-xl border border-success/30 bg-success/10 p-3 text-xs font-bold text-success">{noticeMsg}</div>}

        {/* Two-column layout on md+, stacked on mobile */}
        <div className="flex flex-col gap-5 md:flex-row md:gap-0">
          {/* Left column — Email form */}
          <div className="flex flex-1 flex-col gap-4 md:pr-6">
            <div className="grid grid-cols-2 rounded-xl bg-surface p-1 text-xs font-black">
              <button
                type="button"
                onClick={() => { setEmailMode('signin'); setErrorMsg(null); setNoticeMsg(null); }}
                disabled={isSubmitting}
                className={`rounded-lg px-3 py-2 transition-colors ${emailMode === 'signin' ? 'bg-card text-primary shadow-sm' : 'text-secondary'}`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => { setEmailMode('signup'); setErrorMsg(null); setNoticeMsg(null); }}
                disabled={isSubmitting}
                className={`rounded-lg px-3 py-2 transition-colors ${emailMode === 'signup' ? 'bg-card text-primary shadow-sm' : 'text-secondary'}`}
              >
                Daftar akun
              </button>
            </div>

            <form className="flex flex-1 flex-col gap-3" onSubmit={(event) => void handleEmailAuth(event)}>
              {emailMode === 'signup' && (
                <div>
                  <label htmlFor="parent-name" className="mb-1 block text-xs font-bold text-primary">Nama orang tua</label>
                  <input
                    id="parent-name"
                    type="text"
                    autoComplete="name"
                    value={parentName}
                    onChange={(event) => setParentName(event.target.value)}
                    disabled={isSubmitting}
                    required
                    minLength={2}
                    className="reader-field w-full rounded-xl px-3.5 py-3 text-sm outline-none focus:border-brand-green"
                    placeholder="Nama orang tua"
                  />
                </div>
              )}
              <div>
                <label htmlFor="login-email" className="mb-1 block text-xs font-bold text-primary">Email</label>
                <input
                  id="login-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                  required
                  className="reader-field w-full rounded-xl px-3.5 py-3 text-sm outline-none focus:border-brand-green"
                  placeholder="orangtua@email.com"
                />
              </div>
              <div>
                <label htmlFor="login-password" className="mb-1 block text-xs font-bold text-primary">Kata sandi</label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete={emailMode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isSubmitting}
                  required
                  minLength={emailMode === 'signup' ? 8 : undefined}
                  className="reader-field w-full rounded-xl px-3.5 py-3 text-sm outline-none focus:border-brand-green"
                  placeholder={emailMode === 'signup' ? 'Minimal 8 karakter' : 'Masukkan kata sandi'}
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-3 text-xs font-black text-white shadow-sm transition-transform hover:scale-[1.01] disabled:opacity-50"
              >
                {isSubmittingEmail ? (
                  <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /><span>Memproses…</span></>
                ) : (
                  <><Mail className="h-4 w-4" /><span>{emailMode === 'signin' ? 'Masuk dengan email' : 'Buat akun dengan email'}</span></>
                )}
              </button>
            </form>
          </div>

          {/* Divider — horizontal on mobile, vertical on md+ */}
          <div className="flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-wider text-muted md:flex-col md:gap-4" aria-hidden="true">
            <span className="h-px flex-1 bg-[var(--border-default)] md:h-auto md:w-px md:flex-1" />
            <span>atau</span>
            <span className="h-px flex-1 bg-[var(--border-default)] md:h-auto md:w-px md:flex-1" />
          </div>

          {/* Right column — Social login */}
          <div className="flex flex-1 flex-col justify-center gap-3 md:pl-6">
            <button
              type="button"
              onClick={() => void handleSignIn('google')}
              disabled={isSubmitting}
              className="reader-field flex w-full items-center justify-center gap-2.5 rounded-2xl px-5 py-3.5 text-xs font-black shadow-sm transition-transform hover:scale-[1.02] hover:border-brand-blue disabled:opacity-50"
            >
              {submittingProvider === 'google' ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-gold border-t-transparent" /><span>Menghubungkan…</span></>
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Lanjutkan dengan Google</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => void handleSignIn('facebook')}
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#1877F2] px-5 py-3.5 text-xs font-black text-white shadow-sm transition-transform hover:scale-[1.02] hover:bg-[#166FE5] disabled:opacity-50"
            >
              {submittingProvider === 'facebook' ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /><span>Menghubungkan…</span></>
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="currentColor" d="M13.5 22v-9h3l.45-3.5H13.5V7.26c0-1.01.28-1.7 1.74-1.7H17.1V2.43c-.32-.04-1.43-.13-2.72-.13-2.69 0-4.53 1.64-4.53 4.66V9.5H6.8V13h3.05v9h3.65Z" />
                  </svg>
                  <span>Lanjutkan dengan Facebook</span>
                </>
              )}
            </button>

            {/* Security note — compact, inside the social column */}
            <div className="flex items-center gap-2 rounded-xl p-2 text-[10px] text-muted">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-brand-green" />
              <span>Login aman & data terlindungi</span>
            </div>
          </div>
        </div>

        {/* Footer — terms */}
        <p className="border-t border-default pt-3 text-center text-[10px] leading-5 text-muted">
          Dengan melanjutkan, Anda menyetujui <a href="/legal#terms" className="font-bold text-brand-green underline">Ketentuan Layanan</a> dan telah membaca <a href="/legal#privacy" className="font-bold text-brand-green underline">Kebijakan Privasi</a>.
        </p>
      </div>
    </div>
  );
};
