import type { CSSProperties } from 'react';
import type { ReadingSettings, StoryPage } from '@/types';

export const READER_FONT_CLASSES: Record<ReadingSettings['fontSize'], string> = {
  sm: 'text-base sm:text-[1.05rem] lg:text-[1.05rem] leading-[1.7]',
  base: 'text-lg sm:text-[1.125rem] lg:text-lg leading-[1.72]',
  lg: 'text-xl sm:text-[1.35rem] lg:text-[1.3rem] leading-[1.68]',
  xl: 'text-2xl sm:text-[1.5rem] lg:text-2xl leading-[1.64]',
};

export function getDisplayedPageTitle(
  page: StoryPage,
  languageMode: ReadingSettings['languageMode'],
): string {
  const title = page.title?.trim() || '';
  const englishTitle = page.titleEn?.trim() || '';
  if (languageMode === 'en') return englishTitle || title;
  if (languageMode === 'dual' && englishTitle) return title ? `${title} / ${englishTitle}` : englishTitle;
  return title;
}

export function getPageNarration(
  page: StoryPage,
  languageMode: ReadingSettings['languageMode'],
) {
  const useEnglish = languageMode === 'en';
  const title = useEnglish ? page.titleEn?.trim() : page.title?.trim();
  const text = useEnglish ? page.textEn?.trim() || '' : page.text;

  return {
    text: [title, text].filter(Boolean).join('. '),
    language: useEnglish ? 'en-US' as const : 'id-ID' as const,
    allowCustomRecording: !useEnglish,
  };
}

export function getReaderPaperStyle(isNight: boolean): CSSProperties {
  if (isNight) {
    return { background: 'radial-gradient(circle at 20% 10%, #202b3d 0, #121a28 58%, #0d1420 100%)' };
  }
  return {
    backgroundColor: '#fffdf8',
    backgroundImage:
      'radial-gradient(circle at 20% 15%, rgba(130,102,68,0.055) 0 0.7px, transparent 0.9px), radial-gradient(circle at 70% 65%, rgba(130,102,68,0.04) 0 0.6px, transparent 0.8px)',
    backgroundSize: '13px 13px, 17px 17px',
  };
}
