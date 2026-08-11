import { useCallback, useEffect, useRef } from 'react';
import type { ReadingSettings, StoryPage } from '@/types';
import { revokeAudioBlobUrl } from '@/features/reader/helpers/audioResource';
import { getPageNarration } from '@/features/reader/helpers/readerPageContent';
import { speechEngine } from '@/utils/speechEngine';
import { voiceRecordingsStore } from '@/utils/voiceRecordings';

interface ReaderNarrationControllerOptions {
  storyId: string;
  languageMode: ReadingSettings['languageMode'];
  speechRate: number;
  speechPitch: number;
}

export function useReaderNarrationController({
  storyId,
  languageMode,
  speechRate,
  speechPitch,
}: ReaderNarrationControllerOptions) {
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeAudioUrlRef = useRef<string | null>(null);
  const activeResolveRef = useRef<(() => void) | null>(null);
  const audioRequestIdRef = useRef(0);

  const releaseActiveAudio = useCallback(() => {
    const activeAudio = activeAudioRef.current;
    if (activeAudio) {
      activeAudio.onended = null;
      activeAudio.onerror = null;
      activeAudio.pause();
    }
    activeAudioRef.current = null;
    revokeAudioBlobUrl(activeAudioUrlRef.current);
    activeAudioUrlRef.current = null;
  }, []);

  const stopActiveAudio = useCallback(() => {
    audioRequestIdRef.current += 1;
    speechEngine.stop();
    releaseActiveAudio();
    activeResolveRef.current?.();
    activeResolveRef.current = null;
  }, [releaseActiveAudio]);

  const speakPage = useCallback(async (page: StoryPage): Promise<void> => {
    const narration = getPageNarration(page, languageMode || 'id');
    if (!narration.text) return;

    stopActiveAudio();
    const requestId = audioRequestIdRef.current;
    const customAudioUrl = narration.allowCustomRecording
      ? await voiceRecordingsStore.getRecordingUrl(storyId, page.pageNumber)
      : null;

    if (requestId !== audioRequestIdRef.current) {
      revokeAudioBlobUrl(customAudioUrl);
      return;
    }

    await new Promise<void>((resolve) => {
      let isSettled = false;
      activeResolveRef.current = resolve;

      const finish = () => {
        if (isSettled) return;
        isSettled = true;
        releaseActiveAudio();
        if (activeResolveRef.current !== resolve) return;
        activeResolveRef.current = null;
        resolve();
      };

      if (customAudioUrl) {
        const audio = new Audio(customAudioUrl);
        activeAudioRef.current = audio;
        activeAudioUrlRef.current = customAudioUrl;
        audio.onended = finish;
        audio.onerror = () => {
          releaseActiveAudio();
          speechEngine.speak(narration.text, speechRate, speechPitch, {
            onEnd: finish,
            language: narration.language,
          });
        };
        void audio.play().catch(finish);
        return;
      }

      speechEngine.speak(narration.text, speechRate, speechPitch, {
        onEnd: finish,
        language: narration.language,
      });
    });
  }, [languageMode, releaseActiveAudio, speechPitch, speechRate, stopActiveAudio, storyId]);

  useEffect(() => stopActiveAudio, [stopActiveAudio]);

  return { speakPage, stopActiveAudio };
}

export type ReaderNarrationController = ReturnType<typeof useReaderNarrationController>;
