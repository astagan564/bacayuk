import { GlossaryItem, VocabularyQuiz } from '../types';

const DEFAULT_VOCABULARY_DISTRACTORS = [
  'Kelinci',
  'Hutan',
  'Sahabat',
  'Bintang',
  'Pohon',
  'Bunga',
];

const stableRotate = <T,>(items: T[], seed: number): T[] => {
  if (items.length === 0) return items;
  const offset = seed % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
};

const buildStableOptions = (correctAnswer: string, seed: number): string[] => {
  const distractors = DEFAULT_VOCABULARY_DISTRACTORS.filter((option) => option !== correctAnswer);
  const options = [correctAnswer, ...distractors].slice(0, 4);
  return stableRotate(options, seed);
};

export const createFallbackVocabularyQuiz = (
  storyTitle: string,
  glossary: GlossaryItem[] = []
): VocabularyQuiz => ({
  title: `Kuis Kosakata: ${storyTitle}`,
  description: 'Latihan kosakata dari glosarium cerita.',
  questions: glossary.map((item, questionIndex) => ({
    wordEn: item.wordEn,
    correctTranslationId: item.translationId,
    optionsId: buildStableOptions(item.translationId, questionIndex),
    phonetic: item.phonetic,
    emoji: item.emoji,
  })),
});
