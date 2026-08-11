import {
  ArrowLeft,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  Grid,
  HelpCircle,
  Maximize2,
  Menu,
  Mic,
  Minimize2,
  Moon,
  Music,
  Pause,
  Play,
  Sun,
  Type,
  Volume2,
  X,
} from 'lucide-react';
import type { ReaderNavigationController } from '@/features/reader/hooks/useReaderNavigationController';
import type { ReaderNavigationControlsProps } from '@/features/reader/types/readerNavigation';
import { ReaderToggleRow } from '@/features/reader/components/navigation/ReaderControlPrimitives';

interface MobileReaderControlsProps extends ReaderNavigationControlsProps {
  controller: ReaderNavigationController;
}

const LANGUAGE_OPTIONS = [
  { mode: 'id', label: 'ID' },
  { mode: 'en', label: 'EN' },
  { mode: 'dual', label: 'ID + EN' },
] as const;

const MOBILE_FONT_SIZES = ['sm', 'base', 'lg', 'xl'] as const;

export function MobileReaderControls({
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
}: MobileReaderControlsProps) {
  const runToolAction = (action?: () => void) => {
    action?.();
    controller.closeMobileTools();
  };

  return (
    <>
      {controller.isMobileNavigationHidden ? (
        <div className="lg:hidden fixed bottom-4 right-4 z-40">
          <button
            type="button"
            onClick={controller.showMobileNavigation}
            className="reader-modal p-3 rounded-2xl transition-all hover:scale-[1.02]"
            aria-label="Tampilkan kontrol baca"
          >
            <Eye className="w-6 h-6" />
          </button>
        </div>
      ) : (
        <nav aria-label="Navigasi baca" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl px-3 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex flex-col gap-2 bg-card/95 border-default shadow-[0_-10px_34px_rgba(0,0,0,0.22)]">
          <div className="flex items-center justify-between gap-2 max-[380px]:grid max-[380px]:grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] max-[380px]:gap-2">
            <button
              type="button"
              onClick={onBackToLibrary}
              className="h-11 w-11 rounded-2xl btn-secondary flex items-center justify-center shrink-0 max-[380px]:col-start-1 max-[380px]:row-start-1"
              aria-label="Kembali ke koleksi"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={controller.goPrevious}
              disabled={!controller.canGoPrevious}
              className="h-12 w-14 rounded-2xl bg-primary text-inverse disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-transform active:scale-95 max-[380px]:col-start-1 max-[380px]:row-start-2 max-[380px]:h-14 max-[380px]:w-full"
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>

            <div className="min-w-0 flex-1 flex flex-col items-center gap-1 max-[380px]:col-start-2 max-[380px]:row-span-2 max-[380px]:self-stretch max-[380px]:justify-center">
              <p className="w-full truncate text-center text-[11px] font-bold text-secondary">{title}</p>
              <button
                type="button"
                onClick={onToggleThumbnails}
                className="w-full rounded-xl reader-soft-panel border border-default px-3 py-2 text-xs font-extrabold text-primary shadow-sm"
              >
                {controller.pageLabel}
              </button>
              <input
                type="range"
                min={0}
                max={totalPages}
                value={currentPageIndex}
                onChange={controller.selectPage}
                className="w-full accent-brand-green h-1.5 cursor-pointer"
                aria-label="Pilih halaman"
              />
            </div>

            <button
              type="button"
              onClick={controller.goNext}
              disabled={!controller.canGoNext}
              className="h-12 w-14 rounded-2xl bg-brand-green text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-transform active:scale-95 max-[380px]:col-start-3 max-[380px]:row-start-2 max-[380px]:h-14 max-[380px]:w-full"
              aria-label="Halaman berikutnya"
            >
              <ChevronRight className="w-7 h-7" />
            </button>

            <button
              type="button"
              ref={controller.mobileToolsTriggerRef}
              onClick={controller.openMobileTools}
              aria-expanded={controller.isMobileToolsOpen}
              className="h-11 w-11 rounded-2xl btn-secondary flex items-center justify-center shrink-0 max-[380px]:col-start-3 max-[380px]:row-start-1"
              aria-label="Buka alat baca"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={controller.hideMobileNavigation}
            className="self-center inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-secondary"
          >
            <EyeOff className="w-3.5 h-3.5" />
            Sembunyikan kontrol
          </button>
        </nav>
      )}

      {controller.isMobileToolsOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={controller.closeMobileTools}
            aria-label="Tutup alat baca"
          />
          <div
            ref={controller.mobileToolsDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-tools-title"
            tabIndex={-1}
            className="reader-modal relative rounded-t-[1.35rem] p-4 flex flex-col gap-4 max-h-[88vh] overflow-y-auto pb-[calc(1rem+env(safe-area-inset-bottom))]"
          >
            <div className="flex justify-between items-start gap-3">
              <div>
                <h3 id="mobile-tools-title" className="text-lg font-black font-sans mb-0">Alat baca</h3>
                <p className="text-xs text-secondary">Atur tampilan, suara, dan halaman.</p>
              </div>
              <button type="button" onClick={controller.closeMobileTools} className="p-2 rounded-xl btn-secondary" aria-label="Tutup alat baca">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {!isBackCover && onReadPage && (
                <button type="button" onClick={() => runToolAction(onReadPage)} className="min-h-16 rounded-2xl bg-brand-blue text-white p-3 flex items-center gap-3 text-left font-bold shadow-sm">
                  <Volume2 className="w-5 h-5 shrink-0" />
                  <span className="text-sm leading-tight">{controller.readPageLabel}</span>
                </button>
              )}
              {!isBackCover && onOpenQuiz && (
                <button type="button" onClick={() => runToolAction(onOpenQuiz)} className="min-h-16 rounded-2xl bg-brand-gold text-[#3a2910] p-3 flex items-center gap-3 text-left font-bold shadow-sm">
                  <HelpCircle className="w-5 h-5 shrink-0" />
                  <span className="text-sm leading-tight">Kuis halaman</span>
                </button>
              )}
              {onOpenVoiceRecorder && (
                <button type="button" onClick={() => runToolAction(onOpenVoiceRecorder)} className="min-h-16 rounded-2xl bg-brand-rose hover:brightness-110 text-white p-3 flex items-center gap-3 text-left font-bold shadow-sm">
                  <Mic className="w-5 h-5 shrink-0" />
                  <span className="text-sm leading-tight">Rekam suara</span>
                </button>
              )}
              {onOpenOfflineDownload && (
                <button type="button" onClick={() => runToolAction(onOpenOfflineDownload)} className="min-h-16 rounded-2xl bg-brand-green hover:brightness-110 text-white p-3 flex items-center gap-3 text-left font-bold shadow-sm">
                  <Download className="w-5 h-5 shrink-0" />
                  <span className="text-sm leading-tight">Unduh offline</span>
                </button>
              )}
              <button type="button" onClick={onToggleBookmark} className={`min-h-16 rounded-2xl p-3 flex items-center gap-3 text-left font-bold shadow-sm ${isBookmarked ? 'bg-brand-gold text-[#3a2910]' : 'reader-soft-panel text-primary'}`}>
                <Bookmark className={`w-5 h-5 shrink-0 ${isBookmarked ? 'fill-[#3a2910]' : ''}`} />
                <span className="text-sm leading-tight">{isBookmarked ? 'Ditandai' : 'Tandai halaman'}</span>
              </button>
              <button type="button" onClick={() => runToolAction(onToggleThumbnails)} className="reader-soft-panel min-h-16 rounded-2xl p-3 flex items-center gap-3 text-left font-bold text-primary">
                <Grid className="w-5 h-5 shrink-0 text-brand-blue" />
                <span className="text-sm leading-tight">Daftar halaman</span>
              </button>
            </div>

            <div className="reader-soft-panel rounded-2xl p-3 flex flex-col gap-3">
              <span className="text-xs font-black text-secondary">Bahasa cerita</span>
              <div className="grid grid-cols-3 gap-2">
                {LANGUAGE_OPTIONS.map(({ mode, label }) => {
                  const isActive = settings.languageMode === mode || (!settings.languageMode && mode === 'id');
                  return (
                    <button
                      type="button"
                      key={mode}
                      onClick={() => onUpdateSettings({ languageMode: mode })}
                      aria-pressed={isActive}
                      className={`h-10 rounded-xl text-xs font-black transition-colors ${
                        isActive ? 'bg-brand-blue text-white' : 'bg-surface-hover text-secondary'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="reader-soft-panel rounded-2xl p-3 flex flex-col gap-2">
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
              <button type="button" onClick={() => onUpdateSettings({ themeMode: controller.isNight ? 'day' : 'night' })} className="min-h-12 rounded-xl flex items-center justify-between gap-3 text-sm font-bold px-3">
                <span className="flex items-center gap-2">
                  {controller.isNight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />} Tema
                </span>
                <span className="text-xs text-secondary">{controller.isNight ? 'Malam' : 'Siang'}</span>
              </button>
            </div>

            <div className="reader-soft-panel rounded-2xl p-3 flex flex-col gap-2">
              <span className="flex items-center gap-2 text-sm font-bold"><Type className="w-4 h-4" /> Ukuran teks</span>
              <div className="grid grid-cols-4 gap-1 bg-surface-hover p-1 rounded-xl">
                {MOBILE_FONT_SIZES.map((fontSize) => (
                  <button
                    type="button"
                    key={fontSize}
                    onClick={() => onUpdateSettings({ fontSize })}
                    aria-pressed={settings.fontSize === fontSize}
                    className={`min-h-10 rounded-lg font-black uppercase text-[10px] transition-colors ${
                      settings.fontSize === fontSize ? 'bg-brand-blue text-white' : 'text-secondary'
                    }`}
                  >
                    {fontSize}
                  </button>
                ))}
              </div>
            </div>

            <button type="button" onClick={controller.toggleFullscreen} className="btn-secondary w-full min-h-12 px-4 text-sm flex items-center justify-center gap-2">
              {controller.isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span>{controller.isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
