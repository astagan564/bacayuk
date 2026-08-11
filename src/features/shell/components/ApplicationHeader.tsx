import {
  BarChart3,
  Bell,
  LogOut,
  Moon,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
} from 'lucide-react';
import packageJson from '../../../../package.json';
import bacaYukLogo from '../../../assets/bacayuk-logo.svg';
import bacaYukMark from '../../../assets/bacayuk-mark.svg';
import type { UserAccount } from '../../../utils/userAuthStore';

interface ApplicationHeaderProps {
  currentUser: UserAccount | null;
  hasUnreadChangelog: boolean;
  isNight: boolean;
  isWhatsNewOpen: boolean;
  onAdmin: () => void;
  onChangelog: () => void;
  onHome: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onSettings: () => void;
  onStats: () => void;
  onToggleTheme: () => void;
  onToggleWhatsNew: () => void;
  onCloseWhatsNew: () => void;
}

export function ApplicationHeader({
  currentUser,
  hasUnreadChangelog,
  isNight,
  isWhatsNewOpen,
  onAdmin,
  onChangelog,
  onCloseWhatsNew,
  onHome,
  onLogin,
  onLogout,
  onSettings,
  onStats,
  onToggleTheme,
  onToggleWhatsNew,
}: ApplicationHeaderProps) {
  return (
    <header className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-b flex items-center justify-between gap-2 z-40 transition-colors duration-500 backdrop-blur-xl header-surface">
      <div
        onClick={onHome}
        className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5 cursor-pointer transition-opacity hover:opacity-85"
      >
        <img src={bacaYukMark} alt="BacaYuk" className="h-10 w-10 shrink-0 sm:hidden" />
        <div className="hidden min-w-0 flex-col justify-center sm:flex">
          <img src={bacaYukLogo} alt="BacaYuk" className="h-10 w-auto max-w-[150px]" />
          <p className="ml-[48px] -mt-2 text-[11px] font-semibold text-secondary">
            Perpustakaan cerita keluarga
          </p>
        </div>
      </div>

      <div className="flex min-w-0 items-center justify-end gap-1 sm:gap-2">
        {currentUser ? (
          <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold auth-chip">
            <User className="w-4 h-4 shrink-0" />
            <span className="hidden md:inline truncate max-w-[120px]">{currentUser.name}</span>
            <button
              onClick={onLogout}
              className="p-1 hover:bg-black/10 rounded-lg text-inherit transition-colors ml-0.5"
              title="Keluar Akun Orang Tua"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onLogin}
            className="btn-primary flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs shrink-0"
            title="Daftar/Masuk Akun Gratis Orang Tua"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Masuk orang tua</span>
          </button>
        )}

        <div className="relative">
          <button
            onClick={onToggleWhatsNew}
            className="relative flex items-center justify-center p-2 rounded-xl transition-colors icon-btn-surface"
            title="Apa yang Baru?"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {hasUnreadChangelog && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border border-default animate-pulse" />
            )}
          </button>

          {isWhatsNewOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={onCloseWhatsNew} />
              <div className="absolute right-0 top-full mt-2 w-64 sm:w-72 rounded-2xl shadow-xl overflow-hidden z-50 app-modal">
                <div className="p-3 sm:p-4 border-b border-default bg-surface/50">
                  <h3 className="text-sm sm:text-base font-bold flex items-center gap-2 text-primary">
                    <Sparkles className="w-4 h-4 text-warning" />
                    Update Terbaru v{packageJson.version}
                  </h3>
                </div>
                <div className="p-3 sm:p-4 text-xs sm:text-sm space-y-2 text-secondary">
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong>Buat buku lebih cepat</strong> dari ide atau naskah singkat.</li>
                    <li><strong>Mode baca baru</strong> menampilkan gambar kiri dan teks kanan.</li>
                    <li><strong>Terjemahan, suara, kuis, dan ilustrasi</strong> kini lebih akurat.</li>
                  </ul>
                </div>
                <div className="p-3 border-t border-default bg-surface/50">
                  <button onClick={onChangelog} className="w-full py-2 px-4 btn-secondary text-xs sm:text-sm">
                    Lihat detail
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <button
          onClick={onSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-transform hover:scale-[1.02] shrink-0 auth-chip hover:bg-surface"
          title="Pengaturan Orang Tua"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Pengaturan</span>
        </button>

        <button
          onClick={onAdmin}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-transform hover:scale-[1.02] shrink-0 auth-chip hover:bg-surface text-secondary"
          title="Buka Panel Kontrol Admin Internal"
        >
          <ShieldCheck className="w-4 h-4" />
          <span className="hidden sm:inline">Admin</span>
        </button>

        <button
          onClick={onStats}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 hover:scale-[1.02] auth-chip hover:bg-surface"
          title="Lihat Statistik Membaca Anak"
        >
          <BarChart3 className="w-4 h-4" />
          <span className="hidden sm:inline">Statistik</span>
        </button>

        <button
          onClick={onToggleTheme}
          className="flex items-center justify-center gap-2 w-10 sm:w-auto px-0 sm:px-3 py-2 sm:py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 hover:scale-[1.02] shrink-0 auth-chip hover:bg-surface"
          title={isNight ? 'Beralih ke Mode Siang' : 'Beralih ke Mode Malam'}
        >
          {isNight ? <Moon className="w-4 h-4 fill-current" /> : <Sun className="w-4 h-4" />}
          <span className="hidden sm:inline">{isNight ? 'Malam' : 'Siang'}</span>
        </button>
      </div>
    </header>
  );
}
