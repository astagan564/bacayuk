import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Play, Pause, Trash2, CheckCircle2, X, Sparkles, Volume2, AlertCircle } from 'lucide-react';
import { voiceRecordingsStore } from '../utils/voiceRecordings';

interface VoiceRecorderModalProps {
  storyId: string;
  storyTitle: string;
  pageNumber: number; // 0-indexed or 1-indexed
  pageText: string;
  onClose: () => void;
  onSaved: () => void;
  isNight?: boolean;
}

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  storyId,
  storyTitle,
  pageNumber,
  pageText,
  onClose,
  onSaved,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [hasExistingRecording, setHasExistingRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Check if an existing recording exists for this page
  useEffect(() => {
    let isMounted = true;
    voiceRecordingsStore.getRecordingUrl(storyId, pageNumber).then((url) => {
      if (isMounted && url) {
        setRecordedAudioUrl(url);
        setHasExistingRecording(true);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [storyId, pageNumber]);

  // Clean up timer and media stream on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    setMicError(null);
    audioChunksRef.current = [];
    setRecordingSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedBlob(audioBlob);
        setRecordedAudioUrl(url);

        // Stop all audio tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access error:', err);
      setMicError('Izin mikrofon ditolak atau tidak tersedia pada peramban ini.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleTogglePreview = () => {
    if (!recordedAudioUrl) return;

    if (isPlayingPreview) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      setIsPlayingPreview(false);
    } else {
      const audio = new Audio(recordedAudioUrl);
      audioPreviewRef.current = audio;
      audio.onended = () => setIsPlayingPreview(false);
      audio.play();
      setIsPlayingPreview(true);
    }
  };

  const handleSave = async () => {
    if (recordedBlob) {
      await voiceRecordingsStore.saveRecording(storyId, pageNumber, recordedBlob);
    }
    onSaved();
    onClose();
  };

  const handleDelete = async () => {
    await voiceRecordingsStore.deleteRecording(storyId, pageNumber);
    setRecordedAudioUrl(null);
    setRecordedBlob(null);
    setHasExistingRecording(false);
    setRecordingSeconds(0);
    onSaved();
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-overlay)] backdrop-blur-md animate-fade-in">
      <div
        className="reader-modal w-full max-w-lg rounded-[1.35rem] p-6 sm:p-8 relative overflow-hidden flex flex-col gap-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b reader-divider">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-brand-rose text-white font-black shadow-md">
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-brand-rose">
                <Sparkles className="w-3 h-3" />
                <span>Rekam Suara Orang Tua & Anak</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Rekam Narasi Halaman {pageNumber + 1}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/10 transition-colors"
            title="Tutup Modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Text Prompt Box for Reading Aloud */}
        <div className="reader-soft-panel p-4 rounded-2xl flex flex-col gap-1.5">
          <span className="text-[11px] font-extrabold uppercase text-secondary">
            📖 Naskah Cerita Untuk Dibaca:
          </span>
          <p className="text-xs sm:text-sm text-primary font-medium leading-relaxed italic">
            "{pageText}"
          </p>
        </div>

        {/* Mic Error Notice */}
        {micError && (
          <div className="p-3 rounded-xl bg-error/10 border border-error/30 text-error text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{micError}</span>
          </div>
        )}

        {/* Recording Visual Area */}
        <div className="reader-soft-panel flex flex-col items-center justify-center p-6 rounded-2xl text-center gap-3">
          {isRecording ? (
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-brand-rose text-white flex items-center justify-center shadow-xl animate-pulse">
                  <Mic className="w-10 h-10" />
                </div>
                <div className="absolute -inset-2 rounded-full border-4 border-brand-rose/50 animate-ping pointer-events-none" />
              </div>
              <span className="text-2xl font-black text-brand-rose tracking-wider">
                {formatTimer(recordingSeconds)}
              </span>
              <span className="text-xs font-bold text-secondary">
                🔴 Merekam... Bacalah naskah cerita di atas secara perlahan.
              </span>
            </div>
          ) : recordedAudioUrl ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-success text-white flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <span className="text-xs font-extrabold text-success">
                {hasExistingRecording && !recordedBlob
                  ? 'Suara rekaman sebelumnya tersimpan!'
                  : 'Rekaman baru siap diputar atau disimpan!'}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-2xl bg-brand-blue/15 text-brand-blue flex items-center justify-center">
                <Mic className="w-8 h-8 opacity-80" />
              </div>
              <span className="text-xs font-semibold text-secondary max-w-xs">
                Tekan tombol rekam di bawah, lalu bacalah teks cerita dengan suara jernih!
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col gap-2.5">
          {!isRecording && !recordedAudioUrl && (
            <button
              onClick={startRecording}
              className="w-full py-4 px-6 rounded-2xl bg-brand-rose hover:opacity-90 text-white font-black text-sm shadow-xl transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <Mic className="w-5 h-5 animate-bounce" />
              <span>Mulai Merekam Suara</span>
            </button>
          )}

          {isRecording && (
            <button
              onClick={stopRecording}
              className="w-full py-4 px-6 rounded-2xl bg-error hover:opacity-90 text-white font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Square className="w-5 h-5 fill-white" />
              <span>Selesai Merekam</span>
            </button>
          )}

          {!isRecording && recordedAudioUrl && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={handleTogglePreview}
                className="btn-secondary py-3 px-4 text-xs flex items-center justify-center gap-2"
              >
                {isPlayingPreview ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Jeda Putar</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Dengarkan Rekaman</span>
                  </>
                )}
              </button>

              {recordedBlob ? (
                <button
                  onClick={handleSave}
                  className="py-3 px-4 rounded-2xl bg-success hover:opacity-90 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Suara Ini</span>
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  className="py-3 px-4 rounded-2xl bg-brand-rose hover:opacity-90 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  <span>Rekam Ulang</span>
                </button>
              )}
            </div>
          )}

          {recordedAudioUrl && !isRecording && (
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-error hover:bg-error/10 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Rekaman Halaman Ini</span>
              </button>

              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl text-xs font-extrabold text-secondary hover:bg-black/10  transition-colors"
              >
                Tutup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
