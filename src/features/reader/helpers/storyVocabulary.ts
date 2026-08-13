import {
  VOCABULARY_DICTIONARY,
  type VocabDefinition,
} from '@/data/vocabulary';
import type { GlossaryItem } from '@/types';

export interface StoryVocabularyPart {
  text: string;
  glossaryItem?: GlossaryItem;
  vocabulary?: VocabDefinition;
}

export interface StoryVocabularyMatcher {
  regex: RegExp | null;
  glossaryByWord: ReadonlyMap<string, GlossaryItem>;
}

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function createStoryVocabularyMatcher(glossary: GlossaryItem[]): StoryVocabularyMatcher {
  const glossaryByWord = new Map(
    glossary
      .filter((item) => item.wordEn.trim())
      .map((item) => [item.wordEn.trim().toLowerCase(), item]),
  );
  const keys = Array.from(new Set([
    ...glossaryByWord.keys(),
    ...Object.keys(VOCABULARY_DICTIONARY),
  ])).sort((first, second) => second.length - first.length);

  return {
    glossaryByWord,
    regex: keys.length
      ? new RegExp(
          `(?<![\\p{L}\\p{N}])(${keys.map(escapeRegularExpression).join('|')})(?![\\p{L}\\p{N}])`,
          'giu',
        )
      : null,
  };
}

export function splitStoryVocabulary(
  content: string,
  matcher: StoryVocabularyMatcher,
): StoryVocabularyPart[] {
  if (!matcher.regex) return [{ text: content }];

  return content.split(matcher.regex).filter(Boolean).map((text) => {
    const normalizedText = text.toLowerCase();
    return {
      text,
      glossaryItem: matcher.glossaryByWord.get(normalizedText),
      vocabulary: VOCABULARY_DICTIONARY[normalizedText],
    };
  });
}
