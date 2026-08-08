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
  savedBookmarkPage,
  onToggleBookmark,
  onOpenVoiceRecorder,
  onOpenOfflineDownload,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);
  const [isNavHidden, setIsNavHidden] = useState(false);

  const isNight = settings.themeMode === 'night';
  const isDouble = settings.displayView === 'double';
  const displayCurrentPage = currentPageIndex + 1;
  const maxAllowedIndex = isDouble && totalPages % 2 !== 0 ? totalPages - 1 : totalPages;

  const pageLabel =
    currentPageIndex === totalPages
      ? 'Sampul Belakang'
      : isDouble && displayCurrentPage < totalPages
      ? `Hal. ${displayCurrentPage}–${displayCurrentPage + 1} / ${totalPages}`
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

  // ─── Helper Components ─────────────────────────────────────────────

  const SectionLabel = ({ text }: { text: string }) => (
    <div className="flex items-center gap-2 pt-1">
      <div className={`flex-1 h-px ${isNight ? 'bg-indigo-800/50' : 'bg-amber-800/50'}`} />
      <span className={`text-[10px] font-black uppercase tracking-widest ${isNight ? 'text-indigo-400' : 'text-amber-600'}`}>
        {text}
      </span>
      <div className={`flex-1 h-px ${isNight ? 'bg-indigo-800/50' : 'bg-amber-800/50'}`} />
    </div>
  );

  const ToggleRow = ({
    label,
    icon: Icon,
    isOn,
    onClick,
    onClass = 'bg-amber-600 text-white',
  }: {
    label: string;
    icon: React.ElementType;
    isOn: boolean;
    onClick: () => void;
    onClass?: string;
  }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        isOn
          ? onClass
          : isNight
          ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
          : 'bg-amber-900/60 text-amber-200 hover:bg-amber-800/80'
      }`}
    >
      <span className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 shrink-0" />
        {label}
      </span>
      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-lg ${isOn ? 'bg-white/20' : isNight ? 'bg-slate-700 text-slate-400' : 'bg-amber-800 text-amber-400'}`}>
        {isOn ? 'ON' : 'OFF'}
      </span>
    </button>
  );

  // ─── Desktop Sidebar ───────────────────────────────────────────────

  const sidebarBg = isNight ? 'bg-slate-900/95 border-indigo-800/70' : 'bg-amber-950/95 border-amber-700/70';

  const desktopSidebar = (
    <aside className={`hidden lg:flex flex-col gap-3 w-80 shrink-0 sticky top-20 max-h-[calc(100vh-5.5rem)] overflow-y-auto rounded-2xl border-2 p-5 shadow-2xl backdrop-blur-md [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:rounded-full ${isNight ? '[&::-webkit-scrollbar-thumb]:bg-indigo-700' : '[&::-webkit-scrollbar-thumb]:bg-amber-700'} ${sidebarBg}`}>

      {/* Back + Title */}
      <div className="flex flex-col gap-2">
        <button
          onClick={onBackToLibrary}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${isNight ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-amber-900/80 hover:bg-amber-800 text-amber-200'}`}
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          Koleksi Buku
        </button>
        <h2 className={`text-sm font-bold leading-snug text-center px-1 line-clamp-2 ${isNight ? 'text-slate-200' : 'text-amber-100'}`} title={title}>
          {title}
        </h2>
      </div>

      {/* Progress + mini nav */}
      <div className="flex flex-col gap-1.5">
        <input
          type="range"
          min={0}
          max={maxAllowedIndex}
          value={currentPageIndex}
          onChange={(e) => onPageChange(parseInt(e.target.value, 10))}
          className="w-full accent-amber-500 h-2 cursor-pointer rounded-lg bg-amber-900"
        />
        <div className="flex items-center justify-between gap-1">
          <button
            onClick={() => onPageChange(Math.max(0, currentPageIndex - (isDouble ? 2 : 1)))}
            disabled={currentPageIndex === 0}
            className={`p-1 rounded-lg transition-colors disabled:opacity-30 ${isNight ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-amber-800 hover:bg-amber-700 text-amber-200'}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className={`text-[11px] font-bold text-center flex-1 ${isNight ? 'text-indigo-300' : 'text-amber-300'}`}>
            {pageLabel}
          </span>
          <button
            onClick={() => onPageChange(Math.min(maxAllowedIndex, currentPageIndex + (isDouble ? 2 : 1)))}
            disabled={currentPageIndex + (isDouble ? 2 : 1) > maxAllowedIndex}
            className={`p-1 rounded-lg transition-colors disabled:opacity-30 ${isNight ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-amber-800 hover:bg-amber-700 text-amber-200'}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Language */}
      <SectionLabel text="Bahasa" />
      <div className={`flex rounded-xl overflow-hidden border ${isNight ? 'border-indigo-800/60 bg-slate-800' : 'border-amber-700/60 bg-amber-900/60'}`}>
        {([
          { mode: 'id' as const, label: '🇮🇩 ID' },
          { mode: 'en' as const, label: '🇬🇧 EN' },
          { mode: 'dual' as const, label: '🌐 Dual' },
        ]).map(({ mode, label }) => {
          const isActive = settings.languageMode === mode || (!settings.languageMode && mode === 'id');
          return (
            <button
              key={mode}
              onClick={() => onUpdateSettings({ languageMode: mode })}
              className={`flex-1 py-2 text-xs font-black transition-all ${
                isActive
                  ? mode === 'id' ? 'bg-amber-500 text-white' : mode === 'en' ? 'bg-indigo-600 text-white' : 'bg-purple-600 text-white'
                  : isNight ? 'text-slate-400 hover:text-slate-200' : 'text-amber-400 hover:text-amber-100'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Settings */}
      <SectionLabel text="Pengaturan" />

      {/* Theme */}
      <button
        onClick={() => onUpdateSettings({ themeMode: isNight ? 'day' : 'night' })}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${isNight ? 'bg-indigo-800/80 text-yellow-200 hover:bg-indigo-700' : 'bg-amber-900/60 text-amber-200 hover:bg-amber-800/80'}`}
      >
        <span className="flex items-center gap-2.5">
          {isNight ? <Moon className="w-4 h-4 fill-yellow-300 text-yellow-300" /> : <Sun className="w-4 h-4 text-amber-400" />}
          Tema
        </span>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${isNight ? 'bg-indigo-600 text-white' : 'bg-amber-700 text-amber-100'}`}>
          {isNight ? 'Malam 🌙' : 'Siang ☀️'}
        </span>
      </button>

      {/* Display View */}
      <button
        onClick={() => onUpdateSettings({ displayView: isDouble ? 'single' : 'double' })}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${isNight ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700' : 'bg-amber-900/60 text-amber-200 hover:bg-amber-800/80'}`}
      >
        <span className="flex items-center gap-2.5">
          <Layout className="w-4 h-4 shrink-0" />
          Tampilan
        </span>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${isNight ? 'bg-slate-700 text-slate-200' : 'bg-amber-800 text-amber-200'}`}>
          {isDouble ? '2 Hal.' : '1 Hal.'}
        </span>
      </button>

      <ToggleRow label="Putar Otomatis" icon={settings.autoPlay ? Pause : Play} isOn={settings.autoPlay} onClick={() => onUpdateSettings({ autoPlay: !settings.autoPlay })} />
      <ToggleRow label="Musik Latar" icon={Music} isOn={settings.bgMusic} onClick={toggleBgMusic} />

      {/* Font Size */}
      <div className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl ${isNight ? 'bg-slate-800/80' : 'bg-amber-900/60'}`}>
        <span className={`flex items-center gap-2.5 text-sm font-semibold shrink-0 ${isNight ? 'text-slate-300' : 'text-amber-200'}`}>
          <Type className="w-4 h-4 shrink-0" />
          Ukuran Teks
        </span>
        <div className={`flex items-center gap-0.5 rounded-lg p-0.5 ${isNight ? 'bg-slate-900' : 'bg-amber-950'}`}>
          {(['sm', 'base', 'lg'] as const).map((sz) => (
            <button
              key={sz}
              onClick={() => onUpdateSettings({ fontSize: sz })}
              className={`px-2 py-1 rounded font-black uppercase text-[10px] transition-colors ${settings.fontSize === sz ? 'bg-amber-500 text-white' : isNight ? 'text-slate-400 hover:text-white' : 'text-amber-400 hover:text-white'}`}
            >
              {sz}
            </button>
          ))}
        </div>
      </div>

      {/* Tools */}
      <SectionLabel text="Alat" />
      <div className="grid grid-cols-2 gap-2">
        {onOpenVoiceRecorder && (
          <button
            onClick={onOpenVoiceRecorder}
            className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl bg-gradient-to-br from-rose-700 to-pink-700 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold shadow-md transition-all hover:scale-[1.02]"
          >
            <Mic className="w-5 h-5" />
            <span className="text-center leading-tight">Rekam Suara</span>
          </button>
        )}
        {onOpenOfflineDownload && (
          <button
            onClick={onOpenOfflineDownload}
            className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl bg-gradient-to-br from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold shadow-md transition-all hover:scale-[1.02]"
          >
            <Download className="w-5 h-5" />
            <span className="text-center leading-tight">Unduh Offline</span>
          </button>
        )}
        <button
          onClick={onToggleBookmark}
          className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-xs font-bold shadow-md transition-all hover:scale-[1.02] ${isBookmarked ? 'bg-yellow-400 text-amber-950' : isNight ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-amber-900/80 text-amber-200 hover:bg-amber-800'}`}
        >
          <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-amber-950' : ''}`} />
          <span>{isBookmarked ? 'Ditandai ✓' : 'Tandai'}</span>
        </button>
        <button
          onClick={onToggleThumbnails}
          className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-xs font-bold shadow-md transition-all hover:scale-[1.02] ${isNight ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-amber-900/80 text-amber-200 hover:bg-amber-800'}`}
        >
          <Grid className="w-5 h-5" />
          <span>Daftar Hal.</span>
        </button>
        <button
          onClick={toggleFullscreen}
          className={`col-span-2 flex items-center justify-center gap-2 px-2 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all hover:scale-[1.02] ${isNight ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-amber-900/80 text-amber-200 hover:bg-amber-800'}`}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          <span>{isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}</span>
        </button>
      </div>
    </aside>
  );

  // ─── Mobile ────────────────────────────────────────────────────────

  const mobileBg = isNight ? 'bg-slate-900/95 border-indigo-800/80' : 'bg-amber-950/95 border-amber-700/80';

  const mobileUi = (
    <>
      {isNavHidden ? (
        <div className="lg:hidden fixed bottom-4 right-4 z-40">
          <button
            onClick={() => setIsNavHidden(false)}
            className="p-3 rounded-full bg-amber-900/90 text-amber-200 shadow-xl border border-amber-700/50 hover:bg-amber-800 transition-all hover:scale-105"
          >
            <Eye className="w-6 h-6" />
          </button>
        </div>
      ) : (
        <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md border-t-2 shadow-[0_-8px_32px_rgba(0,0,0,0.5)] px-3 pt-2 pb-3 flex flex-col gap-1.5 ${mobileBg}`}>
          <p className={`text-xs font-bold text-center truncate pb-1.5 border-b ${isNight ? 'text-slate-300 border-indigo-800/60' : 'text-amber-200 border-amber-800/60'}`}>
            {title}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToLibrary}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${isNight ? 'bg-slate-800 text-slate-300' : 'bg-amber-900/80 text-amber-200'}`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Koleksi</span>
            </button>
            <div className="flex-1 flex flex-col gap-0.5 min-w-0">
              <input
                type="range"
                min={0}
                max={maxAllowedIndex}
                value={currentPageIndex}
                onChange={(e) => onPageChange(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 h-1.5 cursor-pointer"
              />
              <span className={`text-[10px] font-bold text-center ${isNight ? 'text-indigo-300' : 'text-amber-400'}`}>
                {pageLabel}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setIsNavHidden(true)}
                className={`p-1.5 rounded-xl transition-colors ${isNight ? 'bg-slate-800 text-slate-400' : 'bg-amber-900/80 text-amber-300'}`}
              >
                <EyeOff className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMobileToolsOpen(true)}
                className={`p-1.5 rounded-xl transition-colors ${isNight ? 'bg-slate-800 text-slate-300' : 'bg-amber-900/80 text-amber-200'}`}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {isMobileToolsOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileToolsOpen(false)} />
          <div className={`relative rounded-t-3xl border-t-2 shadow-2xl p-4 flex flex-col gap-4 max-h-[88vh] overflow-y-auto ${isNight ? 'bg-slate-900 border-indigo-700/80' : 'bg-amber-950 border-amber-700/80'}`}>
            <div className="flex justify-between items-center">
              <h3 className={`font-bold text-lg ${isNight ? 'text-slate-200' : 'text-amber-200'}`}>Peralatan &amp; Pengaturan</h3>
              <button onClick={() => setIsMobileToolsOpen(false)} className={`p-2 rounded-full transition-colors ${isNight ? 'bg-slate-800 text-slate-300' : 'bg-amber-900 text-amber-200'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {onOpenOfflineDownload && (
                <button onClick={() => { onOpenOfflineDownload(); setIsMobileToolsOpen(false); }} className="flex flex-col items-center gap-1.5 p-2 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl text-white shadow-md">
                  <Download className="w-5 h-5" />
                  <span className="text-[9px] font-bold text-center leading-tight">Unduh<br />Offline</span>
                </button>
              )}
              {onOpenVoiceRecorder && (
                <button onClick={() => { onOpenVoiceRecorder(); setIsMobileToolsOpen(false); }} className="flex flex-col items-center gap-1.5 p-2 bg-gradient-to-br from-rose-600 to-pink-600 rounded-xl text-white shadow-md">
                  <Mic className="w-5 h-5" />
                  <span className="text-[9px] font-bold text-center leading-tight">Rekam<br />Suara</span>
                </button>
              )}
              <div className="col-span-2 flex flex-col items-center gap-1.5 p-2 bg-amber-900/60 border border-amber-800 rounded-xl text-amber-200">
                <div className="flex gap-1 w-full">
                  {([{ m: 'id' as const, l: 'ID' }, { m: 'en' as const, l: 'EN' }, { m: 'dual' as const, l: '🌐' }]).map(({ m, l }) => (
                    <button
                      key={m}
                      onClick={() => onUpdateSettings({ languageMode: m })}
                      className={`flex-1 py-1 rounded text-[10px] font-black transition-colors ${settings.languageMode === m || (!settings.languageMode && m === 'id') ? m === 'id' ? 'bg-amber-500 text-white' : m === 'en' ? 'bg-indigo-600 text-white' : 'bg-purple-600 text-white' : 'text-amber-300'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <span className="text-[9px] font-bold text-amber-400">Mode Bahasa</span>
              </div>
              <button onClick={onToggleBookmark} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl shadow-md ${isBookmarked ? 'bg-yellow-400 text-amber-950' : 'bg-amber-900/60 border border-amber-800 text-amber-200'}`}>
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-amber-950' : ''}`} />
                <span className="text-[9px] font-bold">Tandai</span>
              </button>
              <button onClick={() => onUpdateSettings({ themeMode: isNight ? 'day' : 'night' })} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl shadow-md ${isNight ? 'bg-indigo-600 text-yellow-300' : 'bg-amber-900/60 border border-amber-800 text-amber-200'}`}>
                {isNight ? <Moon className="w-5 h-5 fill-yellow-300" /> : <Sun className="w-5 h-5" />}
                <span className="text-[9px] font-bold">Tema</span>
              </button>
              <button onClick={() => { onToggleThumbnails(); setIsMobileToolsOpen(false); }} className="flex flex-col items-center gap-1.5 p-2 bg-amber-900/60 border border-amber-800 rounded-xl text-amber-200">
                <Grid className="w-5 h-5" />
                <span className="text-[9px] font-bold">Daftar Hal</span>
              </button>
              <button onClick={toggleFullscreen} className="flex flex-col items-center gap-1.5 p-2 bg-amber-900/60 border border-amber-800 rounded-xl text-amber-200">
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                <span className="text-[9px] font-bold">Layar Penuh</span>
              </button>
            </div>

            <div className={`flex flex-col gap-2 border-t pt-3 ${isNight ? 'border-indigo-800/60' : 'border-amber-800/60'}`}>
              <button onClick={() => onUpdateSettings({ autoPlay: !settings.autoPlay })} className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${settings.autoPlay ? 'bg-amber-600 border-amber-400 text-white' : 'bg-amber-900/60 border-amber-800 text-amber-200'}`}>
                <span className="flex items-center gap-2 text-sm">{settings.autoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />} Putar Otomatis</span>
                <span className="font-black text-xs">{settings.autoPlay ? 'ON' : 'OFF'}</span>
              </button>
              <button onClick={toggleBgMusic} className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${settings.bgMusic ? 'bg-amber-600 border-amber-400 text-white' : 'bg-amber-900/60 border-amber-800 text-amber-200'}`}>
                <span className="flex items-center gap-2 text-sm"><Music className="w-4 h-4" /> Musik Latar</span>
                <span className="font-black text-xs">{settings.bgMusic ? 'ON' : 'OFF'}</span>
              </button>
              <button onClick={() => onUpdateSettings({ displayView: isDouble ? 'single' : 'double' })} className="p-3 rounded-xl bg-amber-900/60 border border-amber-800 text-amber-200 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm"><Layout className="w-4 h-4" /> Tampilan</span>
                <span className="font-bold text-xs">{isDouble ? '2 Halaman' : '1 Halaman'}</span>
              </button>
              <div className="p-3 rounded-xl bg-amber-900/60 border border-amber-800 text-amber-200 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm"><Type className="w-4 h-4" /> Ukuran Teks</span>
                <div className="flex gap-1.5 bg-amber-950 p-1 rounded-lg">
                  {(['sm', 'base', 'lg'] as const).map((sz) => (
                    <button key={sz} onClick={() => onUpdateSettings({ fontSize: sz })} className={`px-3 py-1 rounded font-bold uppercase text-[10px] transition-colors ${settings.fontSize === sz ? 'bg-amber-500 text-white' : 'text-amber-400'}`}>{sz}</button>
                  ))}
                </div>
              </div>
            </div>
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
