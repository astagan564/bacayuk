import type { VocabularyQuiz } from '@/types';

export interface VocabularyQuizModalProps {
  quiz: VocabularyQuiz;
  onClose: () => void;
  isNight?: boolean;
}
