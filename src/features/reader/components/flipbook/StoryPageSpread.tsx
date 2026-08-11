import type { MouseEvent } from 'react';
import type { GlossaryItem, InteractiveElement, ReadingSettings, Story, StoryPage } from '@/types';
import type { VocabDefinition } from '@/data/vocabulary';
import { StoryIllustration } from '@/components/Illustrations';
import { InteractiveStoryText } from '@/components/InteractiveStoryText';
import { StoryInteractiveElements } from '@/features/reader/components/flipbook/StoryInteractiveElements';
import {
  getDisplayedPageTitle,
  getReaderPaperStyle,
  READER_FONT_CLASSES,
} from '@/features/reader/helpers/readerPageContent';

interface StoryPageSpreadProps {
  story: Story;
  page: StoryPage;
  settings: ReadingSettings;
  languageMode: ReadingSettings['languageMode'];
  isNight: boolean;
  activeInteractive: InteractiveElement | null;
  animatedElementId: string | null;
  onPageClick: (event: MouseEvent<HTMLElement>) => void;
  onInteractiveTap: (element: InteractiveElement) => void;
  onSelectVocab: (vocab: VocabDefinition) => void;
  onSelectGlossary: (glossary: GlossaryItem) => void;
}

export function StoryPageSpread({
  story,
  page,
  settings,
  languageMode,
  isNight,
  activeInteractive,
  animatedElementId,
  onPageClick,
  onInteractiveTap,
  onSelectVocab,
  onSelectGlossary,
}: StoryPageSpreadProps) {
  const pageTitle = getDisplayedPageTitle(page, languageMode);

  return (
    <article
      onClick={onPageClick}
      className="grid min-h-0 w-full grid-cols-1 md:h-full md:cursor-pointer md:grid-cols-2"
      aria-label={`Halaman ${page.pageNumber}. Di desktop, klik sisi kiri untuk kembali atau sisi kanan untuk lanjut.`}
    >
      <figure className="relative aspect-[4/3] min-h-[14rem] overflow-hidden sm:aspect-[16/10] md:min-h-0 md:aspect-auto">
        <StoryIllustration type={page.illustrationType} imageUrl={page.imageUrl} />
        <StoryInteractiveElements
          elements={page.interactiveElements}
          activeInteractive={activeInteractive}
          animatedElementId={animatedElementId}
          onInteractiveTap={onInteractiveTap}
        />
        <figcaption className="sr-only">
          Ilustrasi untuk halaman {page.pageNumber}: {pageTitle}
        </figcaption>
      </figure>

      <section
        className="relative flex min-h-0 flex-col overflow-visible border-t border-default text-primary px-5 py-6 sm:px-8 sm:py-8 md:min-h-0 md:overflow-y-auto md:border-l md:border-t-0 md:px-8 lg:px-10"
        style={getReaderPaperStyle(isNight)}
      >
        <header>
          <p className="text-[10px] font-semibold tracking-[0.18em] text-secondary">{story.author}</p>
        </header>

        <div className="flex flex-1 items-center py-6 sm:py-8 md:py-10">
          <div className="mx-auto w-full max-w-[34rem]">
            {pageTitle && (
              <h2 className="mb-4 text-balance font-serif text-xl font-semibold leading-[1.18] sm:text-2xl lg:text-[1.7rem] text-primary">
                {pageTitle}
              </h2>
            )}
            <div className={`reader-editorial-copy max-w-[62ch] font-serif font-medium ${READER_FONT_CLASSES[settings.fontSize]}`}>
              <InteractiveStoryText
                text={page.text}
                textEn={page.textEn}
                languageMode={languageMode}
                glossary={story.glossary || []}
                onSelectVocab={onSelectVocab}
                onSelectGlossary={onSelectGlossary}
              />
            </div>
          </div>
        </div>

        <footer className="flex items-end justify-between text-[10px] font-semibold text-secondary">
          <span>{story.title}</span>
          <span className="tabular-nums">{page.pageNumber}</span>
        </footer>
      </section>
    </article>
  );
}
