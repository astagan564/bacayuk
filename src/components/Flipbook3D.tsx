import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Languages,
  Mic,
  RotateCcw,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { GlossaryItem, InteractiveElement, ReadingSettings, Story, StoryPage } from '../types';
import { VocabDefinition } from '../data/vocabulary';
import { playInteractionSound, playPageFlipSound } from '../utils/soundEngine';
import { speechEngine } from '../utils/speechEngine';
import { voiceRecordingsStore } from '../utils/voiceRecordings';
import { createFallbackVocabularyQuiz } from '../utils/quizOptions';
import { StoryIllustration } from './Illustrations';
import { InteractiveStoryText } from './InteractiveStoryText';
import { VocabTooltipModal } from './VocabTooltipModal';
import { VocabularyQuizModal } from './VocabularyQuizModal';

interface FlipbookProps {
  story: Story;
  currentPageIndex: number;
  onPageChange: (newIndex: number) => void;
  onCompleteBook?: () => void;
  settings: ReadingSettings;
  onOpenQuiz?: (page: StoryPage) => void;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  onOpenVoiceRecorder?: (pageNum: number, pageText: string) => void;
}

const getDisplayedPageTitle = (page: StoryPage, languageMode: ReadingSettings['languageMode']) => {
  const title = page.title?.trim() || '';
  const titleEn = page.titleEn?.trim() || '';

  if (languageMode === 'en') return titleEn || title;
  if (languageMode === 'dual' && titleEn) return title ? `${title} / ${titleEn}` : titleEn;
  return title;
};

const getPageNarration = (page: StoryPage, languageMode: ReadingSettings['languageMode']) => {
  const useEnglish = languageMode === 'en';
  const title = useEnglish ? page.titleEn?.trim() : page.title?.trim();
  const text = useEnglish ? page.textEn?.trim() || '' : page.text;

  return {
    text: [title, text].filter(Boolean).join('. '),
    language: useEnglish ? 'en-US' as const : 'id-ID' as const,
    allowCustomRecording: !useEnglish,
  };
};

const actionButtonClass =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--warm-gold)] focus-visible:ring-offset-2';

