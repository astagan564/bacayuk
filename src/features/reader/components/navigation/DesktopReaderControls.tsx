import {
  ArrowLeft,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Download,
  Grid,
  HelpCircle,
  Maximize2,
  Mic,
  Minimize2,
  Moon,
  Music,
  Pause,
  Play,
  Sun,
  Type,
  Volume2,
} from 'lucide-react';
import type { ReaderNavigationController } from '@/features/reader/hooks/useReaderNavigationController';
import type { ReaderNavigationControlsProps } from '@/features/reader/types/readerNavigation';
import {
  ReaderSectionLabel,
  ReaderToggleRow,
} from '@/features/reader/components/navigation/ReaderControlPrimitives';

interface DesktopReaderControlsProps extends ReaderNavigationControlsProps {
  controller: ReaderNavigationController;
}

const LANGUAGE_OPTIONS = [
  { mode: 'id', label: 'ID' },
  { mode: 'en', label: 'EN' },
  { mode: 'dual', label: 'ID+EN' },
] as const;

const DESKTOP_FONT_SIZES = ['sm', 'base', 'lg'] as const;

export function DesktopReaderControls({
  controller,
  title,
  currentPageIndex,
  totalPages,
  settings,
  onUpdateSettings,
  onToggleThumbnails,
  onBackToLibrary,
  isBookmarked = false,
  onToggleBookmark,
  onOpenVoiceRecorder,
  onOpenOfflineDownload,
  onReadPage,
  onOpenQuiz,
  isBackCover = false,
}: DesktopReaderControlsProps) {
  return (
    <aside className="hidden lg:flex reader-modal flex-col gap-3 w-80 shrink-0 sticky top-0 h-full max-h-none overflow-y-auto rounded-[1.1rem] p-5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#d8c29f] dark:[&::-webkit-scrollbar-thumb]:bg-blue-900">
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onBackToLibrary}
          className="btn-secondary bg-surface text-secondary w-full flex items-center gap-2 px-3 py-2 text-xs"
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
          max={totalPages}
          value={currentPageIndex}
          onChange={controller.selectPage}
          className="w-full accent-brand-green h-2 cursor-pointer rounded-lg"
          aria-label="Pilih halaman"
        />
        <div className="flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={controller.goPrevious}
            disabled={!controller.canGoPrevious}
            className="reader-soft-panel p-1 rounded-lg transition-colors disabled:opacity-30"
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-bold text-center flex-1 text-info">
            {controller.pageLabel}
          </span>
          <button
            type="button"
            onClick={controller.goNext}
            disabled={!controller.canGoNext}
            className="reader-soft-panel p-1 rounded-lg transition-colors disabled:opacity-30"
            aria-label="Halaman berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ReaderSectionLabel text="Bahasa" />
      <div className="reader-soft-panel grid grid-cols-3 gap-1 rounded-xl p-1">
        {LANGUAGE_OPTIONS.map(({ mode, label }) => {
          const isActive = settings.languageMode === mode || (!settings.languageMode && mode === 'id');
          return (
            <button
              type="button"
              key={mode}
              onClick={() => onUpdateSettings({ languageMode: mode })}
              aria-pressed={isActive}
              className={`py-2 rounded-lg text-xs font-black transition-all ${
                isActive ? 'bg-brand-blue text-white' : 'text-secondary'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <ReaderSectionLabel text="Pengaturan" />
      <button
        type="button"
        onClick={() => onUpdateSettings({ themeMode: controller.isNight ? 'day' : 'night' })}
        className="reader-soft-panel w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold"
      >
        <span className="flex items-center gap-2.5">
          {controller.isNight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          Tema
        </span>
        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-surface-hover">
          {controller.isNight ? 'Malam' : 'Siang'}
        </span>
      </button>

      <ReaderToggleRow
        label="Putar otomatis"
        icon={settings.autoPlay ? Pause : Play}
        isOn={settings.autoPlay}
        onClick={() => onUpdateSettings({ autoPlay: !settings.autoPlay })}
      />
      <ReaderToggleRow
        label="Musik latar"
        icon={Music}
        isOn={settings.bgMusic}
        onClick={controller.toggleBackgroundMusic}
      />

      <div className="reader-soft-panel flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl">
        <span className="flex items-center gap-2.5 text-sm font-semibold shrink-0">
          <Type className="w-4 h-4 shrink-0" />
          Ukuran teks
        </span>
        <div className="flex items-center gap-0.5 rounded-lg p-0.5 bg-surface-hover">
          {DESKTOP_FONT_SIZES.map((fontSize) => (
            <button
              type="button"
              key={fontSize}
              onClick={() => onUpdateSettings({ fontSize })}
              aria-pressed={settings.fontSize === fontSize}
              className={`px-2 py-1 rounded-lg font-black uppercase text-[10px] transition-colors ${
                settings.fontSize === fontSize ? 'bg-brand-blue text-white' : 'text-secondary'
              }`}
            >
              {fontSize}
            </button>
          ))}
        </div>
      </div>

      <ReaderSectionLabel text="Alat" />
      <div className="grid grid-cols-2 gap-2">
        {!isBackCover && onReadPage && (
          <button type="button" onClick={onReadPage} className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl bg-brand-blue hover:brightness-110 text-white text-xs font-bold shadow-sm transition-all hover:scale-[1.02]">
            <Volume2 className="w-5 h-5" />
            <span>{controller.readPageLabel}</span>
          </button>
        )}
        {!isBackCover && onOpenQuiz && (
          <button type="button" onClick={onOpenQuiz} className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl bg-surface-secondary text-primary border border-default text-xs font-bold shadow-sm transition-all hover:scale-[1.02]">
            <HelpCircle className="w-5 h-5" />
            <span>Kuis halaman</span>
          </button>
        )}
        {onOpenVoiceRecorder && (
          <button type="button" onClick={onOpenVoiceRecorder} className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl bg-brand-rose hover:brightness-110 text-white text-xs font-bold shadow-sm transition-all hover:scale-[1.02]">
            <Mic className="w-5 h-5" />
            <span className="text-center leading-tight">Rekam suara</span>
          </button>
        )}
        {onOpenOfflineDownload && (
          <button type="button" onClick={onOpenOfflineDownload} className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl bg-brand-green hover:brightness-110 text-white text-xs font-bold shadow-sm transition-all hover:scale-[1.02]">
            <Download className="w-5 h-5" />
            <span className="text-center leading-tight">Unduh offline</span>
          </button>
        )}
        <button type="button" onClick={onToggleBookmark} className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-[1.02] ${isBookmarked ? 'bg-brand-gold text-white' : 'reader-soft-panel'}`}>
          <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-white' : ''}`} />
          <span>{isBookmarked ? 'Ditandai' : 'Tandai'}</span>
        </button>
        <button type="button" onClick={onToggleThumbnails} className="reader-soft-panel flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-[1.02]">
          <Grid className="w-5 h-5" />
          <span>Daftar hal.</span>
        </button>
        <button type="button" onClick={controller.toggleFullscreen} className="reader-soft-panel col-span-2 flex items-center justify-center gap-2 px-2 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-[1.02]">
          {controller.isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          <span>{controller.isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}</span>
        </button>
      </div>
    </aside>
  );
}
