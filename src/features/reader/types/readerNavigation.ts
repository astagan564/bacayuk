import type { ReadingSettings } from '@/types';

export interface ReaderNavigationControlsProps {
  title: string;
  currentPageIndex: number;
  totalPages: number;
  onPageChange: (newIndex: number) => void;
  settings: ReadingSettings;
  onUpdateSettings: (newSettings: Partial<ReadingSettings>) => void;
  onToggleThumbnails: () => void;
  onBackToLibrary: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  onOpenVoiceRecorder?: () => void;
  onOpenOfflineDownload?: () => void;
  onReadPage?: () => void;
  onOpenQuiz?: () => void;
  isBackCover?: boolean;
}
