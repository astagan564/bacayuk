import type { ReadingSettings, Story } from '@/types';

export interface FlipbookProps {
  story: Story;
  currentPageIndex: number;
  onPageChange: (newIndex: number) => void;
  settings: ReadingSettings;
  onCompleteBook?: () => void;
}

export interface FlipbookHandle {
  readCurrentPage: () => void;
  openVocabularyQuiz: () => void;
}
