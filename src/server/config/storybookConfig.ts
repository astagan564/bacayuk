import type { InteractiveElement, StoryPage, StoryVisualPreset } from '../../types';

export const DEFAULT_EBOOK_PRICE = 15_000;
export const VIP_SUBSCRIPTION_PRICE = 100_000;

export const STORYBOOK_ILLUSTRATION_TYPES: StoryPage['illustrationType'][] = [
  'forest',
  'dragon',
  'space',
  'sea',
  'castle',
  'garden',
  'custom',
];

export const STORYBOOK_ANIMATIONS: InteractiveElement['animation'][] = [
  'hop',
  'spin',
  'bounce',
  'glow',
  'pulse',
  'float',
];

export const STORYBOOK_SOUNDS: NonNullable<InteractiveElement['soundType']>[] = [
  'pop',
  'chime',
  'giggle',
  'magic',
  'sparkle',
  'roar',
  'splash',
];

export const STORYBOOK_VISUAL_PRESETS: StoryVisualPreset[] = [
  'soft-2d-cartoon',
  'colorful-storybook',
  'stylized-adventure-cartoon',
];

export const GEMINI_TEXT_MODELS = Array.from(
  new Set(
    [
      process.env.GEMINI_MODEL,
      process.env.GEMINI_TEXT_MODEL,
      'gemini-3.6-flash',
      'gemini-3.5-flash-lite',
      'gemini-2.5-flash',
    ].filter((model): model is string => Boolean(model?.trim())),
  ),
);

export const GEMINI_IMAGE_MODELS = Array.from(
  new Set(
    [
      process.env.GEMINI_IMAGE_MODEL,
      'gemini-3.1-flash-image',
      'gemini-3-pro-image-preview',
    ].filter((model): model is string => Boolean(model?.trim())),
  ),
);

export const USD_TO_IDR = Math.max(1, Number(process.env.USD_TO_IDR_RATE) || 18_088);