export const Flipbook3D: React.FC<FlipbookProps> = ({
  story,
  currentPageIndex,
  onPageChange,
  onCompleteBook,
  settings,
  onOpenQuiz,
  isBookmarked = false,
  onToggleBookmark,
  onOpenVoiceRecorder,
}) => {
  const [isFlipping, setIsFlipping] = useState(false);
  const [activeInteractive, setActiveInteractive] = useState<InteractiveElement | null>(null);
  const [animatedElementId, setAnimatedElementId] = useState<string | null>(null);
  const [activeSpeechPage, setActiveSpeechPage] = useState<number | null>(null);
  const [selectedVocab, setSelectedVocab] = useState<VocabDefinition | null>(null);
  const [selectedGlossary, setSelectedGlossary] = useState<GlossaryItem | null>(null);
  const [showVocabQuizModal, setShowVocabQuizModal] = useState(false);
  const [hasCustomRecording, setHasCustomRecording] = useState(false);

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeResolveRef = useRef<(() => void) | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const totalPages = story.pages.length;
  const activePage = story.pages[currentPageIndex];
  const isBackCover = currentPageIndex >= totalPages;
  const isNight = settings.themeMode === 'night';
  const isSpreadView = settings.displayView === 'double';
  const languageMode = settings.languageMode || 'id';
  const fallbackVocabularyQuiz = useMemo(
    () => createFallbackVocabularyQuiz(story.title, story.glossary || []),
    [story.glossary, story.title]
  );

  useEffect(() => {
    let isMounted = true;

    const checkRecording = async () => {
      if (!activePage) {
        if (isMounted) setHasCustomRecording(false);
        return;
      }

      const recordingUrl = await voiceRecordingsStore.getRecordingUrl(story.id, activePage.pageNumber);
      if (isMounted) setHasCustomRecording(Boolean(recordingUrl));
    };

    checkRecording();
    return () => {
      isMounted = false;
    };
  }, [activePage, story.id]);

  const stopActiveAudio = () => {
    speechEngine.stop();
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    setActiveSpeechPage(null);
    if (activeResolveRef.current) {
      activeResolveRef.current();
      activeResolveRef.current = null;
    }
  };

  const handleNext = () => {
    if (isFlipping || currentPageIndex >= totalPages) return;
    setIsFlipping(true);
    playPageFlipSound(settings.pageAudioFx);
    stopActiveAudio();
    window.setTimeout(() => {
      onPageChange(currentPageIndex + 1);
      setIsFlipping(false);
    }, 240);
  };

  const handlePrev = () => {
    if (isFlipping || currentPageIndex <= 0) return;
    setIsFlipping(true);
    playPageFlipSound(settings.pageAudioFx);
    stopActiveAudio();
    window.setTimeout(() => {
      onPageChange(currentPageIndex - 1);
      setIsFlipping(false);
    }, 240);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === 'PageDown') handleNext();
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPageIndex, isFlipping, settings.pageAudioFx, totalPages]);

  const handleInteractiveTap = (element: InteractiveElement) => {
    setActiveInteractive(element);
    setAnimatedElementId(element.id);
    playInteractionSound(element.soundType || 'pop', settings.soundFx);

    if (element.dialogue) {
      speechEngine.speak(element.dialogue, settings.speechRate, settings.speechPitch);
    }

    window.setTimeout(() => setAnimatedElementId(null), 1200);
  };

  const handleSpeakPage = (page: StoryPage): Promise<void> => {
    return new Promise(async (resolve) => {
      const narration = getPageNarration(page, languageMode);
      if (!narration.text) {
        resolve();
        return;
      }

      stopActiveAudio();
      activeResolveRef.current = resolve;
      setActiveSpeechPage(page.pageNumber);

      const finish = () => {
        setActiveSpeechPage(null);
        activeAudioRef.current = null;
        if (activeResolveRef.current === resolve) {
          activeResolveRef.current = null;
          resolve();
        }
      };

      const customAudioUrl = narration.allowCustomRecording
        ? await voiceRecordingsStore.getRecordingUrl(story.id, page.pageNumber)
        : null;

      if (customAudioUrl) {
        const audio = new Audio(customAudioUrl);
        activeAudioRef.current = audio;
        audio.onended = finish;
        audio.onerror = () => {
          speechEngine.speak(narration.text, settings.speechRate, settings.speechPitch, {
            onEnd: finish,
            language: narration.language,
          });
        };
        audio.play().catch(finish);
        return;
      }

      speechEngine.speak(narration.text, settings.speechRate, settings.speechPitch, {
        onEnd: finish,
        language: narration.language,
      });
    });
  };

  useEffect(() => {
    setActiveInteractive(null);
    let isCancelled = false;

    const playSequence = async () => {
      if (!settings.autoPlay || !activePage) return;
      await handleSpeakPage(activePage);
      if (isCancelled || !settings.autoPlay) return;

      await new Promise((resolve) => window.setTimeout(resolve, (settings.autoPlayDelay || 3) * 1000));
      if (!isCancelled && settings.autoPlay && currentPageIndex < totalPages) handleNext();
    };

    if (settings.autoPlay && activePage) playSequence();
    if (!settings.autoPlay) stopActiveAudio();

    return () => {
      isCancelled = true;
    };
  }, [activePage, currentPageIndex, settings.autoPlay, settings.autoPlayDelay]);

  const fontClasses = {
    sm: 'text-sm sm:text-base lg:text-[1.05rem] leading-[1.7]',
    base: 'text-base sm:text-[1.05rem] lg:text-lg leading-[1.72]',
    lg: 'text-lg sm:text-xl lg:text-[1.3rem] leading-[1.68]',
    xl: 'text-xl sm:text-[1.35rem] lg:text-2xl leading-[1.64]',
  };

  const toolbarSurface = isNight
    ? 'border-slate-700/80 bg-slate-900/92 text-slate-100 shadow-slate-950/30'
    : 'border-[#d8c9ad] bg-[#fffaf0]/94 text-[#35291f] shadow-[#6f5635]/10';
  const quietAction = isNight
    ? 'border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700'
    : 'border-[#dfd2bd] bg-white/75 text-[#604b38] hover:bg-white';
  const activeAction = isNight
    ? 'border-blue-400 bg-blue-500 text-white'
    : 'border-[#2f8f6b] bg-[#2f8f6b] text-white';

  const renderToolbar = () => (
    <nav
      aria-label="Alat bantu membaca"
      className={`mb-3 flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 shadow-lg backdrop-blur-md sm:px-4 ${toolbarSurface}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${isNight ? 'bg-slate-800' : 'bg-[#efe4d1]'}`}>
          <BookOpen className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold sm:text-sm">{story.title}</p>
          <p className={`text-[10px] font-semibold tracking-wide ${isNight ? 'text-slate-400' : 'text-[#806c58]'}`}>
            {activePage ? `Halaman ${activePage.pageNumber} dari ${totalPages}` : 'Sampul belakang'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {activePage?.quizQuestion && onOpenQuiz && (
          <button type="button" onClick={() => onOpenQuiz(activePage)} className={`${actionButtonClass} ${quietAction}`}>
            <HelpCircle className="h-4 w-4" />
            <span>Kuis</span>
          </button>
        )}

        {activePage && onOpenVoiceRecorder && languageMode !== 'en' && (
          <button
            type="button"
            onClick={() => onOpenVoiceRecorder(activePage.pageNumber, activePage.text)}
            className={`${actionButtonClass} ${hasCustomRecording ? activeAction : quietAction}`}
            title={hasCustomRecording ? 'Ubah rekaman halaman ini' : 'Rekam suara untuk halaman ini'}
          >
            <Mic className={`h-4 w-4 ${hasCustomRecording ? 'fill-current' : ''}`} />
            <span>{hasCustomRecording ? 'Rekaman' : 'Rekam'}</span>
          </button>
        )}

        {activePage && (
          <button
            type="button"
            onClick={() => handleSpeakPage(activePage)}
            className={`${actionButtonClass} ${activeSpeechPage === activePage.pageNumber ? activeAction : quietAction}`}
            aria-pressed={activeSpeechPage === activePage.pageNumber}
          >
            <Volume2 className="h-4 w-4" />
            <span>Baca</span>
          </button>
        )}

        {activePage && onToggleBookmark && (
          <button
            type="button"
            onClick={onToggleBookmark}
            className={`${actionButtonClass} ${isBookmarked ? activeAction : quietAction}`}
            aria-pressed={isBookmarked}
          >
            <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">Tandai</span>
          </button>
        )}

        {isBackCover && (story.vocabularyQuiz || (story.glossary && story.glossary.length > 0)) && (
          <button type="button" onClick={() => setShowVocabQuizModal(true)} className={`${actionButtonClass} ${activeAction}`}>
            <Languages className="h-4 w-4" />
            <span>Kuis kosakata</span>
          </button>
        )}

        {isBackCover && (
          <button type="button" onClick={() => onPageChange(0)} className={`${actionButtonClass} ${quietAction}`}>
            <RotateCcw className="h-4 w-4" />
            <span>Baca dari awal</span>
          </button>
        )}

        {isBackCover && onCompleteBook && (
          <button type="button" onClick={onCompleteBook} className={`${actionButtonClass} ${activeAction}`}>
            <Sparkles className="h-4 w-4" />
            <span>Selesaikan</span>
          </button>
        )}
      </div>
    </nav>
  );

  const renderInteractiveElements = (page: StoryPage) => (
    <>
      {page.interactiveElements?.map((element) => {
        const isAnimated = animatedElementId === element.id;
        return (
          <button
            type="button"
            key={element.id}
            onClick={() => handleInteractiveTap(element)}
            className={`group absolute z-20 grid min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/80 bg-white/75 p-1.5 text-2xl shadow-lg backdrop-blur-sm transition-transform duration-300 hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/80 sm:text-3xl ${
              isAnimated ? 'scale-110 animate-bounce' : ''
            }`}
            style={{ left: `${element.x}%`, top: `${element.y}%` }}
            aria-label={element.label}
          >
            <span>{element.emoji || '✨'}</span>
            <span className="pointer-events-none absolute bottom-full mb-2 hidden whitespace-nowrap rounded-lg bg-[#2f241c]/90 px-2 py-1 text-[10px] font-bold text-white shadow-md group-hover:block sm:block sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
              {element.label}
            </span>
          </button>
        );
      })}

      {activeInteractive && page.interactiveElements?.some((element) => element.id === activeInteractive.id) && (
        <div className="absolute inset-x-4 bottom-4 z-30 mx-auto flex max-w-md items-center justify-center gap-2 rounded-xl border border-white/70 bg-white/92 px-4 py-2.5 text-center text-xs font-semibold text-[#3f3025] shadow-xl backdrop-blur-md sm:text-sm">
          <span>{activeInteractive.emoji}</span>
          <span>“{activeInteractive.dialogue || activeInteractive.label}”</span>
        </div>
      )}
    </>
  );

  const renderStorySpread = (page: StoryPage) => {
    const pageTitle = getDisplayedPageTitle(page, languageMode);
    const paperStyle = isNight
      ? { background: 'radial-gradient(circle at 20% 10%, #202b3d 0, #121a28 58%, #0d1420 100%)' }
      : {
          backgroundColor: '#fffdf8',
          backgroundImage:
            'radial-gradient(circle at 20% 15%, rgba(130,102,68,0.055) 0 0.7px, transparent 0.9px), radial-gradient(circle at 70% 65%, rgba(130,102,68,0.04) 0 0.6px, transparent 0.8px)',
          backgroundSize: '13px 13px, 17px 17px',
        };

    return (
      <article
        key={page.pageNumber}
        className={`grid h-full min-h-0 w-full ${isSpreadView ? 'md:grid-cols-2' : 'grid-cols-1 md:grid-rows-[minmax(18rem,1fr)_auto]'}`}
      >
        <figure className={`relative min-h-[18rem] overflow-hidden ${isSpreadView ? 'md:min-h-0' : 'md:min-h-[24rem]'}`}>
          <StoryIllustration type={page.illustrationType} imageUrl={page.imageUrl} />
          {renderInteractiveElements(page)}
          <figcaption className="sr-only">Ilustrasi untuk halaman {page.pageNumber}: {pageTitle}</figcaption>
        </figure>

        <section
          className={`relative flex min-h-[20rem] flex-col overflow-y-auto border-t px-6 py-7 sm:px-8 sm:py-8 md:min-h-0 md:px-8 lg:px-10 ${
            isSpreadView ? 'md:border-l md:border-t-0' : ''
          } ${isNight ? 'border-slate-700 text-slate-100' : 'border-[#d9cfbd] text-[#251f1a]'}`}
          style={paperStyle}
        >
          <header className="flex items-start justify-between gap-4">
            <p className={`text-[10px] font-semibold tracking-[0.18em] ${isNight ? 'text-slate-400' : 'text-[#8a7968]'}`}>
              {story.author}
            </p>
            <p className={`text-[10px] font-semibold tabular-nums ${isNight ? 'text-slate-400' : 'text-[#8a7968]'}`}>
              {String(page.pageNumber).padStart(2, '0')}
            </p>
          </header>

          <div className="flex flex-1 items-center py-8 sm:py-10">
            <div className="mx-auto w-full max-w-[34rem]">
              {pageTitle && (
                <h2 className={`mb-4 text-balance font-serif text-xl font-semibold leading-[1.18] sm:text-2xl lg:text-[1.7rem] ${isNight ? 'text-slate-50' : 'text-[#2c241e]'}`}>
                  {pageTitle}
                </h2>
              )}
              <div className={`reader-editorial-copy max-w-[62ch] font-serif font-medium ${fontClasses[settings.fontSize]}`}>
                <InteractiveStoryText
                  text={page.text}
                  textEn={page.textEn}
                  languageMode={languageMode}
                  glossary={story.glossary || []}
                  onSelectVocab={setSelectedVocab}
                  onSelectGlossary={setSelectedGlossary}
                />
              </div>
            </div>
          </div>

          <footer className={`flex items-end justify-between text-[10px] font-semibold ${isNight ? 'text-slate-500' : 'text-[#958472]'}`}>
            <span>{story.title}</span>
            <span className="tabular-nums">{page.pageNumber}</span>
          </footer>
        </section>
      </article>
    );
  };

  const renderBackCover = () => (
    <section
      className={`flex h-full min-h-[30rem] w-full flex-col items-center justify-center px-8 text-center ${
        isNight ? 'bg-[#121a28] text-slate-100' : 'bg-[#fffdf7] text-[#30251d]'
      }`}
    >
      <span className={`mb-6 grid h-20 w-20 place-items-center rounded-full ${isNight ? 'bg-slate-800' : 'bg-[#efe3cc]'}`}>
        <Sparkles className="h-9 w-9 text-[var(--warm-gold)]" />
      </span>
      <p className={`mb-2 text-xs font-semibold tracking-[0.2em] ${isNight ? 'text-slate-400' : 'text-[#8b7259]'}`}>TAMAT</p>
      <h2 className="max-w-2xl font-serif text-3xl font-semibold leading-tight sm:text-5xl">Cerita selesai, pesannya tetap tinggal.</h2>
      <p className={`mt-6 max-w-xl font-serif text-base leading-8 sm:text-lg ${isNight ? 'text-slate-300' : 'text-[#665342]'}`}>
        “{story.moralMessage}”
      </p>
    </section>
  );

  return (
    <section
      className="mx-auto flex w-full max-w-[90rem] select-none flex-col items-center px-2 py-2 sm:px-4"
      onContextMenu={(event) => event.preventDefault()}
      onCopy={(event) => event.preventDefault()}
      onTouchStart={(event) => {
        touchStartX.current = event.targetTouches[0].clientX;
        touchEndX.current = null;
      }}
      onTouchMove={(event) => {
        touchEndX.current = event.targetTouches[0].clientX;
      }}
      onTouchEnd={() => {
        if (touchStartX.current === null || touchEndX.current === null) return;
        const distance = touchStartX.current - touchEndX.current;
        if (distance > 50) handleNext();
        if (distance < -50) handlePrev();
      }}
    >
      {renderToolbar()}

      <div className="grid w-full grid-cols-1 items-center gap-3 md:grid-cols-[3rem_minmax(0,1fr)_3rem] lg:gap-5">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentPageIndex === 0 || isFlipping}
          className={`hidden h-12 w-12 items-center justify-center rounded-full border shadow-lg transition-all hover:-translate-x-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-20 md:flex ${quietAction}`}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div
          className={`relative min-h-[34rem] w-full overflow-hidden rounded-[1.4rem] border shadow-[0_24px_70px_rgba(54,39,24,0.22)] transition-all duration-300 md:aspect-[16/11] md:min-h-0 ${
            isSpreadView ? 'max-w-none' : 'mx-auto max-w-4xl md:aspect-[4/5]'
          } ${isNight ? 'border-slate-700 bg-slate-900' : 'border-[#bfae93] bg-[#fffdf7]'} ${
            isFlipping ? 'translate-y-1 scale-[0.995] opacity-75' : 'translate-y-0 scale-100 opacity-100'
          }`}
          style={{ boxShadow: isNight ? '0 24px 70px rgba(2, 6, 23, 0.58)' : undefined }}
        >
          {isSpreadView && !isBackCover && (
            <div className="pointer-events-none absolute inset-y-0 left-1/2 z-30 hidden w-8 -translate-x-1/2 bg-gradient-to-r from-black/12 via-black/5 to-transparent md:block" />
          )}
          {activePage ? renderStorySpread(activePage) : renderBackCover()}
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={currentPageIndex >= totalPages || isFlipping}
          className={`hidden h-12 w-12 items-center justify-center rounded-full border shadow-lg transition-all hover:translate-x-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-20 md:flex ${quietAction}`}
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      <nav aria-label="Navigasi halaman seluler" className={`mt-3 flex w-full items-center justify-between rounded-2xl border p-2 shadow-sm md:hidden ${toolbarSurface}`}>
        <button type="button" onClick={handlePrev} disabled={currentPageIndex === 0 || isFlipping} className={`${actionButtonClass} ${quietAction} disabled:opacity-30`}>
          <ChevronLeft className="h-4 w-4" />
          <span>Sebelumnya</span>
        </button>
        <span className="px-2 text-[11px] font-bold tabular-nums">{Math.min(currentPageIndex + 1, totalPages)} / {totalPages}</span>
        <button type="button" onClick={handleNext} disabled={currentPageIndex >= totalPages || isFlipping} className={`${actionButtonClass} ${quietAction} disabled:opacity-30`}>
          <span>Berikutnya</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>

      {selectedVocab && (
        <VocabTooltipModal vocab={selectedVocab} onClose={() => setSelectedVocab(null)} isNight={isNight} />
      )}
      {selectedGlossary && (
        <VocabTooltipModal glossaryItem={selectedGlossary} onClose={() => setSelectedGlossary(null)} isNight={isNight} />
      )}
      {showVocabQuizModal && (story.vocabularyQuiz || story.glossary) && (
        <VocabularyQuizModal
          quiz={story.vocabularyQuiz || fallbackVocabularyQuiz}
          onClose={() => setShowVocabQuizModal(false)}
          isNight={isNight}
        />
      )}
    </section>
  );
};
