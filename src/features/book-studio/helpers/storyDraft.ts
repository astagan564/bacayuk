import type { Story, StoryPage, StoryVisualPreset } from '@/types';
import type { PageDraft, QuickCreateForm } from '../types';

export const createBlankPage = (pageNumber: number): StoryPage => ({
  pageNumber,
  title: `Halaman ${pageNumber}`,
  titleEn: '',
  text: '',
  textEn: '',
  illustrationType: 'forest',
  colors: {
    bgGradFrom: 'from-brand-green',
    bgGradTo: 'to-warning',
    textBg: 'bg-card/80',
    accentColor: 'emerald',
    borderAccent: 'border-brand-green',
  },
});

export const createStoryId = (title: string): string => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 42);
  return `${slug || 'buku-baru'}-${Date.now()}`;
};

export const targetAgeLabel = (targetAge: QuickCreateForm['targetAge']): string => `${targetAge} Tahun`;

export const resolvedVisualPreset = (form: QuickCreateForm): StoryVisualPreset => {
  if (form.visualPreset !== 'auto') return form.visualPreset;
  if (form.targetAge === '3-5') return 'soft-2d-cartoon';
  if (form.targetAge === '9-12') return 'stylized-adventure-cartoon';
  return 'colorful-storybook';
};

export const visualPresetLabel = (preset: StoryVisualPreset): string => ({
  'soft-2d-cartoon': 'Soft 2D cartoon',
  'colorful-storybook': 'Colorful storybook',
  'stylized-adventure-cartoon': 'Stylized adventure',
})[preset];

export const sentenceCaseTitle = (sentence: string, fallback: string): string => {
  const cleaned = sentence
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/[*_`>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return fallback;
  const words = cleaned.split(' ').slice(0, 5).join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1).replace(/[.!?,;:]$/, '');
};

export const splitTextIntoSentences = (text: string): string[] => {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .flatMap((line) => {
      const trimmed = line.trim();
      if (/^[-*+]\s+/.test(trimmed) || /^\d+[.)]\s+/.test(trimmed) || /^>\s+/.test(trimmed)) {
        return [trimmed];
      }
      return trimmed.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [trimmed];
    })
    .map((sentence) => sentence.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean);
};

export const chunkSentences = (sentences: string[], targetPageCount: number): string[] => {
  const pages: string[] = [];
  const sentencesPerPage = Math.max(1, Math.ceil(sentences.length / targetPageCount));

  for (let i = 0; i < sentences.length; i += sentencesPerPage) {
    pages.push(sentences.slice(i, i + sentencesPerPage).join(' '));
  }

  return pages;
};

export const splitManuscriptIntoPageDrafts = (manuscript: string): PageDraft[] => {
  const markdownSections: PageDraft[] = [];
  let currentTitle = '';
  let currentLines: string[] = [];

  manuscript.split(/\r?\n/).forEach((line) => {
    const headingMatch = line.match(/^\s{0,3}#{1,3}\s+(.+?)\s*#*\s*$/);
    if (headingMatch) {
      if (currentTitle || currentLines.some((item) => item.trim())) {
        const text = currentLines.join('\n').trim();
        if (text) {
          markdownSections.push({
            title: currentTitle || sentenceCaseTitle(text, `Halaman ${markdownSections.length + 1}`),
            text,
          });
        }
      }
      currentTitle = headingMatch[1].trim();
      currentLines = [];
      return;
    }

    currentLines.push(line);
  });

  if (currentTitle || currentLines.some((item) => item.trim())) {
    const text = currentLines.join('\n').trim();
    if (text) {
      markdownSections.push({
        title: currentTitle || sentenceCaseTitle(text, `Halaman ${markdownSections.length + 1}`),
        text,
      });
    }
  }

  if (markdownSections.length > 0) {
    const totalSentences = markdownSections.reduce((sum, section) => {
      return sum + splitTextIntoSentences(section.text).length;
    }, 0);
    const targetPageCount = Math.min(12, Math.max(8, Math.ceil(totalSentences / 2)));
    const averageSentencesPerPage = Math.max(1, Math.ceil(totalSentences / targetPageCount));

    const pageDrafts = markdownSections.flatMap((section) => {
      const sectionSentences = splitTextIntoSentences(section.text);
      const sectionPageCount = Math.max(1, Math.ceil(sectionSentences.length / averageSentencesPerPage));
      return chunkSentences(sectionSentences, sectionPageCount).map((text, index) => ({
        title: index === 0 ? section.title : `${section.title} ${index + 1}`,
        text,
      }));
    });

    return pageDrafts.slice(0, 12);
  }

  const paragraphs = manuscript
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const cleanSentences = paragraphs.length > 1
    ? paragraphs.flatMap(splitTextIntoSentences)
    : splitTextIntoSentences(manuscript);
  const targetPageCount = Math.min(12, Math.max(8, Math.ceil(cleanSentences.length / 2)));
  const pages = chunkSentences(cleanSentences, targetPageCount);

  return pages.slice(0, 12).map((text, index) => ({
    title: sentenceCaseTitle(text, `Halaman ${index + 1}`),
    text,
  }));
};

export const inferIllustrationType = (text: string): StoryPage['illustrationType'] => {
  const lower = text.toLowerCase();
  if (/laut|pantai|ombak|ikan|perahu|sungai|danau|hujan/.test(lower)) return 'sea';
  if (/bintang|bulan|langit|planet|roket|angkasa|awan/.test(lower)) return 'space';
  if (/naga|ajaib|sihir|peri|cahaya|kristal/.test(lower)) return 'dragon';
  if (/istana|raja|ratu|putri|pangeran|menara/.test(lower)) return 'castle';
  if (/kebun|bunga|taman|kupu|lebah/.test(lower)) return 'garden';
  return 'forest';
};

export const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const includesGlossaryTerm = (text: string, values: string[]) =>
  values
    .map((value) => value.trim())
    .filter(Boolean)
    .some((value) => new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(value)}([^\\p{L}\\p{N}]|$)`, 'iu').test(text));

