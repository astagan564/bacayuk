import { useCallback, useEffect, useRef, useState } from 'react';
import { voiceRecordingsStore } from '@/utils/voiceRecordings';
import { revokeAudioBlobUrl } from '@/features/reader/helpers/audioResource';
import type {
  VoiceRecorderModalProps,
  VoiceRecordingMutation,
} from '@/features/reader/types/voiceRecorder';

type VoiceRecorderControllerOptions = Pick<
  VoiceRecorderModalProps,
  'storyId' | 'pageNumber' | 'onClose' | 'onSaved'
>;

export function useVoiceRecorderController({
  storyId,
  pageNumber,
  onClose,
  onSaved,
}: VoiceRecorderControllerOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [hasExistingRecording, setHasExistingRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [isRequestingMicrophone, setIsRequestingMicrophone] = useState(false);
  const [activeMutation, setActiveMutation] = useState<VoiceRecordingMutation>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const loadRequestRef = useRef(0);
  const recordingRequestRef = useRef(0);
  const isRequestingMicrophoneRef = useRef(false);
  const isMountedRef = useRef(true);

  const stopTimer = useCallback((): void => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const stopPreview = useCallback((): void => {
    const audio = audioPreviewRef.current;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
    }
    audioPreviewRef.current = null;
    if (isMountedRef.current) setIsPlayingPreview(false);
  }, []);

  const cancelActiveRecording = useCallback((): void => {
    recordingRequestRef.current += 1;
    isRequestingMicrophoneRef.current = false;
    stopTimer();
    const recorder = mediaRecorderRef.current;
    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      if (recorder.state !== 'inactive') recorder.stop();
    }
    mediaRecorderRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    audioChunksRef.current = [];
    if (isMountedRef.current) {
      setIsRequestingMicrophone(false);
      setIsRecording(false);
    }
  }, [stopTimer]);

  const replaceAudioUrl = useCallback((url: string | null): void => {
    if (audioUrlRef.current !== url) revokeAudioBlobUrl(audioUrlRef.current);
    audioUrlRef.current = url;
    setRecordedAudioUrl(url);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      loadRequestRef.current += 1;
      stopPreview();
      cancelActiveRecording();
      revokeAudioBlobUrl(audioUrlRef.current);
      audioUrlRef.current = null;
    };
  }, [cancelActiveRecording, stopPreview]);

  useEffect(() => {
    const requestId = ++loadRequestRef.current;
    cancelActiveRecording();
    stopPreview();
    setRecordedBlob(null);
    setHasExistingRecording(false);
    replaceAudioUrl(null);

    void voiceRecordingsStore.getRecordingUrl(storyId, pageNumber).then((url) => {
      if (!isMountedRef.current || requestId !== loadRequestRef.current) {
        revokeAudioBlobUrl(url);
        return;
      }
      if (url) {
        replaceAudioUrl(url);
        setHasExistingRecording(true);
      }
    });
  }, [cancelActiveRecording, pageNumber, replaceAudioUrl, stopPreview, storyId]);

  const startRecording = useCallback(async (): Promise<void> => {
    if (isRequestingMicrophoneRef.current || mediaRecorderRef.current) return;
    isRequestingMicrophoneRef.current = true;
    setIsRequestingMicrophone(true);
    const requestId = ++recordingRequestRef.current;
    setMicError(null);
    audioChunksRef.current = [];
    setRecordingSeconds(0);
    stopPreview();
    let stream: MediaStream | null = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!isMountedRef.current || requestId !== recordingRequestRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        isRequestingMicrophoneRef.current = false;
        return;
      }

      const recorder = new MediaRecorder(stream);
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        stream?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        if (!isMountedRef.current || requestId !== recordingRequestRef.current) return;
        replaceAudioUrl(URL.createObjectURL(audioBlob));
        setRecordedBlob(audioBlob);
        setHasExistingRecording(false);
        setIsRecording(false);
      };

      recorder.start();
      isRequestingMicrophoneRef.current = false;
      setIsRequestingMicrophone(false);
      setIsRecording(true);
      stopTimer();
      timerRef.current = setInterval(() => {
        if (isMountedRef.current) setRecordingSeconds((seconds) => seconds + 1);
      }, 1000);
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop());
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
      }
      mediaRecorderRef.current = null;
      mediaStreamRef.current = null;
      isRequestingMicrophoneRef.current = false;
      console.error('Microphone access error:', error);
      if (isMountedRef.current && requestId === recordingRequestRef.current) {
        setIsRequestingMicrophone(false);
        setIsRecording(false);
        setMicError('Izin mikrofon ditolak atau tidak tersedia pada peramban ini.');
      }
    }
  }, [replaceAudioUrl, stopPreview, stopTimer]);

  const stopRecording = useCallback((): void => {
    stopTimer();
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    setIsRecording(false);
  }, [stopTimer]);

  const togglePreview = useCallback((): void => {
    if (!recordedAudioUrl) return;
    if (isPlayingPreview) {
      stopPreview();
      return;
    }

    stopPreview();
    const audio = new Audio(recordedAudioUrl);
    audioPreviewRef.current = audio;
    audio.onended = () => {
      if (audioPreviewRef.current === audio) audioPreviewRef.current = null;
      if (isMountedRef.current) setIsPlayingPreview(false);
    };
    audio.onerror = () => {
      if (audioPreviewRef.current === audio) audioPreviewRef.current = null;
      if (isMountedRef.current) setIsPlayingPreview(false);
    };
    setIsPlayingPreview(true);
    void audio.play().catch(() => {
      if (audioPreviewRef.current === audio) audioPreviewRef.current = null;
      if (isMountedRef.current) setIsPlayingPreview(false);
    });
  }, [isPlayingPreview, recordedAudioUrl, stopPreview]);

  const saveRecording = useCallback(async (): Promise<void> => {
    if (!recordedBlob || activeMutation) return;
    setActiveMutation('saving');
    try {
      const storedUrl = await voiceRecordingsStore.saveRecording(storyId, pageNumber, recordedBlob);
      revokeAudioBlobUrl(storedUrl);
      if (!isMountedRef.current) return;
      onSaved();
      onClose();
    } finally {
      if (isMountedRef.current) setActiveMutation(null);
    }
  }, [activeMutation, onClose, onSaved, pageNumber, recordedBlob, storyId]);

  const deleteRecording = useCallback(async (): Promise<void> => {
    if (activeMutation) return;
    setActiveMutation('deleting');
    try {
      await voiceRecordingsStore.deleteRecording(storyId, pageNumber);
      if (!isMountedRef.current) return;
      stopPreview();
      replaceAudioUrl(null);
      setRecordedBlob(null);
      setHasExistingRecording(false);
      setRecordingSeconds(0);
      onSaved();
    } finally {
      if (isMountedRef.current) setActiveMutation(null);
    }
  }, [activeMutation, onSaved, pageNumber, replaceAudioUrl, stopPreview, storyId]);

  return {
    isRecording,
    recordingSeconds,
    recordedAudioUrl,
    recordedBlob,
    isPlayingPreview,
    hasExistingRecording,
    micError,
    isRequestingMicrophone,
    activeMutation,
    startRecording,
    stopRecording,
    togglePreview,
    saveRecording,
    deleteRecording,
  };
}

export type VoiceRecorderController = ReturnType<typeof useVoiceRecorderController>;
