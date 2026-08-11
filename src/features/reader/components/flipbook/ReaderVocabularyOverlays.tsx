import type { Story, VocabularyQuiz } from '@/types';
import type { VocabDefinition } from '@/data/vocabulary';
import type { GlossaryItem } from '@/types';
import { VocabTooltipModal } from '@/components/VocabTooltipModal';
import { VocabularyQuizModal } from '@/components/VocabularyQuizModal';

interface ReaderVocabularyOverlaysProps {
  story: Story;
  selectedVocab: VocabDefinition | null;
  selectedGlossary: GlossaryItem | null;
  isVocabularyQuizOpen: boolean;
  fallbackVocabularyQuiz: VocabularyQuiz;
  isNight: boolean;
  onCloseVocab: () => void;
  onCloseGlossary: () => void;
  onCloseVocabularyQuiz: () => void;
}

export function ReaderVocabularyOverlays({
  story,
  selectedVocab,
  selectedGlossary,
  isVocabularyQuizOpen,
  fallbackVocabularyQuiz,
  isNight,
  onCloseVocab,
  onCloseGlossary,
  onCloseVocabularyQuiz,
}: ReaderVocabularyOverlaysProps) {
  return (
    <>
      {selectedVocab && (
        <VocabTooltipModal vocab={selectedVocab} onClose={onCloseVocab} isNight={isNight} />
      )}
      {selectedGlossary && (
        <VocabTooltipModal glossaryItem={selectedGlossary} onClose={onCloseGlossary} isNight={isNight} />
      )}
      {isVocabularyQuizOpen && (story.vocabularyQuiz || story.glossary) && (
        <VocabularyQuizModal
          quiz={story.vocabularyQuiz || fallbackVocabularyQuiz}
          onClose={onCloseVocabularyQuiz}
          isNight={isNight}
        />
      )}
    </>
  );
}
