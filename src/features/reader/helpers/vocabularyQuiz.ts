import type { VocabularyQuiz } from '@/types';
import { arrangeQuizOptions } from '@/utils/quizOptions';

export function createQuizOptionOrders(quiz: VocabularyQuiz): string[][] {
  const maximumOptionCount = Math.max(
    1,
    ...quiz.questions.map((question) => question.optionsId.length),
  );
  const startingPosition = maximumOptionCount > 1
    ? 1 + Math.floor(Math.random() * (maximumOptionCount - 1))
    : 0;

  return quiz.questions.map((question, questionIndex) => arrangeQuizOptions(
    question.optionsId,
    question.correctTranslationId,
    startingPosition + questionIndex,
  ));
}
