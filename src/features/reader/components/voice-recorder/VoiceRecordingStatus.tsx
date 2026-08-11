import { AlertCircle, CheckCircle2, Mic } from 'lucide-react';
import { formatRecordingDuration } from '@/features/reader/helpers/recordingDuration';

interface VoiceRecordingStatusProps {
  isRecording: boolean;
  recordingSeconds: number;
  recordedAudioUrl: string | null;
  hasExistingRecording: boolean;
  hasNewRecording: boolean;
  micError: string | null;
}

export function VoiceRecordingStatus({
  isRecording,
  recordingSeconds,
  recordedAudioUrl,
  hasExistingRecording,
  hasNewRecording,
  micError,
}: VoiceRecordingStatusProps) {
  return (
    <>
      {micError && (
        <div className="p-3 rounded-xl bg-error/10 border border-error/30 text-error text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{micError}</span>
        </div>
      )}

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
              {formatRecordingDuration(recordingSeconds)}
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
              {hasExistingRecording && !hasNewRecording
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
    </>
  );
}
