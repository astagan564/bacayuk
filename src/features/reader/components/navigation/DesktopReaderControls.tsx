import type { ReaderNavigationController } from '@/features/reader/hooks/useReaderNavigationController';
import type { ReaderNavigationControlsProps } from '@/features/reader/types/readerNavigation';
import { DesktopReaderPageNavigation } from '@/features/reader/components/navigation/DesktopReaderPageNavigation';
import { DesktopReaderSettings } from '@/features/reader/components/navigation/DesktopReaderSettings';
import { DesktopReaderTools } from '@/features/reader/components/navigation/DesktopReaderTools';

interface DesktopReaderControlsProps extends ReaderNavigationControlsProps {
  controller: ReaderNavigationController;
}

export function DesktopReaderControls({
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
}: DesktopReaderControlsProps) {
  return (
    <aside className="reader-modal sticky top-0 hidden h-full max-h-none w-80 shrink-0 flex-col gap-3 overflow-y-auto rounded-[1.1rem] p-5 lg:flex [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#d8c29f] dark:[&::-webkit-scrollbar-thumb]:bg-blue-900">
      <DesktopReaderPageNavigation
        controller={controller}
        title={title}
        currentPageIndex={currentPageIndex}
        totalPages={totalPages}
        onBackToLibrary={onBackToLibrary}
      />
      <DesktopReaderSettings
        controller={controller}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
      />
      <DesktopReaderTools
        controller={controller}
        onToggleThumbnails={onToggleThumbnails}
        isBookmarked={isBookmarked}
        onToggleBookmark={onToggleBookmark}
        onOpenVoiceRecorder={onOpenVoiceRecorder}
        onOpenOfflineDownload={onOpenOfflineDownload}
        onReadPage={onReadPage}
        onOpenQuiz={onOpenQuiz}
        isBackCover={isBackCover}
      />
    </aside>
  );
}
