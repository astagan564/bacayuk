import { forwardRef, useImperativeHandle } from 'react';
import type { FlipbookHandle, FlipbookProps } from '@/features/reader/types/flipbook';
import { useFlipbookController } from '@/features/reader/hooks/useFlipbookController';
import { StoryPageSpread } from '@/features/reader/components/flipbook/StoryPageSpread';
import { BookBackCover } from '@/features/reader/components/flipbook/BookBackCover';
import { ReaderVocabularyOverlays } from '@/features/reader/components/flipbook/ReaderVocabularyOverlays';

export const Flipbook3D = forwardRef<FlipbookHandle, FlipbookProps>(({
  story,
  currentPageIndex,
  onPageChange,
  settings,
  onCompleteBook,
}, ref) => {
  const controller = useFlipbookController({
    story,
    currentPageIndex,
    onPageChange,
    settings,
  });

  useImperativeHandle(ref, () => ({
    readCurrentPage: () => {
      if (controller.activePage) void controller.speakPage(controller.activePage);
    },
    openVocabularyQuiz: controller.openVocabularyQuiz,
  }), [controller.activePage, controller.openVocabularyQuiz, controller.speakPage]);

  return (
    <section
      className="mx-auto flex w-full max-w-[90rem] touch-pan-y select-none flex-col items-center px-2 py-2 sm:px-4 lg:h-full lg:min-h-0"
      onContextMenu={(event) => event.preventDefault()}
      onCopy={(event) => event.preventDefault()}
      onTouchStart={controller.handleTouchStart}
      onTouchMove={controller.handleTouchMove}
      onTouchEnd={controller.handleTouchEnd}
    >
      <div className="w-full lg:flex lg:min-h-0 lg:flex-1 lg:items-center lg:justify-center">
        <div
          className={`reader-book-frame relative min-h-0 w-full max-w-none overflow-hidden rounded-[1.4rem] border border-default bg-surface shadow-[0_24px_70px_rgba(54,39,24,0.22)] dark:shadow-[0_24px_70px_rgba(2,6,23,0.58)] transition-all duration-300 md:aspect-[16/11] md:min-h-0 ${
            controller.isFlipping
              ? 'translate-y-1 scale-[0.995] opacity-75'
              : 'translate-y-0 scale-100 opacity-100'
          }`}
        >
          {!controller.isBackCover && (
            <div className="pointer-events-none absolute inset-y-0 left-1/2 z-30 hidden w-8 -translate-x-1/2 bg-gradient-to-r from-black/12 via-black/5 to-transparent md:block" />
          )}
          {controller.activePage ? (
            <StoryPageSpread
              key={controller.activePage.pageNumber}
              story={story}
              page={controller.activePage}
              settings={settings}
              languageMode={controller.languageMode}
              isNight={controller.isNight}
              activeInteractive={controller.activeInteractive}
              animatedElementId={controller.animatedElementId}
              onPageClick={controller.handlePageClick}
              onInteractiveTap={controller.handleInteractiveTap}
              onSelectVocab={controller.setSelectedVocab}
              onSelectGlossary={controller.setSelectedGlossary}
            />
          ) : (
            <BookBackCover
              story={story}
              hasVocabularyQuiz={controller.hasVocabularyQuiz}
              onOpenVocabularyQuiz={controller.openVocabularyQuiz}
              onCompleteBook={onCompleteBook}
            />
          )}
        </div>
      </div>

      <ReaderVocabularyOverlays
        story={story}
        selectedVocab={controller.selectedVocab}
        selectedGlossary={controller.selectedGlossary}
        isVocabularyQuizOpen={controller.isVocabularyQuizOpen}
        fallbackVocabularyQuiz={controller.fallbackVocabularyQuiz}
        isNight={controller.isNight}
        onCloseVocab={controller.closeVocab}
        onCloseGlossary={controller.closeGlossary}
        onCloseVocabularyQuiz={controller.closeVocabularyQuiz}
      />
    </section>
  );
});

Flipbook3D.displayName = 'Flipbook3D';
