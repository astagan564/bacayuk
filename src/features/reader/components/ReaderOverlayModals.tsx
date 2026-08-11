import type { Story } from '@/types';
import { BookCompletionModal } from '@/components/BookCompletionModal';
import { InteractiveQuizModal } from '@/components/InteractiveQuizModal';
import { ParentalGateModal } from '@/components/ParentalGateModal';
import { RestReminderModal } from '@/components/RestReminderModal';
import { StatsModal } from '@/components/StatsModal';
import { StoryMakerModal } from '@/components/StoryMakerModal';
import { ThumbnailGrid } from '@/components/ThumbnailGrid';
import { VoiceRecorderModal } from '@/features/reader/components/voice-recorder/VoiceRecorderModal';
import type { ReaderOverlayController } from '@/features/reader/hooks/useReaderOverlayController';
import type { ReaderSessionController } from '@/features/reader/hooks/useReaderSessionController';

interface ReaderOverlayModalsProps {
  session: ReaderSessionController;
  overlays: ReaderOverlayController;
  stories: Story[];
  isNight: boolean;
  restMinutes: number;
  onRequestDownload: (story: Story) => void;
  showToast: (message: string) => void;
}

export function ReaderOverlayModals({
  session,
  overlays,
  stories,
  isNight,
  restMinutes,
  onRequestDownload,
  showToast,
}: ReaderOverlayModalsProps) {
  const selectedStory = session.selectedStory;

  return (
    <>
      {overlays.isThumbnailsOpen && selectedStory && (
        <ThumbnailGrid
          story={selectedStory}
          currentPageIndex={session.currentPageIndex}
          onSelectPage={session.changePage}
          onClose={overlays.closeThumbnails}
          isNight={isNight}
        />
      )}

      {overlays.isStoryMakerOpen && (
        <StoryMakerModal
          onClose={overlays.closeStoryMaker}
          onStoryCreated={session.createStory}
        />
      )}

      {overlays.activeQuizPage?.quizQuestion && (
        <InteractiveQuizModal
          quiz={overlays.activeQuizPage.quizQuestion}
          onClose={overlays.closeQuiz}
        />
      )}

      {session.showRestReminder && (
        <RestReminderModal
          restMinutes={restMinutes}
          onCloseAndContinue={session.requestRestContinuation}
          onCloseAndGoLibrary={() => {
            session.dismissRestReminder();
            session.backToLibrary();
          }}
          isNight={isNight}
        />
      )}

      {session.showRestParentalGate && (
        <ParentalGateModal
          onSuccess={session.continueAfterRest}
          onCancel={session.cancelRestContinuation}
          isNight={isNight}
        />
      )}

      {overlays.showStatsModal && (
        <StatsModal
          stories={stories}
          readingTimes={session.readingTimes}
          bookmarks={session.bookmarks}
          onClose={overlays.closeStats}
          onResetStats={session.resetStats}
          isNight={isNight}
        />
      )}

      {overlays.voiceRecorderTarget && (
        <VoiceRecorderModal
          storyId={overlays.voiceRecorderTarget.storyId}
          storyTitle={overlays.voiceRecorderTarget.storyTitle}
          pageNumber={overlays.voiceRecorderTarget.pageNumber}
          pageText={overlays.voiceRecorderTarget.pageText}
          onClose={overlays.closeVoiceRecorder}
          onSaved={() => showToast('🎙️ Rekaman suara narasi halaman tersimpan!')}
          isNight={isNight}
        />
      )}

      {session.showCompletionModal && selectedStory && (
        <BookCompletionModal
          story={selectedStory}
          onClose={session.closeCompletionModal}
          onReadAgain={() => {
            session.closeCompletionModal();
            session.changePage(0);
          }}
          onBackToCatalog={() => {
            session.closeCompletionModal();
            session.backToLibrary();
          }}
          onOpenQuiz={() => {
            session.closeCompletionModal();
            overlays.openQuizPage(selectedStory.pages[selectedStory.pages.length - 1]);
          }}
          onOpenOfflineDownload={() => {
            session.closeCompletionModal();
            onRequestDownload(selectedStory);
          }}
          isNight={isNight}
        />
      )}
    </>
  );
}
