import React, { useState, useEffect, useRef } from 'react';
import { Story, StoryPage, ReadingSettings, InteractiveElement, GlossaryItem } from '../types';
import { StoryIllustration } from './Illustrations';
import { playPageFlipSound, playInteractionSound } from '../utils/soundEngine';
import { speechEngine } from '../utils/speechEngine';
import { ChevronLeft, ChevronRight, Volume2, Sparkles, HelpCircle, Bookmark, BookOpen, Mic, Languages } from 'lucide-react';
import { InteractiveStoryText } from './InteractiveStoryText';
import { VocabTooltipModal } from './VocabTooltipModal';
import { VocabularyQuizModal } from './VocabularyQuizModal';
import { VocabDefinition } from '../data/vocabulary';
import { voiceRecordingsStore } from '../utils/voiceRecordings';

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
  const [turningDirection, setTurningDirection] = useState<'next' | 'prev' | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [activeInteractive, setActiveInteractive] = useState<InteractiveElement | null>(null);
  const [animatedElementId, setAnimatedElementId] = useState<string | null>(null);
  const [activeSpeechPage, setActiveSpeechPage] = useState<number | null>(null);
  const [selectedVocab, setSelectedVocab] = useState<VocabDefinition | null>(null);
  const [selectedGlossary, setSelectedGlossary] = useState<GlossaryItem | null>(null);
  const [showVocabQuizModal, setShowVocabQuizModal] = useState(false);
  const [hasCustomRecordings, setHasCustomRecordings] = useState<Record<number, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeResolveRef = useRef<(() => void) | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const totalPages = story.pages.length;
  const isDoubleView = settings.displayView === 'double';
  const isNight = settings.themeMode === 'night';

  // Calculate max allowed index to include back cover
  const maxAllowedIndex = isDoubleView && totalPages % 2 !== 0 ? totalPages - 1 : totalPages;

  // For double view, ensure left page index is even (0, 2, 4, etc.)
  const currentSpreadLeft = isDoubleView ? Math.floor(currentPageIndex / 2) * 2 : currentPageIndex;
  const leftPageObj = story.pages[currentSpreadLeft];
  const rightPageObj = isDoubleView && currentSpreadLeft + 1 < totalPages ? story.pages[currentSpreadLeft + 1] : null;

  // Check custom voice recordings availability for left and right pages
  useEffect(() => {
    let isMounted = true;
    const checkRecordings = async () => {
      const records: Record<number, boolean> = {};
      if (leftPageObj) {
        const url = await voiceRecordingsStore.getRecordingUrl(story.id, leftPageObj.pageNumber);
        records[leftPageObj.pageNumber] = !!url;
      }
      if (rightPageObj) {
        const url = await voiceRecordingsStore.getRecordingUrl(story.id, rightPageObj.pageNumber);
        records[rightPageObj.pageNumber] = !!url;
      }
      if (isMounted) {
        setHasCustomRecordings(records);
      }
    };
    checkRecordings();
    return () => {
      isMounted = false;
    };
  }, [story.id, currentPageIndex, leftPageObj, rightPageObj]);

  // Handle keyboard page turn
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPageIndex, totalPages, isDoubleView, settings.pageAudioFx]);

  // Read aloud automatically when page changes if autoPlay
  useEffect(() => {
    setActiveInteractive(null);
    let isCancelled = false;

    const playSequence = async () => {
      if (!settings.autoPlay) return;

      if (leftPageObj) {
        await handleSpeakPage(leftPageObj.text, leftPageObj.pageNumber);
      }
      if (isCancelled || !settings.autoPlay) return;

      if (isDoubleView && rightPageObj) {
        // Small pause between pages
        await new Promise(res => setTimeout(res, 500));
        if (isCancelled || !settings.autoPlay) return;
        await handleSpeakPage(rightPageObj.text, rightPageObj.pageNumber);
      }

      if (isCancelled || !settings.autoPlay) return;

      // Wait for delay before turning page
      await new Promise(res => setTimeout(res, (settings.autoPlayDelay || 3) * 1000));
      
      if (!isCancelled && settings.autoPlay) {
        const step = isDoubleView ? 2 : 1;
        if (currentPageIndex + step <= maxAllowedIndex) {
          handleNext();
        }
      }
    };

    if (settings.autoPlay && currentPageIndex < maxAllowedIndex) {
      playSequence();
    } else if (!settings.autoPlay) {
      // If autoPlay is turned off, stop any ongoing speech
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
    }

    return () => {
      isCancelled = true;
    };
  }, [currentPageIndex, settings.autoPlay, isDoubleView, leftPageObj, rightPageObj, maxAllowedIndex, settings.autoPlayDelay]);

  const handleNext = () => {
    if (isFlipping) return;
    const step = isDoubleView ? 2 : 1;
    if (currentPageIndex + step <= maxAllowedIndex) {
      setTurningDirection('next');
      setIsFlipping(true);
      playPageFlipSound(settings.pageAudioFx);

      setTimeout(() => {
        onPageChange(currentPageIndex + step);
        setIsFlipping(false);
        setTurningDirection(null);
      }, 450);
    }
  };

  const handlePrev = () => {
    if (isFlipping) return;
    const step = isDoubleView ? 2 : 1;
    if (currentPageIndex - step >= 0) {
      setTurningDirection('prev');
      setIsFlipping(true);
      playPageFlipSound(settings.pageAudioFx);

      setTimeout(() => {
        onPageChange(Math.max(0, currentPageIndex - step));
        setIsFlipping(false);
        setTurningDirection(null);
      }, 450);
    }
  };

  const handleInteractiveTap = (elem: InteractiveElement) => {
    setActiveInteractive(elem);
    setAnimatedElementId(elem.id);

    playInteractionSound(elem.soundType || 'pop', settings.soundFx);

    if (elem.dialogue) {
      speechEngine.speak(elem.dialogue, settings.speechRate, settings.speechPitch);
    }

    setTimeout(() => {
      setAnimatedElementId(null);
    }, 1200);
  };

  const handleSpeakPage = (text: string, pageNum?: number): Promise<void> => {
    return new Promise(async (resolve) => {
      if (pageNum === undefined) {
        resolve();
        return;
      }

      // Resolve the previous one if it exists to unblock any pending awaits
      if (activeResolveRef.current) {
        activeResolveRef.current();
        activeResolveRef.current = null;
      }
      activeResolveRef.current = resolve;

      const finish = () => {
        setActiveSpeechPage(null);
        if (activeAudioRef.current) {
          activeAudioRef.current = null;
        }
        if (activeResolveRef.current === resolve) {
          activeResolveRef.current = null;
          resolve();
        }
      };

      speechEngine.stop();
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }

      setActiveSpeechPage(pageNum);

      // Check if custom voice recording exists
      const customAudioUrl = await voiceRecordingsStore.getRecordingUrl(story.id, pageNum);

      if (customAudioUrl) {
        const audio = new Audio(customAudioUrl);
        activeAudioRef.current = audio;

        audio.onended = finish;

        audio.onerror = () => {
          // Fallback to text-to-speech if audio fails to load
          speechEngine.speak(text, settings.speechRate, settings.speechPitch, {
            onEnd: finish,
          });
        };

        audio.play().catch(finish);
      } else {
        speechEngine.speak(text, settings.speechRate, settings.speechPitch, {
          onEnd: finish,
        });
      }
    });
  };

  const renderBackCover = () => (
    <div
      className={`h-full flex flex-col items-center justify-center text-center p-6 rounded-xl border-2 ${
        isNight
          ? 'bg-gradient-to-br from-slate-900 to-indigo-950 border-indigo-700 text-indigo-100'
          : 'bg-gradient-to-br from-amber-100 to-amber-200 border-amber-300 text-amber-950'
      }`}
    >
      <span className="text-6xl mb-3 animate-bounce">🌟</span>
      <h3 className={`text-2xl font-black mb-1 ${isNight ? 'text-indigo-100' : 'text-amber-950'}`}>Tamat!</h3>
      <p className={`text-xs sm:text-sm max-w-xs mb-4 font-medium ${isNight ? 'text-indigo-200' : 'text-amber-800'}`}>
        "{story.moralMessage}"
      </p>

      {/* Vocabulary Quiz trigger if available */}
      {(story.vocabularyQuiz || (story.glossary && story.glossary.length > 0)) && (
        <button
          onClick={() => setShowVocabQuizModal(true)}
          className="mb-4 px-5 py-3 font-black text-xs sm:text-sm rounded-2xl shadow-xl transition-all hover:scale-105 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center gap-2 border border-indigo-300"
        >
          <Languages className="w-5 h-5 text-amber-300" />
          <span>Mainkan Kuis Kosakata Bahasa Inggris 🎮</span>
        </button>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-2">
        {onCompleteBook && (
          <button
            onClick={onCompleteBook}
            className="px-5 py-2.5 font-black text-xs sm:text-sm rounded-full shadow-lg transition-transform hover:scale-105 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-amber-950 flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-950" />
            <span>Rayakan Tamat Cerita 🌟</span>
          </button>
        )}
        <button
          onClick={() => onPageChange(0)}
          className={`px-5 py-2.5 font-bold text-xs sm:text-sm rounded-full shadow-md transition-transform hover:scale-105 ${
            isNight ? 'bg-indigo-700 hover:bg-indigo-600 text-white' : 'bg-amber-700 hover:bg-amber-600 text-white'
          }`}
        >
          Baca Dari Awal
        </button>
      </div>
    </div>
  );

  const fontClasses = {
    sm: 'text-sm sm:text-base leading-relaxed',
    base: 'text-base sm:text-lg leading-relaxed',
    lg: 'text-lg sm:text-xl leading-relaxed',
    xl: 'text-xl sm:text-2xl leading-relaxed',
  };

  return (
    <div
      className="relative w-full max-w-6xl mx-auto flex flex-col items-center justify-center p-2 sm:p-4 select-none"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => {
        e.preventDefault();
        return false;
      }}
      onTouchStart={(e) => {
        touchStartX.current = e.targetTouches[0].clientX;
        touchEndX.current = null;
      }}
      onTouchMove={(e) => {
        touchEndX.current = e.targetTouches[0].clientX;
      }}
      onTouchEnd={() => {
        if (!touchStartX.current || !touchEndX.current) return;
        const distance = touchStartX.current - touchEndX.current;
        if (distance > 50) handleNext();
        if (distance < -50) handlePrev();
      }}
    >
      {/* 3D Book Container */}
      <div
        ref={containerRef}
        className={`relative w-full aspect-[3/4] sm:aspect-[16/10] max-h-[85vh] sm:max-h-[75vh] flex rounded-2xl shadow-2xl overflow-hidden border-4 transition-colors duration-500 ${
          isNight
            ? 'bg-slate-900 border-indigo-900/80 shadow-indigo-950/80'
            : 'bg-amber-50 border-amber-900/30 shadow-2xl'
        }`}
        style={{ perspective: '1600px' }}
      >
        {/* Book Central Spine Shadow */}
        {isDoubleView && (
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 bg-gradient-to-r from-black/20 via-black/5 to-black/20 z-30 pointer-events-none hidden sm:block" />
        )}

        {/* Physical Bookmark Ribbon Badge hanging on top right */}
        {isBookmarked && (
          <div
            onClick={onToggleBookmark}
            className="absolute top-0 right-6 sm:right-10 z-40 cursor-pointer group flex flex-col items-center"
            title="Halaman ini ditandai! Klik untuk melepas penanda."
          >
            <div className="w-7 h-9 sm:w-9 sm:h-12 bg-gradient-to-b from-yellow-400 via-amber-500 to-red-500 rounded-b-md shadow-2xl border-x border-b border-amber-200/60 flex flex-col items-center justify-end pb-1 transition-transform group-hover:scale-110">
              <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white fill-white drop-shadow-md" />
            </div>
          </div>
        )}

        {/* --- LEFT PAGE / SINGLE PAGE --- */}
        <div
          className={`relative h-full transition-all duration-300 ${
            isDoubleView ? 'w-1/2 border-r border-amber-900/10' : 'w-full'
          } flex flex-col justify-between p-4 sm:p-6 md:p-8 overflow-hidden ${
            isFlipping && turningDirection === 'prev' ? 'animate-page-turn-prev' : ''
          } ${
            isFlipping && !isDoubleView && turningDirection === 'next' ? 'animate-page-turn-next' : ''
          }`}
          style={{
            transformOrigin: isDoubleView ? 'right center' : turningDirection === 'next' ? 'left center' : 'right center',
            background: isNight
              ? 'linear-gradient(135deg, #1e1b2e 0%, #0f172a 100%)'
              : `linear-gradient(135deg, ${leftPageObj?.colors?.bgGradFrom || '#ffffff'}, ${leftPageObj?.colors?.bgGradTo || '#fef3c7'})`,
          }}
        >
          {leftPageObj ? (
            <>
          {/* Page Top Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 z-10 mb-2">
            <span
              className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                isNight ? 'text-indigo-300' : 'text-amber-900/60'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${isNight ? 'text-indigo-400' : 'text-amber-600'}`} /> Halaman {leftPageObj?.pageNumber}
            </span>

            <div className="flex items-center gap-1.5">
              {leftPageObj?.quizQuestion && onOpenQuiz && (
                <button
                  onClick={() => onOpenQuiz(leftPageObj)}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-xs font-bold flex items-center gap-1 shadow-sm transition-transform hover:scale-105"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Kuis</span>
                </button>
              )}

              {onOpenVoiceRecorder && leftPageObj && (
                <button
                  onClick={() => onOpenVoiceRecorder(leftPageObj.pageNumber, leftPageObj.text)}
                  className={`p-1.5 sm:p-2 rounded-full transition-all duration-200 flex items-center gap-1 text-xs font-semibold shadow-sm ${
                    hasCustomRecordings[leftPageObj.pageNumber]
                      ? 'bg-rose-500 text-white shadow-md ring-2 ring-rose-300'
                      : isNight
                      ? 'bg-slate-800 hover:bg-slate-700 text-indigo-200 border border-indigo-700'
                      : 'bg-white/80 hover:bg-white text-amber-900 border border-amber-200'
                  }`}
                  title={
                    hasCustomRecordings[leftPageObj.pageNumber]
                      ? 'Suara Rekaman Tersedia (Klik untuk ubah/rekam ulang)'
                      : 'Rekam Suara Sendiri Untuk Halaman Ini'
                  }
                >
                  <Mic className={`w-3.5 h-3.5 ${hasCustomRecordings[leftPageObj.pageNumber] ? 'fill-white' : ''}`} />
                  <span className="hidden sm:inline">
                    {hasCustomRecordings[leftPageObj.pageNumber] ? 'Suara Kustom' : 'Rekam'}
                  </span>
                </button>
              )}

              <button
                onClick={() => handleSpeakPage(leftPageObj.text, leftPageObj.pageNumber)}
                className={`p-1.5 sm:p-2 rounded-full transition-all duration-200 flex items-center gap-1.5 text-xs font-semibold shadow-sm ${
                  activeSpeechPage === leftPageObj?.pageNumber
                    ? 'bg-amber-600 text-white scale-105 ring-2 ring-amber-400'
                    : isNight
                    ? 'bg-slate-800 hover:bg-slate-700 text-indigo-200 border border-indigo-700'
                    : 'bg-white/80 hover:bg-white text-amber-900 border border-amber-200'
                }`}
                title="Baca Halaman Ini"
              >
                <Volume2 className="w-4 h-4" />
                <span className="hidden sm:inline">Baca</span>
              </button>
            </div>
          </div>

          {/* Illustration Stage */}
          <div className={`relative flex-1 w-full rounded-xl overflow-hidden border-2 shadow-inner my-2 ${isNight ? 'border-indigo-900/60' : 'border-white/60'}`}>
            <StoryIllustration type={leftPageObj?.illustrationType || 'forest'} />

            {/* Interactive Tap Elements Overlay */}
            {leftPageObj?.interactiveElements?.map((elem) => {
              const isAnimated = animatedElementId === elem.id;
              return (
                <div
                  key={elem.id}
                  onClick={() => handleInteractiveTap(elem)}
                  className="absolute cursor-pointer transition-transform duration-300 hover:scale-125 z-20 group"
                  style={{ left: `${elem.x}%`, top: `${elem.y}%` }}
                >
                  <div
                    className={`text-2xl sm:text-4xl p-1.5 rounded-full bg-white/70 shadow-md backdrop-blur-xs flex items-center justify-center border border-white/80 ${
                      isAnimated
                        ? elem.animation === 'hop'
                          ? 'animate-bounce text-amber-600 scale-125 ring-4 ring-amber-300'
                          : elem.animation === 'spin'
                          ? 'animate-spin'
                          : elem.animation === 'bounce'
                          ? 'animate-bounce'
                          : 'animate-pulse scale-125 ring-4 ring-pink-300'
                        : 'hover:animate-pulse'
                    }`}
                  >
                    {elem.emoji || '✨'}
                  </div>
                  {/* Tooltip Label */}
                  <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-amber-950 text-white text-[10px] sm:text-xs px-2 py-0.5 rounded-md whitespace-nowrap shadow-lg pointer-events-none">
                    {elem.label}
                  </span>
                </div>
              );
            })}

            {/* Dialogue Bubble Popup */}
            {activeInteractive && leftPageObj?.interactiveElements?.some((e) => e.id === activeInteractive.id) && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 max-w-[90%] bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border-2 border-amber-400 text-amber-950 text-xs sm:text-sm font-semibold animate-bounce z-30 flex items-center gap-2">
                <span>{activeInteractive.emoji}</span>
                <span>"{activeInteractive.dialogue}"</span>
              </div>
            )}
          </div>

          {/* Story Text Box */}
          <div
            className={`mt-2 p-3 sm:p-4 rounded-xl backdrop-blur-md shadow-sm border ${
              isNight
                ? 'bg-slate-900/90 border-indigo-500/30 text-indigo-100'
                : `${leftPageObj?.colors.textBg} border-amber-900/10 text-white`
            } font-medium ${fontClasses[settings.fontSize]} overflow-y-auto min-h-[80px] sm:min-h-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-black/20 [&::-webkit-scrollbar-thumb]:rounded-full`}
          >
            {leftPageObj?.title && (
              <h3 className={`font-bold mb-1 text-sm sm:text-base ${isNight ? 'text-indigo-200' : 'text-amber-200'}`}>
                {leftPageObj.title}
              </h3>
            )}
            <p className={isNight ? 'text-slate-200 leading-relaxed' : 'text-amber-50 leading-relaxed'}>
              <InteractiveStoryText
                text={leftPageObj?.text || ''}
                textEn={leftPageObj?.textEn}
                languageMode={settings.languageMode || 'id'}
                glossary={story.glossary || []}
                onSelectVocab={setSelectedVocab}
                onSelectGlossary={setSelectedGlossary}
                isNight={isNight}
              />
            </p>
          </div>
            </>
          ) : (
            renderBackCover()
          )}

          {/* Page Corner Turn Flip Handle Left */}
          {currentPageIndex > 0 && (
            <div
              onClick={handlePrev}
              className="absolute left-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-r from-amber-900/10 to-transparent opacity-0 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-start pl-1 z-40"
              title="Halaman Sebelumnya"
            >
              <div className="p-1.5 bg-amber-900 text-white rounded-r-lg shadow-md">
                <ChevronLeft className="w-5 h-5" />
              </div>
            </div>
          )}
        </div>

        {/* --- RIGHT PAGE (For Double Page Spread) --- */}
        {isDoubleView && (
          <div
            className={`relative w-1/2 h-full flex flex-col justify-between p-4 sm:p-6 md:p-8 overflow-hidden ${
              isFlipping && turningDirection === 'next' ? 'animate-page-turn-next' : ''
            }`}
            style={{
              transformOrigin: 'left center',
              background: isNight
                ? 'linear-gradient(135deg, #0f172a 0%, #1e1b2e 100%)'
                : `linear-gradient(135deg, ${rightPageObj?.colors?.bgGradFrom || '#fef3c7'}, ${rightPageObj?.colors?.bgGradTo || '#ffffff'})`,
            }}
          >
            {rightPageObj ? (
              <>
                {/* Right Page Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 z-10 mb-2">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                      isNight ? 'text-indigo-300' : 'text-amber-900/60'
                    }`}
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isNight ? 'text-indigo-400' : 'text-amber-600'}`} /> Halaman {rightPageObj.pageNumber}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {rightPageObj.quizQuestion && onOpenQuiz && (
                      <button
                        onClick={() => onOpenQuiz(rightPageObj)}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-xs font-bold flex items-center gap-1 shadow-sm transition-transform hover:scale-105"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Kuis</span>
                      </button>
                    )}

                    {onOpenVoiceRecorder && (
                      <button
                        onClick={() => onOpenVoiceRecorder(rightPageObj.pageNumber, rightPageObj.text)}
                        className={`p-1.5 sm:p-2 rounded-full transition-all duration-200 flex items-center gap-1 text-xs font-semibold shadow-sm ${
                          hasCustomRecordings[rightPageObj.pageNumber]
                            ? 'bg-rose-500 text-white shadow-md ring-2 ring-rose-300'
                            : isNight
                            ? 'bg-slate-800 hover:bg-slate-700 text-indigo-200 border border-indigo-700'
                            : 'bg-white/80 hover:bg-white text-amber-900 border border-amber-200'
                        }`}
                        title={
                          hasCustomRecordings[rightPageObj.pageNumber]
                            ? 'Suara Rekaman Tersedia (Klik untuk ubah/rekam ulang)'
                            : 'Rekam Suara Sendiri Untuk Halaman Ini'
                        }
                      >
                        <Mic className={`w-3.5 h-3.5 ${hasCustomRecordings[rightPageObj.pageNumber] ? 'fill-white' : ''}`} />
                        <span className="hidden sm:inline">
                          {hasCustomRecordings[rightPageObj.pageNumber] ? 'Suara Kustom' : 'Rekam'}
                        </span>
                      </button>
                    )}

                    <button
                      onClick={() => handleSpeakPage(rightPageObj.text, rightPageObj.pageNumber)}
                      className={`p-1.5 sm:p-2 rounded-full transition-all duration-200 flex items-center gap-1.5 text-xs font-semibold shadow-sm ${
                        activeSpeechPage === rightPageObj.pageNumber
                          ? 'bg-amber-600 text-white scale-105 ring-2 ring-amber-400'
                          : isNight
                          ? 'bg-slate-800 hover:bg-slate-700 text-indigo-200 border border-indigo-700'
                          : 'bg-white/80 hover:bg-white text-amber-900 border border-amber-200'
                      }`}
                    >
                      <Volume2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Baca</span>
                    </button>
                  </div>
                </div>

                {/* Right Page Illustration */}
                <div className={`relative flex-1 w-full rounded-xl overflow-hidden border-2 shadow-inner my-2 ${isNight ? 'border-indigo-900/60' : 'border-white/60'}`}>
                  <StoryIllustration type={rightPageObj.illustrationType} />

                  {/* Interactive Tap Elements */}
                  {rightPageObj.interactiveElements?.map((elem) => {
                    const isAnimated = animatedElementId === elem.id;
                    return (
                      <div
                        key={elem.id}
                        onClick={() => handleInteractiveTap(elem)}
                        className="absolute cursor-pointer transition-transform duration-300 hover:scale-125 z-20 group"
                        style={{ left: `${elem.x}%`, top: `${elem.y}%` }}
                      >
                        <div
                          className={`text-2xl sm:text-4xl p-1.5 rounded-full bg-white/70 shadow-md backdrop-blur-xs flex items-center justify-center border border-white/80 ${
                            isAnimated
                              ? elem.animation === 'hop'
                                ? 'animate-bounce text-amber-600 scale-125 ring-4 ring-amber-300'
                                : elem.animation === 'spin'
                                ? 'animate-spin'
                                : 'animate-pulse scale-125 ring-4 ring-pink-300'
                              : 'hover:animate-pulse'
                          }`}
                        >
                          {elem.emoji || '✨'}
                        </div>
                        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-amber-950 text-white text-[10px] sm:text-xs px-2 py-0.5 rounded-md whitespace-nowrap shadow-lg pointer-events-none">
                          {elem.label}
                        </span>
                      </div>
                    );
                  })}

                  {activeInteractive && rightPageObj.interactiveElements?.some((e) => e.id === activeInteractive.id) && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 max-w-[90%] bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border-2 border-amber-400 text-amber-950 text-xs sm:text-sm font-semibold animate-bounce z-30 flex items-center gap-2">
                      <span>{activeInteractive.emoji}</span>
                      <span>"{activeInteractive.dialogue}"</span>
                    </div>
                  )}
                </div>

                {/* Story Text Box Right */}
                <div
                  className={`mt-2 p-3 sm:p-4 rounded-xl backdrop-blur-md shadow-sm border ${
                    isNight
                      ? 'bg-slate-900/90 border-indigo-500/30 text-indigo-100'
                      : `${rightPageObj.colors.textBg} border-amber-900/10 text-white`
                  } font-medium ${fontClasses[settings.fontSize]} overflow-y-auto min-h-[80px] sm:min-h-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-black/20 [&::-webkit-scrollbar-thumb]:rounded-full`}
                >
                  {rightPageObj.title && (
                    <h3 className={`font-bold mb-1 text-sm sm:text-base ${isNight ? 'text-indigo-200' : 'text-amber-200'}`}>
                      {rightPageObj.title}
                    </h3>
                  )}
                  <p className={isNight ? 'text-slate-200 leading-relaxed' : 'text-amber-50 leading-relaxed'}>
                    <InteractiveStoryText
                      text={rightPageObj.text || ''}
                      textEn={rightPageObj.textEn}
                      languageMode={settings.languageMode || 'id'}
                      glossary={story.glossary || []}
                      onSelectVocab={setSelectedVocab}
                      onSelectGlossary={setSelectedGlossary}
                      isNight={isNight}
                    />
                  </p>
                </div>
              </>
            ) : leftPageObj ? (
              renderBackCover()
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-50 font-bold text-amber-900/40">
                Sampul Belakang
              </div>
            )}

            {/* Page Corner Turn Flip Handle Right */}
            {currentPageIndex + (isDoubleView ? 2 : 1) < totalPages && (
              <div
                onClick={handleNext}
                className="absolute right-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-l from-amber-900/10 to-transparent opacity-0 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-end pr-1 z-40"
                title="Halaman Selanjutnya"
              >
                <div className="p-1.5 bg-amber-900 text-white rounded-l-lg shadow-md">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3D Animated Page Turn Overlay Simulation */}
        {isFlipping && (
          <div
            className={`absolute top-0 bottom-0 w-1/2 bg-amber-100 border border-amber-300 shadow-2xl z-50 transition-all duration-500 ease-in-out ${
              turningDirection === 'next'
                ? 'right-0 origin-left -rotate-y-180 opacity-90'
                : 'left-0 origin-right rotate-y-180 opacity-90'
            }`}
            style={{
              transformStyle: 'preserve-3d',
              background: 'linear-gradient(90deg, #fef3c7 0%, #ffffff 50%, #fde68a 100%)',
            }}
          />
        )}
      </div>

      {/* Floating Navigation Arrows On Sides */}
      <button
        onClick={handlePrev}
        disabled={currentPageIndex === 0}
        className={`hidden sm:block absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 p-3 rounded-full shadow-2xl disabled:opacity-20 disabled:cursor-not-allowed transition-all hover:scale-110 z-40 ${
          isNight
            ? 'bg-indigo-900/90 hover:bg-indigo-800 text-yellow-300 ring-2 ring-indigo-500/50'
            : 'bg-amber-900/80 hover:bg-amber-900 text-white'
        }`}
        title="Halaman Sebelumnya"
      >
        <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
      </button>

      <button
        onClick={handleNext}
        disabled={currentPageIndex + (isDoubleView ? 2 : 1) > maxAllowedIndex}
        className={`hidden sm:block absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 p-3 rounded-full shadow-2xl disabled:opacity-20 disabled:cursor-not-allowed transition-all hover:scale-110 z-40 ${
          isNight
            ? 'bg-indigo-900/90 hover:bg-indigo-800 text-yellow-300 ring-2 ring-indigo-500/50'
            : 'bg-amber-900/80 hover:bg-amber-900 text-white'
        }`}
        title="Halaman Selanjutnya"
      >
        <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
      </button>

      {/* Vocabulary Tooltip Modal */}
      {selectedVocab && (
        <VocabTooltipModal
          vocab={selectedVocab}
          onClose={() => setSelectedVocab(null)}
          isNight={isNight}
        />
      )}

      {/* Tap-to-Translate Glossary Modal */}
      {selectedGlossary && (
        <VocabTooltipModal
          glossaryItem={selectedGlossary}
          onClose={() => setSelectedGlossary(null)}
          isNight={isNight}
        />
      )}

      {/* Vocabulary Quiz Modal */}
      {showVocabQuizModal && (story.vocabularyQuiz || story.glossary) && (
        <VocabularyQuizModal
          quiz={
            story.vocabularyQuiz || {
              storyId: story.id,
              title: `Kuis Kosakata: ${story.title}`,
              questions: (story.glossary || []).map((g) => ({
                id: g.id,
                wordEn: g.wordEn,
                correctTranslationId: g.translationId,
                optionsId: [
                  g.translationId,
                  'Kelinci',
                  'Hutan',
                  'Sahabat',
                ].sort(() => Math.random() - 0.5),
                phonetic: g.phonetic,
                emoji: g.emoji,
              })),
            }
          }
          onClose={() => setShowVocabQuizModal(false)}
          isNight={isNight}
        />
      )}
    </div>
  );
};
