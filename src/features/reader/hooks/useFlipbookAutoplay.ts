import { useEffect } from 'react';
import type { StoryPage } from '@/types';

interface FlipbookAutoplayOptions {
  activePage?: StoryPage;
  currentPageIndex: number;
  totalPages: number;
  isEnabled: boolean;
  delaySeconds: number;
  speakPage: (page: StoryPage) => Promise<void>;
  stopActiveAudio: () => void;
  goNext: () => void;
}

export function useFlipbookAutoplay({
  activePage,
  currentPageIndex,
  totalPages,
  isEnabled,
  delaySeconds,
  speakPage,
  stopActiveAudio,
  goNext,
}: FlipbookAutoplayOptions) {
  useEffect(() => {
    let isCancelled = false;
    let delayTimer: number | null = null;
    let resolveDelay: (() => void) | null = null;

    const playSequence = async () => {
      if (!isEnabled || !activePage) return;
      await speakPage(activePage);
      if (isCancelled || !isEnabled) return;

      await new Promise<void>((resolve) => {
        resolveDelay = resolve;
        delayTimer = window.setTimeout(resolve, (delaySeconds || 3) * 1000);
      });

      if (!isCancelled && isEnabled && currentPageIndex < totalPages) goNext();
    };

    if (isEnabled && activePage) void playSequence();
    else stopActiveAudio();

    return () => {
      isCancelled = true;
      stopActiveAudio();
      if (delayTimer !== null) window.clearTimeout(delayTimer);
      resolveDelay?.();
    };
  }, [activePage, currentPageIndex, delaySeconds, goNext, isEnabled, speakPage, stopActiveAudio, totalPages]);
}
