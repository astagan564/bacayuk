import type { ReaderNavigationController } from '@/features/reader/hooks/useReaderNavigationController';
import type { ReaderNavigationControlsProps } from '@/features/reader/types/readerNavigation';
import { MobileReaderNavigationBar } from '@/features/reader/components/navigation/MobileReaderNavigationBar';
import { MobileReaderToolsSheet } from '@/features/reader/components/navigation/MobileReaderToolsSheet';

interface MobileReaderControlsProps extends ReaderNavigationControlsProps {
  controller: ReaderNavigationController;
}

export function MobileReaderControls({
  controller,
  title,
  currentPageIndex,
  totalPages,
  settings,
  onUpdateSettings,
  onToggleThumbnails,
  onBackToLibrary,
  isBookmarked,
  onToggleBookmark,
  onOpenVoiceRecorder,
  onOpenOfflineDownload,
  onReadPage,
  onOpenQuiz,
  isBackCover,
}: MobileReaderControlsProps) {
  return (
    <>
      <MobileReaderNavigationBar
        controller={controller}
        title={title}
        currentPageIndex={currentPageIndex}
        totalPages={totalPages}
        onToggleThumbnails={onToggleThumbnails}
        onBackToLibrary={onBackToLibrary}
      />
      <MobileReaderToolsSheet
        controller={controller}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        onToggleThumbnails={onToggleThumbnails}
        isBookmarked={isBookmarked}
        onToggleBookmark={onToggleBookmark}
        onOpenVoiceRecorder={onOpenVoiceRecorder}
        onOpenOfflineDownload={onOpenOfflineDownload}
        onReadPage={onReadPage}
        onOpenQuiz={onOpenQuiz}
        isBackCover={isBackCover}
      />
    </>
  );
}
