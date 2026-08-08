import React, { useState, useEffect } from 'react';
import { ReadingSettings } from '../types';
import { musicPlayer } from '../utils/soundEngine';
import {
  Music,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Grid,
  Type,
  Layout,
  ArrowLeft,
  Sun,
  Moon,
  Bookmark,
  Mic,
  Download,
  Menu,
  X,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface NavigationControlsProps {
  title: string;
  currentPageIndex: number;
  totalPages: number;
  onPageChange: (newIndex: number) => void;
  settings: ReadingSettings;
  onUpdateSettings: (newSettings: Partial<ReadingSettings>) => void;
  onToggleThumbnails: () => void;
  onBackToLibrary: () => void;
  isBookmarked?: boolean;
  savedBookmarkPage?: number;
  onToggleBookmark?: () => void;
  onOpenVoiceRecorder?: () => void;
  onOpenOfflineDownload?: () => void;
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
  title,
  currentPageIndex,
  totalPages,
  onPageChange,
  settings,
  onUpdateSettings,
  onToggleThumbnails,
  onBackToLibrary,
  isBookmarked = false,
  onToggleBookmark,
  onOpenVoiceRecorder,
  onOpenOfflineDownload,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);
  const [isNavHidden, setIsNavHidden] = useState(false);

  const isNight = settings.themeMode === 'night';
  const isDouble = settings.displayView === 'double';
  const pageStep = isDouble ? 2 : 1;
  const displayCurrentPage = currentPageIndex + 1;
  const maxAllowedIndex = isDouble && totalPages % 2 !== 0 ? totalPages - 1 : totalPages;
  const canGoPrev = currentPageIndex > 0;
  const canGoNext = currentPageIndex + pageStep <= maxAllowedIndex;

  const pageLabel =
    currentPageIndex === totalPages
      ? 'Sampul belakang'
      : isDouble && displayCurrentPage < totalPages
        ? `Hal. ${displayCurrentPage}-${displayCurrentPage + 1} / ${totalPages}`
        : `Hal. ${displayCurrentPage} / ${totalPages}`;

  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFSChange);
    return () => document.removeEventListener('fullscreenchange', onFSChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.warn);
    } else {
      document.exitFullscreen?.();
    }
  };

  const toggleBgMusic = () => {
    const isPlaying = musicPlayer.toggle();
    onUpdateSettings({ bgMusic: isPlaying });
  };

  const goPrev = () => {
    if (canGoPrev) {
      onPageChange(Math.max(0, currentPageIndex - pageStep));
    }
  };

  const goNext = () => {
    if (canGoNext) {
      onPageChange(currentPageIndex + pageStep);
    }
  };

  const SectionLabel = ({ text }: { text: string }) => (
    <div className="flex items-center gap-2 pt-1">
      <div className={`flex-1 h-px ${isNight ? 'bg-blue-900/50' : 'bg-[#eadbc1]'}`} />
      <span className={`text-[10px] font-black uppercase ${isNight ? 'text-blue-300' : 'text-[var(--muted-ink)]'}`}>
        {text}
      </span>
      <div className={`flex-1 h-px ${isNight ? 'bg-blue-900/50' : 'bg-[#eadbc1]'}`} />
    </div>
  );

  const ToggleRow = ({
    label,
    icon: Icon,
    isOn,
    onClick,
  }: {
    label: string;
    icon: React.ElementType;
    isOn: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        isOn
          ? 'bg-[var(--story-green)] text-white'
          : 'reader-soft-panel text-[var(--ink)] dark:text-slate-200'
      }`}
    >
      <span className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 shrink-0" />
        {label}
      </span>
      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-lg ${isOn ? 'bg-white/20' : 'bg-black/5 dark:bg-white/10'}`}>
        {isOn ? 'ON' : 'OFF'}
      </span>
    </button>
  );

  const desktopSidebar = (
    <aside className="hidden lg:flex reader-modal flex-col gap-3 w-80 shrink-0 sticky top-20 max-h-[calc(100vh-5.5rem)] overflow-y-auto rounded-[1.1rem] p-5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#d8c29f] dark:[&::-webkit-scrollbar-thumb]:bg-blue-900">
      <div className="flex flex-col gap-2">
        <button
          onClick={onBackToLibrary}
          className="btn-secondary w-full flex items-center gap-2 px-3 py-2 text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          Koleksi buku
        </button>
        <h2 className="text-sm font-bold leading-snug text-center px-1 line-clamp-2 font-sans mb-0" title={title}>
          {title}
        </h2>
      </div>

      <div className="flex flex-col gap-1.5">
        <input
          type="range"
          min={0}
          max={maxAllowedIndex}
          value={currentPageIndex}
          onChange={(e) => onPageChange(parseInt(e.target.value, 10))}
          className="w-full accent-[var(--story-green)] h-2 cursor-pointer rounded-lg"
          aria-label="Pilih halaman"
        />
        <div className="flex items-center justify-between gap-1">
          <button
            onClick={goPrev}
            disabled={!canGoPrev}
            className="reader-soft-panel p-1 rounded-lg transition-colors disabled:opacity-30"
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-bold text-center flex-1 text-[var(--magic-blue)] dark:text-blue-200">
            {pageLabel}
          </span>
          <button
            onClick={goNext}
            disabled={!canGoNext}
            className="reader-soft-panel p-1 rounded-lg transition-colors disabled:opacity-30"
            aria-label="Halaman berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <SectionLabel text="Bahasa" />
      <div className="reader-soft-panel grid grid-cols-3 gap-1 rounded-xl p-1">
        {([
          { mode: 'id' as const, label: 'ID' },
          { mode: 'en' as const, label: 'EN' },
          { mode: 'dual' as const, label: 'ID+EN' },
        ]).map(({ mode, label }) => {
          const isActive = settings.languageMode === mode || (!settings.languageMode && mode === 'id');
          return (
            <button
              key={mode}
              onClick={() => onUpdateSettings({ languageMode: mode })}
              className={`py-2 rounded-lg text-xs font-black transition-all ${
                isActive ? 'bg-[var(--magic-blue)] text-white' : 'text-[var(--muted-ink)] dark:text-slate-300'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <SectionLabel text="Pengaturan" />
      <button
        onClick={() => onUpdateSettings({ themeMode: isNight ? 'day' : 'night' })}
        className="reader-soft-panel w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold"
      >
        <span className="flex items-center gap-2.5">
          {isNight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          Tema
        </span>
        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/10">
          {isNight ? 'Malam' : 'Siang'}
        </span>
      </button>

      <button
        onClick={() => onUpdateSettings({ displayView: isDouble ? 'single' : 'double' })}
        className="reader-soft-panel w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold"
      >
        <span className="flex items-center gap-2.5">
          <Layout className="w-4 h-4 shrink-0" />
          Tampilan
        </span>
        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/10">
          {isDouble ? '2 Hal.' : '1 Hal.'}
        </span>
      </button>

      <ToggleRow label="Putar otomatis" icon={settings.autoPlay ? Pause : Play} isOn={settings.autoPlay} onClick={() => onUpdateSettings({ autoPlay: !settings.autoPlay })} />
      <ToggleRow label="Musik latar" icon={Music} isOn={settings.bgMusic} onClick={toggleBgMusic} />

      <div className="reader-soft-panel flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl">
        <span className="flex items-center gap-2.5 text-sm font-semibold shrink-0">
          <Type className="w-4 h-4 shrink-0" />
          Ukuran teks
        </span>
        <div className="flex items-center gap-0.5 rounded-lg p-0.5 bg-white/60 dark:bg-slate-950/40">
          {(['sm', 'base', 'lg'] as const).map((sz) => (
            <button
              key={sz}
              onClick={() => onUpdateSettings({ fontSize: sz })}
              className={`px-2 py-1 rounded font-black uppercase text-[10px] transition-colors ${settings.fontSize === sz ? 'bg-[var(--magic-blue)] text-white' : 'text-[var(--muted-ink)] dark:text-slate-300'}`}
            >
              {sz}
            </button>
          ))}
        </div>
      </div>

      <SectionLabel text="Alat" />
      <div className="grid grid-cols-2 gap-2">
        {onOpenVoiceRecorder && (
          <button
            onClick={onOpenVoiceRecorder}
            className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm transition-all hover:scale-[1.02]"
          >
            <Mic className="w-5 h-5" />
            <span className="text-center leading-tight">Rekam suara</span>
          </button>
        )}
        {onOpenOfflineDownload && (
          <button
            onClick={onOpenOfflineDownload}
            className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl bg-[var(--story-green)] hover:bg-[#27795b] text-white text-xs font-bold shadow-sm transition-all hover:scale-[1.02]"
          >
            <Download className="w-5 h-5" />
            <span className="text-center leading-tight">Unduh offline</span>
          </button>
        )}
        <button
          onClick={onToggleBookmark}
          className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-[1.02] ${isBookmarked ? 'bg-[var(--warm-gold)] text-[#3a2910]' : 'reader-soft-panel'}`}
        >
          <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-[#3a2910]' : ''}`} />
          <span>{isBookmarked ? 'Ditandai' : 'Tandai'}</span>
        </button>
        <button
          onClick={onToggleThumbnails}
          className="reader-soft-panel flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-[1.02]"
        >
          <Grid className="w-5 h-5" />
          <span>Daftar hal.</span>
        </button>
        <button
          onClick={toggleFullscreen}
          className="reader-soft-panel col-span-2 flex items-center justify-center gap-2 px-2 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-[1.02]"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          <span>{isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}</span>
        </button>
      </div>
    </aside>
  );

  const mobileUi = (
    <>
      {isNavHidden ? (
        <div className="lg:hidden fixed bottom-4 right-4 z-40">
          <button
            onClick={() => setIsNavHidden(false)}
            className="reader-modal p-3 rounded-2xl transition-all hover:scale-[1.02]"
            aria-label="Tampilkan kontrol baca"
          >
            <Eye className="w-6 h-6" />
          </button>
        </div>
      ) : (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl px-3 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex flex-col gap-2 bg-[#fffaf0]/94 dark:bg-[#101923]/94 border-[#eadbc1] dark:border-blue-900/60 shadow-[0_-10px_34px_rgba(0,0,0,0.22)]">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={onBackToLibrary}
              className="h-11 w-11 rounded-2xl btn-secondary flex items-center justify-center shrink-0"
              aria-label="Kembali ke koleksi"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <button
              onClick={goPrev}
              disabled={!canGoPrev}
              className="h-12 w-14 rounded-2xl bg-[var(--ink)] text-[#fff7e6] dark:bg-blue-100 dark:text-[#101923] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-transform active:scale-95"
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>

            <div className="min-w-0 flex-1 flex flex-col items-center gap-1">
              <p className="w-full truncate text-center text-[11px] font-bold text-[var(--muted-ink)] dark:text-blue-200">
                {title}
              </p>
              <button
                onClick={onToggleThumbnails}
                className="w-full rounded-xl bg-white/70 dark:bg-blue-950/45 border border-[#eadbc1] dark:border-blue-900/60 px-3 py-2 text-xs font-extrabold text-[var(--ink)] dark:text-slate-100 shadow-sm"
              >
                {pageLabel}
              </button>
              <input
                type="range"
                min={0}
                max={maxAllowedIndex}
                value={currentPageIndex}
                onChange={(e) => onPageChange(parseInt(e.target.value, 10))}
                className="w-full accent-[var(--story-green)] h-1.5 cursor-pointer"
                aria-label="Pilih halaman"
              />
            </div>

            <button
              onClick={goNext}
              disabled={!canGoNext}
              className="h-12 w-14 rounded-2xl bg-[var(--story-green)] text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-transform active:scale-95"
              aria-label="Halaman berikutnya"
            >
              <ChevronRight className="w-7 h-7" />
            </button>

            <button
              onClick={() => setIsMobileToolsOpen(true)}
              className="h-11 w-11 rounded-2xl btn-secondary flex items-center justify-center shrink-0"
              aria-label="Buka alat baca"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => setIsNavHidden(true)}
            className="self-center inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-[var(--muted-ink)] dark:text-slate-400"
          >
            <EyeOff className="w-3.5 h-3.5" />
            Sembunyikan kontrol
          </button>
        </div>
      )}

      {isMobileToolsOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileToolsOpen(false)} />
          <div className="reader-modal relative rounded-t-[1.35rem] p-4 flex flex-col gap-4 max-h-[88vh] overflow-y-auto pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="flex justify-between items-start gap-3">
              <div>
                <h3 className="text-lg font-black font-sans mb-0">Alat baca</h3>
                <p className="text-xs text-[var(--muted-ink)] dark:text-slate-300">Atur tampilan, suara, dan halaman.</p>
              </div>
              <button onClick={() => setIsMobileToolsOpen(false)} className="p-2 rounded-xl btn-secondary" aria-label="Tutup alat baca">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {onOpenVoiceRecorder && (
                <button onClick={() => { onOpenVoiceRecorder(); setIsMobileToolsOpen(false); }} className="min-h-16 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white p-3 flex items-center gap-3 text-left font-bold shadow-sm">
                  <Mic className="w-5 h-5 shrink-0" />
                  <span className="text-sm leading-tight">Rekam suara</span>
                </button>
              )}
              {onOpenOfflineDownload && (
                <button onClick={() => { onOpenOfflineDownload(); setIsMobileToolsOpen(false); }} className="min-h-16 rounded-2xl bg-[var(--story-green)] hover:bg-[#27795b] text-white p-3 flex items-center gap-3 text-left font-bold shadow-sm">
                  <Download className="w-5 h-5 shrink-0" />
                  <span className="text-sm leading-tight">Unduh offline</span>
                </button>
              )}
              <button onClick={onToggleBookmark} className={`min-h-16 rounded-2xl p-3 flex items-center gap-3 text-left font-bold shadow-sm ${isBookmarked ? 'bg-[var(--warm-gold)] text-[#3a2910]' : 'reader-soft-panel text-[var(--ink)] dark:text-slate-100'}`}>
                <Bookmark className={`w-5 h-5 shrink-0 ${isBookmarked ? 'fill-[#3a2910]' : ''}`} />
                <span className="text-sm leading-tight">{isBookmarked ? 'Ditandai' : 'Tandai halaman'}</span>
              </button>
              <button onClick={() => { onToggleThumbnails(); setIsMobileToolsOpen(false); }} className="reader-soft-panel min-h-16 rounded-2xl p-3 flex items-center gap-3 text-left font-bold text-[var(--ink)] dark:text-slate-100">
                <Grid className="w-5 h-5 shrink-0 text-[var(--magic-blue)]" />
                <span className="text-sm leading-tight">Daftar halaman</span>
              </button>
            </div>

            <div className="reader-soft-panel rounded-2xl p-3 flex flex-col gap-3">
              <span className="text-xs font-black text-[var(--muted-ink)] dark:text-blue-200">Bahasa cerita</span>
              <div className="grid grid-cols-3 gap-2">
                {([{ m: 'id' as const, l: 'ID' }, { m: 'en' as const, l: 'EN' }, { m: 'dual' as const, l: 'ID + EN' }]).map(({ m, l }) => (
                  <button
                    key={m}
                    onClick={() => onUpdateSettings({ languageMode: m })}
                    className={`h-10 rounded-xl text-xs font-black transition-colors ${
                      settings.languageMode === m || (!settings.languageMode && m === 'id')
                        ? 'bg-[var(--magic-blue)] text-white'
                        : 'bg-white/60 dark:bg-slate-900/50 text-[var(--muted-ink)] dark:text-slate-300'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="reader-soft-panel rounded-2xl p-3 flex flex-col gap-2">
              <ToggleRow label="Putar otomatis" icon={settings.autoPlay ? Pause : Play} isOn={settings.autoPlay} onClick={() => onUpdateSettings({ autoPlay: !settings.autoPlay })} />
              <ToggleRow label="Musik latar" icon={Music} isOn={settings.bgMusic} onClick={toggleBgMusic} />
              <button onClick={() => onUpdateSettings({ displayView: isDouble ? 'single' : 'double' })} className="min-h-12 rounded-xl flex items-center justify-between gap-3 text-sm font-bold px-3">
                <span className="flex items-center gap-2"><Layout className="w-4 h-4" /> Tampilan</span>
                <span className="text-xs text-[var(--muted-ink)] dark:text-blue-200">{isDouble ? '2 halaman' : '1 halaman'}</span>
              </button>
              <button onClick={() => onUpdateSettings({ themeMode: isNight ? 'day' : 'night' })} className="min-h-12 rounded-xl flex items-center justify-between gap-3 text-sm font-bold px-3">
                <span className="flex items-center gap-2">{isNight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />} Tema</span>
                <span className="text-xs text-[var(--muted-ink)] dark:text-blue-200">{isNight ? 'Malam' : 'Siang'}</span>
              </button>
            </div>

            <div className="reader-soft-panel rounded-2xl p-3 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-bold"><Type className="w-4 h-4" /> Ukuran teks</span>
              <div className="flex gap-1 bg-white/60 dark:bg-slate-900/50 p-1 rounded-xl">
                {(['sm', 'base', 'lg'] as const).map((sz) => (
                  <button key={sz} onClick={() => onUpdateSettings({ fontSize: sz })} className={`px-3 py-1.5 rounded-lg font-black uppercase text-[10px] transition-colors ${settings.fontSize === sz ? 'bg-[var(--magic-blue)] text-white' : 'text-[var(--muted-ink)] dark:text-slate-300'}`}>{sz}</button>
                ))}
              </div>
            </div>

            <button onClick={toggleFullscreen} className="btn-secondary w-full min-h-12 px-4 text-sm flex items-center justify-center gap-2">
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span>{isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {desktopSidebar}
      {mobileUi}
    </>
  );
};
