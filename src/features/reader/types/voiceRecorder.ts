export interface VoiceRecorderModalProps {
  storyId: string;
  storyTitle: string;
  pageNumber: number;
  pageText: string;
  onClose: () => void;
  onSaved: () => void;
  isNight?: boolean;
}

export type VoiceRecordingMutation = 'saving' | 'deleting' | null;
