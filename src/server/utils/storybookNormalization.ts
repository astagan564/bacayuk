import type {
  GlossaryItem,
  InteractiveElement,
  QuizQuestion,
  Story,
  StoryCharacterBibleEntry,
  StoryPage,
  StoryProductionGuide,
  StoryVisualPreset,
  VocabularyQuiz,
  VocabularyQuizQuestion,
} from '../../types';
import {
  STORYBOOK_ANIMATIONS,
  STORYBOOK_ILLUSTRATION_TYPES,
  STORYBOOK_SOUNDS,
  STORYBOOK_VISUAL_PRESETS,
} from '../config/storybookConfig';

export function normalizeStory(story: Story): Story {
  return {
    ...story,
    status: story.status || 'published',
    pages: story.pages.map((page, index) => ({
      ...page,
      pageNumber: index + 1,
    })),
  };
}

export function createStorageSlug(value: string, fallback = 'story') {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || fallback;
}

export function imageExtensionFromMimeType(mimeType: string) {
  if (mimeType.includes('webp')) return 'webp';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
  return 'png';
}

export function cleanAiText(value: unknown, maxLength: number, fallback = '') {
  if (typeof value !== 'string') return fallback;

  return value
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);
}

export function cleanOneLine(value: unknown, maxLength: number, fallback = '') {
  return cleanAiText(value, maxLength, fallback).replace(/\s+/g, ' ').trim();
}

export function removeLiteralPhrases(value: string, phrases: string[], fallback: string) {
  const cleaned = phrases.reduce((result, phrase) => {
    const literal = phrase.trim();
    return literal ? result.split(literal).join(' ') : result;
  }, value);

  return cleanAiText(cleaned.replace(/^[\s:;,.\-–—]+/, ''), 700) || fallback;
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function clampPercent(value: unknown, fallback: number) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.min(100, Math.max(0, Math.round(numberValue)));
}

export function normalizeIllustrationType(value: unknown, text = ''): StoryPage['illustrationType'] {
  if (typeof value === 'string' && STORYBOOK_ILLUSTRATION_TYPES.includes(value as StoryPage['illustrationType'])) {
    return value as StoryPage['illustrationType'];
  }

  const lower = text.toLowerCase();
  if (/laut|pantai|ombak|ikan|perahu|sungai|danau|hujan|sea|river|lake|boat/.test(lower)) return 'sea';
  if (/bintang|bulan|langit|planet|roket|angkasa|awan|space|star|moon|rocket/.test(lower)) return 'space';
  if (/naga|ajaib|sihir|peri|cahaya|kristal|magic|dragon|crystal/.test(lower)) return 'dragon';
  if (/istana|raja|ratu|putri|pangeran|menara|castle|kingdom|palace/.test(lower)) return 'castle';
  if (/kebun|bunga|taman|kupu|lebah|garden|flower|butterfly/.test(lower)) return 'garden';
  return 'forest';
}

export function normalizeQuizQuestion(value: unknown, desiredAnswerIndex?: number): QuizQuestion | undefined {
  const raw = asRecord(value);
  const question = cleanOneLine(raw.question, 180);
  const options = Array.isArray(raw.options)
    ? raw.options.map((option) => cleanOneLine(option, 80)).filter(Boolean).slice(0, 4)
    : [];

  if (!question || options.length < 2) return undefined;

  let answerIndex = Math.min(options.length - 1, Math.max(0, Number(raw.answerIndex) || 0));
  if (desiredAnswerIndex !== undefined && options.length > 1) {
    const targetIndex = Math.min(options.length - 1, Math.max(0, desiredAnswerIndex));
    const [correctAnswer] = options.splice(answerIndex, 1);
    options.splice(targetIndex, 0, correctAnswer);
    answerIndex = targetIndex;
  }

  return {
    question,
    options,
    answerIndex,
    explanation: cleanOneLine(raw.explanation, 220, 'Jawaban ini paling sesuai dengan isi cerita.'),
  };
}

export function normalizeInteractiveElements(value: unknown, pageNumber: number): InteractiveElement[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index): InteractiveElement | null => {
      const raw = asRecord(item);
      const label = cleanOneLine(raw.label, 60, 'Interaksi');
      if (!label) return null;

      const animation = STORYBOOK_ANIMATIONS.includes(raw.animation as InteractiveElement['animation'])
        ? raw.animation as InteractiveElement['animation']
        : 'bounce';
      const soundType = STORYBOOK_SOUNDS.includes(raw.soundType as NonNullable<InteractiveElement['soundType']>)
        ? raw.soundType as NonNullable<InteractiveElement['soundType']>
        : 'pop';

      return {
        id: cleanOneLine(raw.id, 40, `ai_${pageNumber}_${index + 1}`),
        type: ['animal', 'star', 'item', 'sound', 'character'].includes(raw.type as string)
          ? raw.type as InteractiveElement['type']
          : 'item',
        label,
        x: clampPercent(raw.x, 50),
        y: clampPercent(raw.y, 55),
        animation,
        soundType,
        dialogue: cleanOneLine(raw.dialogue, 120),
        emoji: cleanOneLine(raw.emoji, 12, '✨'),
      };
    })
    .filter((item): item is InteractiveElement => Boolean(item))
    .slice(0, 2);
}

