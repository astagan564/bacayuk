import { Bookmark, Download, Grid, HelpCircle, Mic, Volume2 } from 'lucide-react';
import type { ReaderNavigationController } from '@/features/reader/hooks/useReaderNavigationController';
import type { ReaderNavigationControlsProps } from '@/features/reader/types/readerNavigation';

interface MobileReaderToolActionsProps extends Pick<
  ReaderNavigationControlsProps,
  | 'isBookmarked'
  | 'onToggleBookmark'
  | 'onToggleThumbnails'
  | 'onOpenVoiceRecorder'
  | 'onOpenOfflineDownload'
  | 'onReadPage'
  | 'onOpenQuiz'
  | 'isBackCover'
> {
  controller: ReaderNavigationController;
  runToolAction: (action?: () => void) => void;
}

export function MobileReaderToolActions({
  controller,
  runToolAction,
  isBookmarked = false,
  onToggleBookmark,
  onToggleThumbnails,
  onOpenVoiceRecorder,
  onOpenOfflineDownload,
  onReadPage,
  onOpenQuiz,
  isBackCover = false,
}: MobileReaderToolActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {!isBackCover && onReadPage && (
        <button type="button" onClick={() => runToolAction(onReadPage)} className="flex min-h-16 items-center gap-3 rounded-2xl bg-brand-blue p-3 text-left font-bold text-white shadow-sm">
          <Volume2 className="h-5 w-5 shrink-0" />
          <span className="text-sm leading-tight">{controller.readPageLabel}</span>
        </button>
      )}
      {!isBackCover && onOpenQuiz && (
        <button type="button" onClick={() => runToolAction(onOpenQuiz)} className="flex min-h-16 items-center gap-3 rounded-2xl bg-brand-gold p-3 text-left font-bold text-[#3a2910] shadow-sm">
          <HelpCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm leading-tight">Kuis halaman</span>
        </button>
      )}
      {onOpenVoiceRecorder && (
        <button type="button" onClick={() => runToolAction(onOpenVoiceRecorder)} className="flex min-h-16 items-center gap-3 rounded-2xl bg-brand-rose p-3 text-left font-bold text-white shadow-sm hover:brightness-110">
          <Mic className="h-5 w-5 shrink-0" />
          <span className="text-sm leading-tight">Rekam suara</span>
        </button>
      )}
      {onOpenOfflineDownload && (
        <button type="button" onClick={() => runToolAction(onOpenOfflineDownload)} className="flex min-h-16 items-center gap-3 rounded-2xl bg-brand-green p-3 text-left font-bold text-white shadow-sm hover:brightness-110">
          <Download className="h-5 w-5 shrink-0" />
          <span className="text-sm leading-tight">Unduh offline</span>
        </button>
      )}
      <button
        type="button"
        onClick={onToggleBookmark}
        className={`flex min-h-16 items-center gap-3 rounded-2xl p-3 text-left font-bold shadow-sm ${
          isBookmarked ? 'bg-brand-gold text-[#3a2910]' : 'reader-soft-panel text-primary'
        }`}
      >
        <Bookmark className={`h-5 w-5 shrink-0 ${isBookmarked ? 'fill-[#3a2910]' : ''}`} />
        <span className="text-sm leading-tight">{isBookmarked ? 'Ditandai' : 'Tandai halaman'}</span>
      </button>
      <button type="button" onClick={() => runToolAction(onToggleThumbnails)} className="reader-soft-panel flex min-h-16 items-center gap-3 rounded-2xl p-3 text-left font-bold text-primary">
        <Grid className="h-5 w-5 shrink-0 text-brand-blue" />
        <span className="text-sm leading-tight">Daftar halaman</span>
      </button>
    </div>
  );
}
