import type { VocabularyQuizModalProps } from '@/features/reader/types/vocabularyQuiz';
import { useVocabularyQuizController } from '@/features/reader/hooks/useVocabularyQuizController';
import { VocabularyQuizEmptyState } from '@/features/reader/components/vocabulary-quiz/VocabularyQuizEmptyState';
import { VocabularyQuizHeader } from '@/features/reader/components/vocabulary-quiz/VocabularyQuizHeader';
import { VocabularyQuizQuestionView } from '@/features/reader/components/vocabulary-quiz/VocabularyQuizQuestionView';
import { VocabularyQuizResults } from '@/features/reader/components/vocabulary-quiz/VocabularyQuizResults';

export function VocabularyQuizModal({ quiz, onClose }: VocabularyQuizModalProps) {
  const controller = useVocabularyQuizController({ quiz, onClose });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] p-4 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vocabulary-quiz-title"
        className="app-modal relative flex w-full max-w-lg flex-col overflow-hidden rounded-[1.35rem]"
      >
        <VocabularyQuizHeader title={quiz.title} onClose={controller.handleClose} />
        {controller.question ? (
          controller.isFinished ? (
            <VocabularyQuizResults
              score={controller.score}
              totalQuestions={controller.totalQuestions}
              onRestart={controller.handleRestart}
              onClose={controller.handleClose}
            />
          ) : (
            <VocabularyQuizQuestionView
              question={controller.question}
              questionIndex={controller.currentQuestionIndex}
              totalQuestions={controller.totalQuestions}
              score={controller.score}
              displayedOptions={controller.displayedOptions}
              selectedOption={controller.selectedOption}
              isAnswered={controller.isAnswered}
              onSelectOption={controller.handleOptionClick}
              onNextQuestion={controller.handleNextQuestion}
              onSpeakWord={controller.handleSpeakWord}
            />
          )
        ) : (
          <VocabularyQuizEmptyState onClose={controller.handleClose} />
        )}
      </div>
    </div>
  );
}
