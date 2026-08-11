import { Mic, Sparkles, X } from 'lucide-react';
import { VoiceRecordingControls } from '@/features/reader/components/voice-recorder/VoiceRecordingControls';
import { VoiceRecordingStatus } from '@/features/reader/components/voice-recorder/VoiceRecordingStatus';
import { useVoiceRecorderController } from '@/features/reader/hooks/useVoiceRecorderController';
import type { VoiceRecorderModalProps } from '@/features/reader/types/voiceRecorder';

export function VoiceRecorderModal({
  storyId,
  pageNumber,
  pageText,
  onClose,
  onSaved,
}: VoiceRecorderModalProps) {
  const recorder = useVoiceRecorderController({ storyId, pageNumber, onClose, onSaved });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-overlay)] backdrop-blur-md animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-recorder-title"
        className="reader-modal w-full max-w-lg rounded-[1.35rem] p-6 sm:p-8 relative overflow-hidden flex flex-col gap-5"
      >
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
              <h2 id="voice-recorder-title" className="text-xl sm:text-2xl font-black tracking-tight">
                Rekam Narasi Halaman {pageNumber + 1}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={recorder.activeMutation !== null}
            className="p-2 rounded-full hover:bg-black/10 transition-colors disabled:opacity-50"
            title="Tutup Modal"
            aria-label="Tutup perekam suara"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="reader-soft-panel p-4 rounded-2xl flex flex-col gap-1.5">
          <span className="text-[11px] font-extrabold uppercase text-secondary">
            📖 Naskah Cerita Untuk Dibaca:
          </span>
          <p className="text-xs sm:text-sm text-primary font-medium leading-relaxed italic">
            &quot;{pageText}&quot;
          </p>
        </div>

        <VoiceRecordingStatus
          isRecording={recorder.isRecording}
          recordingSeconds={recorder.recordingSeconds}
          recordedAudioUrl={recorder.recordedAudioUrl}
          hasExistingRecording={recorder.hasExistingRecording}
          hasNewRecording={Boolean(recorder.recordedBlob)}
          micError={recorder.micError}
        />
        <VoiceRecordingControls
          isRecording={recorder.isRecording}
          recordedAudioUrl={recorder.recordedAudioUrl}
          hasNewRecording={Boolean(recorder.recordedBlob)}
          isPlayingPreview={recorder.isPlayingPreview}
          activeMutation={recorder.activeMutation}
          isRequestingMicrophone={recorder.isRequestingMicrophone}
          onStartRecording={recorder.startRecording}
          onStopRecording={recorder.stopRecording}
          onTogglePreview={recorder.togglePreview}
          onSave={recorder.saveRecording}
          onDelete={recorder.deleteRecording}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
