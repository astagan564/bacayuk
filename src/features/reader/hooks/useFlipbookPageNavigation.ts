import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent, TouchEvent } from 'react';
import type { ReadingSettings } from '@/types';
import { playPageFlipSound } from '@/utils/soundEngine';

interface FlipbookPageNavigationOptions {
  storyId: string;
  currentPageIndex: number;
  totalPages: number;
  onPageChange: (newIndex: number) => void;
  pageAudioFx: ReadingSettings['pageAudioFx'];
  stopActiveAudio: () => void;
}

const FLIP_DURATION_MS = 240;
const MINIMUM_SWIPE_DISTANCE_PX = 64;

export function useFlipbookPageNavigation({
  storyId,
  currentPageIndex,
  totalPages,
  onPageChange,
  pageAudioFx,
  stopActiveAudio,
}: FlipbookPageNavigationOptions) {
  const [isFlipping, setIsFlipping] = useState(false);
  const isFlipLockedRef = useRef(false);
  const flipTimerRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number } | null>(null);

  const changePageWithAnimation = useCallback((nextPageIndex: number) => {
    if (isFlipLockedRef.current) return;
    isFlipLockedRef.current = true;
    setIsFlipping(true);
    playPageFlipSound(pageAudioFx);
    stopActiveAudio();

    if (flipTimerRef.current !== null) window.clearTimeout(flipTimerRef.current);
    flipTimerRef.current = window.setTimeout(() => {
      flipTimerRef.current = null;
      onPageChange(nextPageIndex);
      isFlipLockedRef.current = false;
      setIsFlipping(false);
    }, FLIP_DURATION_MS);
  }, [onPageChange, pageAudioFx, stopActiveAudio]);

  const goNext = useCallback(() => {
    if (isFlipLockedRef.current || currentPageIndex >= totalPages) return;
    changePageWithAnimation(currentPageIndex + 1);
  }, [changePageWithAnimation, currentPageIndex, totalPages]);

  const goPrevious = useCallback(() => {
    if (isFlipLockedRef.current || currentPageIndex <= 0) return;
    changePageWithAnimation(currentPageIndex - 1);
  }, [changePageWithAnimation, currentPageIndex]);

  const handlePageClick = useCallback((event: MouseEvent<HTMLElement>) => {
    if (window.matchMedia('(max-width: 767px)').matches) return;
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select, [role="button"]')) return;
    if (window.getSelection()?.toString().trim()) return;

    const pageBounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < pageBounds.left + pageBounds.width / 2) goPrevious();
    else goNext();
  }, [goNext, goPrevious]);

  const handleTouchStart = useCallback((event: TouchEvent<HTMLElement>) => {
    touchStartRef.current = {
      x: event.targetTouches[0].clientX,
      y: event.targetTouches[0].clientY,
    };
    touchEndRef.current = null;
  }, []);

  const handleTouchMove = useCallback((event: TouchEvent<HTMLElement>) => {
    touchEndRef.current = {
      x: event.targetTouches[0].clientX,
      y: event.targetTouches[0].clientY,
    };
  }, []);

  const handleTouchEnd = useCallback((event: TouchEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select, [role="button"]')) return;
    if (!touchStartRef.current || !touchEndRef.current) return;

    const horizontalDistance = touchStartRef.current.x - touchEndRef.current.x;
    const verticalDistance = touchStartRef.current.y - touchEndRef.current.y;
    const isHorizontalSwipe = Math.abs(horizontalDistance) > MINIMUM_SWIPE_DISTANCE_PX
      && Math.abs(horizontalDistance) > Math.abs(verticalDistance) * 1.5;
    if (!isHorizontalSwipe) return;
    if (horizontalDistance > 0) goNext();
    else goPrevious();
  }, [goNext, goPrevious]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === 'PageDown') goNext();
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') goPrevious();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrevious]);

  useEffect(() => {
    if (flipTimerRef.current !== null) {
      window.clearTimeout(flipTimerRef.current);
      flipTimerRef.current = null;
    }
    isFlipLockedRef.current = false;
    setIsFlipping(false);
  }, [currentPageIndex, storyId]);

  useEffect(() => () => {
    if (flipTimerRef.current !== null) window.clearTimeout(flipTimerRef.current);
  }, []);

  return {
    isFlipping,
    goNext,
    goPrevious,
    handlePageClick,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}

export type FlipbookPageNavigation = ReturnType<typeof useFlipbookPageNavigation>;
