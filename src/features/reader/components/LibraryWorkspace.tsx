import type { RefObject } from 'react';
import type { PersonalLibrary } from '@/features/account';
import type { ReadingSettings, Story } from '../../../types';
import { StorySelector } from '@/features/reader/components/catalog/StorySelector';
import { Flipbook3D } from '@/features/reader/components/flipbook/Flipbook3D';
import type { FlipbookHandle } from '@/features/reader/types/flipbook';
import { ReaderNavigationControls } from '@/features/reader/components/navigation/ReaderNavigationControls';

interface LibraryWorkspaceProps {
  bookmarks: Record<string, number>;
  completedStories: Record<string, boolean>;
  currentPageIndex: number;
  flipbookRef: RefObject<FlipbookHandle | null>;
  isThumbnailsOpen: boolean;
  personalLibrary: PersonalLibrary;
  readingTimes: Record<string, number>;
  readingViewRef: RefObject<HTMLDivElement | null>;
  selectedStory: Story | null;
  settings: ReadingSettings;
  stories: Story[];
  onBackToLibrary: () => void;
  onCompleteBook: (story: Story) => void;
  onOpenOfflineDownload: (story: Story) => void;
  onOpenPayment: (story: Story) => void;
  onOpenQuiz: (story: Story, pageIndex: number) => void;
  onOpenStats: () => void;
  onOpenStoryMaker: () => void;
  onOpenVip: () => void;
  onOpenVoiceRecorder: (story: Story, pageIndex: number) => void;
  onPageChange: (pageIndex: number) => void;
  onSelectStory: (story: Story, pageIndex?: number) => void;
  onTestRestReminder: () => void;
  onToggleBookmark: () => void;
  onToggleFavorite: (storyId: string) => void;
  onToggleThumbnails: () => void;
  onUpdateSettings: (settings: Partial<ReadingSettings>) => void;
}

export function LibraryWorkspace({
  bookmarks,
  completedStories,
  currentPageIndex,
  flipbookRef,
  isThumbnailsOpen,
  personalLibrary,
  readingTimes,
  readingViewRef,
  selectedStory,
  settings,
  stories,
  onBackToLibrary,
  onCompleteBook,
  onOpenOfflineDownload,
  onOpenPayment,
  onOpenQuiz,
  onOpenStats,
  onOpenStoryMaker,
  onOpenVip,
  onOpenVoiceRecorder,
  onPageChange,
  onSelectStory,
  onTestRestReminder,
  onToggleBookmark,
  onToggleFavorite,
  onToggleThumbnails,
  onUpdateSettings,
}: LibraryWorkspaceProps) {
  return (
    <main className={`flex-1 w-full flex flex-col items-center ${selectedStory ? 'justify-start py-2 sm:py-3 lg:h-[100dvh] lg:min-h-0' : 'justify-center py-4'}`}>
      {!selectedStory ? (
        <StorySelector
          stories={stories}
          bookmarks={bookmarks}
          completedStories={completedStories}
          readingTimes={readingTimes}
          favoriteStoryIds={personalLibrary.favoriteStoryIds}
          recentStoryIds={personalLibrary.recentStoryIds}
          onSelectStory={onSelectStory}
          onToggleFavorite={onToggleFavorite}
          onOpenStoryMaker={onOpenStoryMaker}
          onOpenVip={onOpenVip}
          onOpenStatsModal={onOpenStats}
          onOpenPaymentModal={onOpenPayment}
          onOpenOfflineDownloadModal={onOpenOfflineDownload}
          onTestRestReminder={onTestRestReminder}
        />
      ) : (
        <div ref={readingViewRef} className="w-full reader-fade-in flex flex-col lg:h-full lg:min-h-0 lg:flex-row lg:items-stretch lg:gap-3 lg:px-4 lg:py-2">
          <div className="flex-1 min-w-0 flex flex-col items-center lg:h-full lg:min-h-0">
            <Flipbook3D
              ref={flipbookRef}
              story={selectedStory}
              currentPageIndex={currentPageIndex}
              onPageChange={onPageChange}
              settings={settings}
              onCompleteBook={() => onCompleteBook(selectedStory)}
            />
            <div className="lg:hidden h-36 max-[380px]:h-48 w-full shrink-0" />
          </div>

          <ReaderNavigationControls
            title={selectedStory.title}
            currentPageIndex={currentPageIndex}
            totalPages={selectedStory.pages.length}
            onPageChange={onPageChange}
            settings={settings}
            onUpdateSettings={onUpdateSettings}
            onToggleThumbnails={onToggleThumbnails}
            onBackToLibrary={onBackToLibrary}
            isBookmarked={bookmarks[selectedStory.id] === currentPageIndex}
            onToggleBookmark={onToggleBookmark}
            onOpenVoiceRecorder={() => onOpenVoiceRecorder(selectedStory, currentPageIndex)}
            onOpenOfflineDownload={() => onOpenOfflineDownload(selectedStory)}
            isBackCover={currentPageIndex >= selectedStory.pages.length}
            onReadPage={selectedStory.pages[currentPageIndex] ? () => flipbookRef.current?.readCurrentPage() : undefined}
            onOpenQuiz={selectedStory.pages[currentPageIndex]?.quizQuestion ? () => onOpenQuiz(selectedStory, currentPageIndex) : undefined}
          />
        </div>
      )}
    </main>
  );
}
