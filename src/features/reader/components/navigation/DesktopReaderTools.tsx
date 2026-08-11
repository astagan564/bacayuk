import {
  Bookmark,
  Download,
  Grid,
  HelpCircle,
  Maximize2,
  Mic,
  Minimize2,
  Volume2,
} from 'lucide-react';
import type { ReaderNavigationController } from '@/features/reader/hooks/useReaderNavigationController';
import type { ReaderNavigationControlsProps } from '@/features/reader/types/readerNavigation';
import { ReaderSectionLabel } from '@/features/reader/components/navigation/ReaderControlPrimitives';

interface DesktopReaderToolsProps extends Pick<
  ReaderNavigationControlsProps,
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

const TOOL_BUTTON_CLASS = 'flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-bold shadow-sm transition-all hover:scale-[1.02]';

export function DesktopReaderTools({
  controller,
  onToggleThumbnails,
  isBookmarked = false,
  onToggleBookmark,
  onOpenVoiceRecorder,
  onOpenOfflineDownload,
  onReadPage,
  onOpenQuiz,
  isBackCover = false,
}: DesktopReaderToolsProps) {
  return (
    <>
      <ReaderSectionLabel text="Alat" />
      <div className="grid grid-cols-2 gap-2">
        {!isBackCover && onReadPage && (
          <button type="button" onClick={onReadPage} className={`${TOOL_BUTTON_CLASS} bg-brand-blue text-white hover:brightness-110`}>
            <Volume2 className="h-5 w-5" />
            <span>{controller.readPageLabel}</span>
          </button>
        )}
        {!isBackCover && onOpenQuiz && (
          <button type="button" onClick={onOpenQuiz} className={`${TOOL_BUTTON_CLASS} border border-default bg-surface-secondary text-primary`}>
            <HelpCircle className="h-5 w-5" />
            <span>Kuis halaman</span>
          </button>
        )}
        {onOpenVoiceRecorder && (
          <button type="button" onClick={onOpenVoiceRecorder} className={`${TOOL_BUTTON_CLASS} bg-brand-rose text-white hover:brightness-110`}>
            <Mic className="h-5 w-5" />
            <span className="text-center leading-tight">Rekam suara</span>
          </button>
        )}
        {onOpenOfflineDownload && (
          <button type="button" onClick={onOpenOfflineDownload} className={`${TOOL_BUTTON_CLASS} bg-brand-green text-white hover:brightness-110`}>
            <Download className="h-5 w-5" />
            <span className="text-center leading-tight">Unduh offline</span>
          </button>
        )}
        <button
          type="button"
          onClick={onToggleBookmark}
          aria-pressed={isBookmarked}
          className={`${TOOL_BUTTON_CLASS} ${isBookmarked ? 'bg-brand-gold text-white' : 'reader-soft-panel'}`}
        >
          <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-white' : ''}`} />
          <span>{isBookmarked ? 'Ditandai' : 'Tandai'}</span>
        </button>
        <button type="button" onClick={onToggleThumbnails} className={`${TOOL_BUTTON_CLASS} reader-soft-panel`}>
          <Grid className="h-5 w-5" />
          <span>Daftar hal.</span>
        </button>
        <button
          type="button"
          onClick={controller.toggleFullscreen}
          className="reader-soft-panel col-span-2 flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-xs font-bold shadow-sm transition-all hover:scale-[1.02]"
        >
          {controller.isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          <span>{controller.isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}</span>
        </button>
      </div>
    </>
  );
}
