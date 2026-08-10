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

const shuffleItems = <T,>(items: T[]): T[] => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
};

export const arrangeQuizOptions = (
  items: string[],
  correctAnswer: string,
  answerPosition: number
): string[] => {
  const distractors = shuffleItems(Array.from(new Set(items.filter((item) => item !== correctAnswer))));
  const options = [...distractors];
  const targetIndex = options.length > 0 ? answerPosition % (options.length + 1) : 0;
  options.splice(targetIndex, 0, correctAnswer);
  return options;
};

const buildStableOptions = (correctAnswer: string, seed: number): string[] => {
  const distractors = DEFAULT_VOCABULARY_DISTRACTORS.filter((option) => option !== correctAnswer);
  const options = [correctAnswer, ...distractors].slice(0, 4);
  return stableRotate(options, seed + 1);
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
