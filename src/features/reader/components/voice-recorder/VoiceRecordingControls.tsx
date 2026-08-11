import { CheckCircle2, Mic, Pause, Play, Square, Trash2 } from 'lucide-react';
import type { VoiceRecordingMutation } from '@/features/reader/types/voiceRecorder';

interface VoiceRecordingControlsProps {
  isRecording: boolean;
  recordedAudioUrl: string | null;
  hasNewRecording: boolean;
  isPlayingPreview: boolean;
  activeMutation: VoiceRecordingMutation;
  isRequestingMicrophone: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onTogglePreview: () => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function VoiceRecordingControls({
  isRecording,
  recordedAudioUrl,
  hasNewRecording,
  isPlayingPreview,
  activeMutation,
  isRequestingMicrophone,
  onStartRecording,
  onStopRecording,
  onTogglePreview,
  onSave,
  onDelete,
  onClose,
}: VoiceRecordingControlsProps) {
  const isMutating = activeMutation !== null;

  return (
    <div className="flex flex-col gap-2.5">
      {!isRecording && !recordedAudioUrl && (
        <button
          type="button"
          onClick={onStartRecording}
          disabled={isMutating || isRequestingMicrophone}
          className="w-full py-4 px-6 rounded-2xl bg-brand-rose hover:opacity-90 text-white font-black text-sm shadow-xl transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Mic className="w-5 h-5 animate-bounce" />
          <span>{isRequestingMicrophone ? 'Membuka Mikrofon...' : 'Mulai Merekam Suara'}</span>
        </button>
      )}

      {isRecording && (
        <button
          type="button"
          onClick={onStopRecording}
          className="w-full py-4 px-6 rounded-2xl bg-error hover:opacity-90 text-white font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2"
        >
          <Square className="w-5 h-5 fill-white" />
          <span>Selesai Merekam</span>
        </button>
      )}

      {!isRecording && recordedAudioUrl && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onTogglePreview}
            disabled={isMutating}
            className="btn-secondary py-3 px-4 text-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isPlayingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlayingPreview ? 'Jeda Putar' : 'Dengarkan Rekaman'}</span>
          </button>

          {hasNewRecording ? (
            <button
              type="button"
              onClick={onSave}
              disabled={isMutating || isRequestingMicrophone}
              className="py-3 px-4 rounded-2xl bg-success hover:opacity-90 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{activeMutation === 'saving' ? 'Menyimpan...' : 'Simpan Suara Ini'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartRecording}
              disabled={isMutating}
              className="py-3 px-4 rounded-2xl bg-brand-rose hover:opacity-90 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Mic className="w-4 h-4" />
              <span>{isRequestingMicrophone ? 'Membuka Mikrofon...' : 'Rekam Ulang'}</span>
            </button>
          )}
        </div>
      )}

      {recordedAudioUrl && !isRecording && (
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={onDelete}
            disabled={isMutating}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-error hover:bg-error/10 transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{activeMutation === 'deleting' ? 'Menghapus...' : 'Hapus Rekaman Halaman Ini'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isMutating}
            className="px-4 py-1.5 rounded-xl text-xs font-extrabold text-secondary hover:bg-black/10 transition-colors disabled:opacity-50"
          >
            Tutup
          </button>
        </div>
      )}
    </div>
  );
}
