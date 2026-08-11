import { useCallback } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';
import type { ReaderNavigationController } from '@/features/reader/hooks/useReaderNavigationController';
import type { ReaderNavigationControlsProps } from '@/features/reader/types/readerNavigation';
import { MobileReaderSettings } from '@/features/reader/components/navigation/MobileReaderSettings';
import { MobileReaderToolActions } from '@/features/reader/components/navigation/MobileReaderToolActions';

interface MobileReaderToolsSheetProps extends Pick<
  ReaderNavigationControlsProps,
  | 'settings'
  | 'onUpdateSettings'
  | 'onToggleThumbnails'
  | 'isBookmarked'
  | 'onToggleBookmark'
  | 'onOpenVoiceRecorder'
  | 'onOpenOfflineDownload'
  | 'onReadPage'
  | 'onOpenQuiz'
  | 'isBackCover'
> {
  controller: ReaderNavigationController;
}

export function MobileReaderToolsSheet({
  controller,
  settings,
  onUpdateSettings,
  onToggleThumbnails,
  isBookmarked,
  onToggleBookmark,
  onOpenVoiceRecorder,
  onOpenOfflineDownload,
  onReadPage,
  onOpenQuiz,
  isBackCover,
}: MobileReaderToolsSheetProps) {
  const runToolAction = useCallback((action?: () => void) => {
    action?.();
    controller.closeMobileTools();
  }, [controller.closeMobileTools]);

  if (!controller.isMobileToolsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={controller.closeMobileTools}
        aria-label="Tutup alat baca"
      />
      <div
        id="mobile-reader-tools"
        ref={controller.mobileToolsDialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-tools-title"
        tabIndex={-1}
        className="reader-modal relative flex max-h-[88vh] flex-col gap-4 overflow-y-auto rounded-t-[1.35rem] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id="mobile-tools-title" className="mb-0 font-sans text-lg font-black">Alat baca</h3>
            <p className="text-xs text-secondary">Atur tampilan, suara, dan halaman.</p>
          </div>
          <button type="button" onClick={controller.closeMobileTools} className="btn-secondary rounded-xl p-2" aria-label="Tutup alat baca">
            <X className="h-5 w-5" />
          </button>
        </div>

        <MobileReaderToolActions
          controller={controller}
          runToolAction={runToolAction}
          isBookmarked={isBookmarked}
          onToggleBookmark={onToggleBookmark}
          onToggleThumbnails={onToggleThumbnails}
          onOpenVoiceRecorder={onOpenVoiceRecorder}
          onOpenOfflineDownload={onOpenOfflineDownload}
          onReadPage={onReadPage}
          onOpenQuiz={onOpenQuiz}
          isBackCover={isBackCover}
        />
        <MobileReaderSettings
          controller={controller}
          settings={settings}
          onUpdateSettings={onUpdateSettings}
        />

        <button type="button" onClick={controller.toggleFullscreen} className="btn-secondary flex min-h-12 w-full items-center justify-center gap-2 px-4 text-sm">
          {controller.isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          <span>{controller.isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}</span>
        </button>
      </div>
    </div>
  );
}