export const extractGlossaryCandidates = (manuscript: string) => {
  const terms = [
    { id: 'forest', wordEn: 'Forest', translationId: 'Hutan', phonetic: 'for-est', emoji: '🌲', aliases: ['hutan'] },
    { id: 'river', wordEn: 'River', translationId: 'Sungai', phonetic: 'ri-ver', emoji: '💧', aliases: ['sungai'] },
    { id: 'friend', wordEn: 'Friend', translationId: 'Sahabat', phonetic: 'frend', emoji: '🤝', aliases: ['sahabat', 'teman'] },
    { id: 'rabbit', wordEn: 'Rabbit', translationId: 'Kelinci', phonetic: 'rab-bit', emoji: '🐰', aliases: ['kelinci'] },
    { id: 'butterfly', wordEn: 'Butterfly', translationId: 'Kupu-kupu', phonetic: 'but-ter-fly', emoji: '🦋', aliases: ['kupu-kupu', 'kupu'] },
    { id: 'star', wordEn: 'Star', translationId: 'Bintang', phonetic: 'star', emoji: '⭐', aliases: ['bintang'] },
    { id: 'tree', wordEn: 'Tree', translationId: 'Pohon', phonetic: 'tree', emoji: '🌳', aliases: ['pohon'] },
    { id: 'flower', wordEn: 'Flower', translationId: 'Bunga', phonetic: 'flow-er', emoji: '🌼', aliases: ['bunga'] },
    { id: 'dragon', wordEn: 'Dragon', translationId: 'Naga', phonetic: 'dra-gon', emoji: '🐉', aliases: ['naga'] },
    { id: 'castle', wordEn: 'Castle', translationId: 'Istana', phonetic: 'cas-tle', emoji: '🏰', aliases: ['istana'] },
    { id: 'sea', wordEn: 'Sea', translationId: 'Laut', phonetic: 'see', emoji: '🌊', aliases: ['laut'] },
    { id: 'light', wordEn: 'Light', translationId: 'Cahaya', phonetic: 'light', emoji: '✨', aliases: ['cahaya'] },
  ];

  return terms
    .filter((term) => includesGlossaryTerm(manuscript, term.aliases))
    .slice(0, 12)
    .map(({ aliases, ...term }) => term);
};

export const inferPipelineStatus = (story: Story): NonNullable<Story['pipelineStatus']> => {
  const hasStory = story.pages.length > 0 && story.pages.every((page) => page.text.trim());
  const hasIllustrations = hasCompleteStoryImages(story);

  if (story.status === 'published') return 'ready_to_publish';
  if (hasIllustrations) {
    if (story.pipelineStatus === 'ready_to_publish') return 'ready_to_publish';
    if (story.pipelineStatus === 'enhanced') return 'enhanced';
    return 'illustrated';
  }
  if (hasStory) return 'story_complete';
  return 'draft';
};

export const isPlaceholderCover = (coverImage: string): boolean =>
  !coverImage.trim()
  || coverImage.includes('images.unsplash.com/photo-1512820790803-83ca734da794')
  || coverImage.endsWith('/story-cover-placeholder.svg');

export const hasCompleteStoryImages = (story: Story): boolean =>
  !isPlaceholderCover(story.coverImage)
  && story.pages.length > 0
  && story.pages.every((page) => Boolean(page.imageUrl?.trim()));


