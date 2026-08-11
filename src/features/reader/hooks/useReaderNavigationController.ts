import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { ReadingSettings } from '@/types';
import { musicPlayer } from '@/utils/soundEngine';

interface ReaderNavigationControllerOptions {
  currentPageIndex: number;
  totalPages: number;
  settings: ReadingSettings;
  onPageChange: (newIndex: number) => void;
  onUpdateSettings: (newSettings: Partial<ReadingSettings>) => void;
}

export function useReaderNavigationController({
  currentPageIndex,
  totalPages,
  settings,
  onPageChange,
  onUpdateSettings,
}: ReaderNavigationControllerOptions) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);
  const [isMobileNavigationHidden, setIsMobileNavigationHidden] = useState(false);
  const mobileToolsTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileToolsDialogRef = useRef<HTMLDivElement>(null);

  const isNight = settings.themeMode === 'night';
  const canGoPrevious = currentPageIndex > 0;
  const canGoNext = currentPageIndex < totalPages;
  const pageLabel = currentPageIndex === totalPages
    ? 'Sampul belakang'
    : `Hal. ${currentPageIndex + 1} / ${totalPages}`;
  const readPageLabel = settings.languageMode === 'en'
    ? 'Baca English'
    : settings.languageMode === 'dual'
      ? 'Baca Bahasa Indonesia'
      : 'Baca halaman';

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!isMobileToolsOpen) return;

    const previousOverflow = document.body.style.overflow;
    const dialog = mobileToolsDialogRef.current;
    const focusableSelector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const getFocusableElements = () =>
      Array.from(dialog?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsMobileToolsOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => getFocusableElements()[0]?.focus());
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      mobileToolsTriggerRef.current?.focus();
    };
  }, [isMobileToolsOpen]);

  const goPrevious = useCallback(() => {
    if (canGoPrevious) onPageChange(currentPageIndex - 1);
  }, [canGoPrevious, currentPageIndex, onPageChange]);

  const goNext = useCallback(() => {
    if (canGoNext) onPageChange(currentPageIndex + 1);
  }, [canGoNext, currentPageIndex, onPageChange]);

  const selectPage = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    onPageChange(Number.parseInt(event.target.value, 10));
  }, [onPageChange]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    void document.documentElement.requestFullscreen().catch((error: unknown) => {
      console.warn('Failed to enter fullscreen mode:', error);
    });
  }, []);

  const toggleBackgroundMusic = useCallback(() => {
    onUpdateSettings({ bgMusic: musicPlayer.toggle() });
  }, [onUpdateSettings]);

  const openMobileTools = useCallback(() => setIsMobileToolsOpen(true), []);
  const closeMobileTools = useCallback(() => setIsMobileToolsOpen(false), []);
  const hideMobileNavigation = useCallback(() => setIsMobileNavigationHidden(true), []);
  const showMobileNavigation = useCallback(() => setIsMobileNavigationHidden(false), []);

  return {
    isFullscreen,
    isMobileToolsOpen,
    isMobileNavigationHidden,
    isNight,
    canGoPrevious,
    canGoNext,
    pageLabel,
    readPageLabel,
    mobileToolsTriggerRef,
    mobileToolsDialogRef,
    goPrevious,
    goNext,
    selectPage,
    toggleFullscreen,
    toggleBackgroundMusic,
    openMobileTools,
    closeMobileTools,
    hideMobileNavigation,
    showMobileNavigation,
  };
}

export type ReaderNavigationController = ReturnType<typeof useReaderNavigationController>;