export function normalizeStringList(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanOneLine(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

export function normalizeProductionGuide(value: unknown, fallbackPreset: StoryVisualPreset): StoryProductionGuide {
  const raw = asRecord(value);
  const visualPreset = STORYBOOK_VISUAL_PRESETS.includes(raw.visualPreset as StoryVisualPreset)
    ? raw.visualPreset as StoryVisualPreset
    : fallbackPreset;
  const characterBible = Array.isArray(raw.characterBible)
    ? raw.characterBible
        .map((item, index): StoryCharacterBibleEntry | null => {
          const character = asRecord(item);
          const name = cleanOneLine(character.name, 60);
          if (!name) return null;

          return {
            id: cleanOneLine(character.id, 50, `character-${index + 1}`),
            name,
            role: ['main', 'supporting', 'background'].includes(character.role as string)
              ? character.role as StoryCharacterBibleEntry['role']
              : index === 0 ? 'main' : 'supporting',
            speciesOrIdentity: cleanOneLine(character.speciesOrIdentity, 120, 'Child-friendly story character'),
            ageAppearance: cleanOneLine(character.ageAppearance, 80, 'Matches the target reader age'),
            bodyAndFace: cleanOneLine(character.bodyAndFace, 220),
            skinFurOrHair: cleanOneLine(character.skinFurOrHair, 180),
            outfit: cleanOneLine(character.outfit, 180),
            accessories: normalizeStringList(character.accessories, 8, 100),
            signatureColors: normalizeStringList(character.signatureColors, 8, 30),
            personality: normalizeStringList(character.personality, 8, 60),
            expressionGuide: normalizeStringList(character.expressionGuide, 8, 160),
            immutableTraits: normalizeStringList(character.immutableTraits, 10, 160),
          };
        })
        .filter((character): character is StoryCharacterBibleEntry => Boolean(character))
        .slice(0, 8)
    : [];

  return {
    visualPreset,
    aspectRatio: ['3:4', '4:3', '1:1', '16:9'].includes(raw.aspectRatio as string)
      ? raw.aspectRatio as StoryProductionGuide['aspectRatio']
      : '3:4',
    characterBible,
    palette: normalizeStringList(raw.palette, 10, 30),
    coverPrompt: cleanAiText(raw.coverPrompt, 700),
    continuityRules: normalizeStringList(raw.continuityRules, 12, 180),
    negativePrompt: [
      cleanAiText(raw.negativePrompt, 420),
      'photorealistic, horror, violence, typography, letters, numbers, words, sentences, captions, speech bubbles, text panels, signs, watermark, logo, extra limbs, duplicate character, changed outfit, changed colors',
    ].filter(Boolean).join(', ').slice(0, 700),
  };
}

export function normalizeGlossary(value: unknown): GlossaryItem[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  return value
    .map((item, index): GlossaryItem | null => {
      const raw = asRecord(item);
      const wordEn = cleanOneLine(raw.wordEn, 50);
      const translationId = cleanOneLine(raw.translationId, 70);
      if (!wordEn || !translationId) return null;

      const key = wordEn.toLowerCase();
      if (seen.has(key)) return null;
      seen.add(key);

      return {
        id: cleanOneLine(raw.id, 40, `ai-glossary-${index + 1}`),
        wordEn,
        translationId,
        phonetic: cleanOneLine(raw.phonetic, 60),
        emoji: cleanOneLine(raw.emoji, 12, '📖'),
        exampleEn: cleanOneLine(raw.exampleEn, 140),
        exampleId: cleanOneLine(raw.exampleId, 140),
      };
    })
    .filter((item): item is GlossaryItem => Boolean(item))
    .slice(0, 12);
}

export function normalizeVocabularyQuiz(value: unknown): VocabularyQuiz | undefined {
  const raw = asRecord(value);
  const questions = Array.isArray(raw.questions)
    ? raw.questions
        .map((item, questionIndex): VocabularyQuizQuestion | null => {
          const question = asRecord(item);
          const wordEn = cleanOneLine(question.wordEn, 50);
          const correctTranslationId = cleanOneLine(question.correctTranslationId, 70);
          const optionsId = Array.isArray(question.optionsId)
            ? question.optionsId.map((option) => cleanOneLine(option, 70)).filter(Boolean).slice(0, 4)
            : [];

          if (!wordEn || !correctTranslationId || optionsId.length < 2) return null;

          const distractors = Array.from(new Set(optionsId.filter((option) => option !== correctTranslationId))).slice(0, 3);
          const options = [...distractors];
          const answerPosition = (questionIndex + 1) % (options.length + 1);
          options.splice(answerPosition, 0, correctTranslationId);

          return {
            wordEn,
            correctTranslationId,
            optionsId: options,
            emoji: cleanOneLine(question.emoji, 12),
            phonetic: cleanOneLine(question.phonetic, 60),
          };
        })
        .filter((item): item is VocabularyQuiz['questions'][number] => Boolean(item))
        .slice(0, 6)
    : [];

  if (questions.length === 0) return undefined;

  return {
    title: cleanOneLine(raw.title, 100, 'Kuis Kosakata'),
    description: cleanOneLine(raw.description, 160, 'Latihan kosakata dari cerita.'),
    questions,
  };
}

