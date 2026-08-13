import type { InteractiveElement, Story, StoryPage } from '@/types';
import type { AiBookDraft, AiBookDraftPage, QuickCreateForm } from '@/features/book-studio/types';
import {
  createBlankPage,
  createStoryId,
  extractGlossaryCandidates,
  includesGlossaryTerm,
  inferIllustrationType,
  sentenceCaseTitle,
  splitManuscriptIntoPageDrafts,
  targetAgeLabel,
} from '@/features/book-studio/helpers/storyDraft';

const DRAFT_COVER_PLACEHOLDER = '/story-cover-placeholder.svg';

export const cloneStoryForEditing = (story: Story): Story => ({
  ...story,
  pages: story.pages.map((page) => ({
    ...page,
    interactiveElements: page.interactiveElements?.map((element) => ({ ...element })),
    quizQuestion: page.quizQuestion ? {
      ...page.quizQuestion,
      options: [...page.quizQuestion.options],
    } : undefined,
  })),
  glossary: story.glossary?.map((item) => ({ ...item })),
});

export const buildManualStoryDraft = (defaultEbookPrice: number): Story => ({
  id: `story_${Date.now()}`,
  title: 'Buku Cerita Baru',
  author: 'Penulis Cilik',
  category: 'Petualangan',
  coverImage: DRAFT_COVER_PLACEHOLDER,
  coverBg: 'from-warning to-warning',
  themeColor: 'amber',
  accentColor: 'orange',
  moralMessage: 'Belajar dan bersabar membawa keberhasilan!',
  targetAge: '6-8 Tahun',
  description: 'Kisah seru yang penuh pesan kebaikan untuk anak.',
  status: 'draft',
  pipelineStatus: 'draft',
  accessStatus: 'free_member',
  downloadEnabled: true,
  ebookPrice: defaultEbookPrice,
  watermarkEnabled: true,
  pages: [{
    pageNumber: 1,
    text: 'Di sebuah desa yang indah, hiduplah seekor anak hewan yang rajin...',
    illustrationType: 'forest',
    colors: {
      bgGradFrom: 'from-brand-green',
      bgGradTo: 'to-warning',
      textBg: 'bg-card/80',
      accentColor: 'emerald',
      borderAccent: 'border-brand-green',
    },
  }],
});

export const buildDraftStoryFromQuickCreate = (form: QuickCreateForm, defaultEbookPrice: number): Story => {
  const pageDrafts = splitManuscriptIntoPageDrafts(form.brief);
  const fallbackTitle = form.title.trim() || sentenceCaseTitle(form.brief, 'Buku Cerita Baru');
  const pages: StoryPage[] = pageDrafts.map((draft, index) => {
    const basePage = createBlankPage(index + 1);
    const illustrationType = inferIllustrationType(`${draft.title} ${draft.text}`);
    const generatedElements: InteractiveElement[] = index === 0
      ? [{
          id: `elem_${Date.now()}_${index}`,
          type: 'character',
          label: 'Tokoh utama',
          x: 50,
          y: 62,
          animation: 'bounce',
          soundType: 'chime',
          dialogue: 'Halo, ayo baca halaman ini.',
          emoji: '✨',
        }]
      : [];

    return {
      ...basePage,
      title: draft.title,
      titleEn: '',
      text: draft.text,
      textEn: '',
      illustrationType,
      illustrationPrompt: `A clear ${illustrationType} story scene with one focal action and expressive child-friendly characters.`,
      interactiveElements: generatedElements,
      quizQuestion: index === pageDrafts.length - 1
        ? {
            question: 'Apa pesan baik dari cerita ini?',
            options: ['Meminta orang lain mengerjakannya', 'Berani mencoba dengan cara yang baik', 'Berhenti saat belum berhasil', 'Mengabaikan pelajaran dari perjalanan'],
            answerIndex: 1,
            explanation: 'Cerita ini mengajak anak mencoba hal baik dengan berani dan lembut.',
          }
        : undefined,
    };
  });

  return {
    id: form.storyId || createStoryId(fallbackTitle),
    title: fallbackTitle,
    author: 'BacaYuk Studio',
    category: 'Petualangan',
    coverImage: DRAFT_COVER_PLACEHOLDER,
    coverBg: 'from-warning to-warning',
    themeColor: 'amber',
    accentColor: 'orange',
    moralMessage: form.moralMessage.trim() || 'Setiap perjalanan menjadi lebih indah saat dijalani dengan berani dan hati baik.',
    targetAge: targetAgeLabel(form.targetAge),
    description: pages[0]?.text.slice(0, 150) || 'Draft buku cerita baru dari naskah yang ditempel.',
    status: 'draft',
    pipelineStatus: 'story_complete',
    accessStatus: 'free_member',
    downloadEnabled: true,
    ebookPrice: defaultEbookPrice,
    watermarkEnabled: true,
    pages,
    glossary: extractGlossaryCandidates(form.brief),
  };
};

export const buildDraftStoryFromAiDraft = (form: QuickCreateForm, draft: AiBookDraft, defaultEbookPrice: number): Story => {
  const rawPages = Array.isArray(draft.pages) && draft.pages.length > 0
    ? draft.pages
    : splitManuscriptIntoPageDrafts(form.brief);
  const normalizedPages: AiBookDraftPage[] = rawPages;
  const pages: StoryPage[] = normalizedPages.slice(0, 12).map((page, index) => {
    const basePage = createBlankPage(index + 1);
    const title = page.title?.trim() || `Halaman ${index + 1}`;
    const text = page.text?.trim() || '';
    const illustrationType = page.illustrationType || inferIllustrationType(`${title} ${text}`);

    return {
      ...basePage,
      title,
      titleEn: page.titleEn?.trim() || '',
      text,
      textEn: page.textEn?.trim() || '',
      illustrationType,
      illustrationPrompt:
        page.illustrationPrompt?.trim() ||
        `A clear ${illustrationType} story scene with one focal action, expressive characters, and a child-safe colorful illustration style.`,
      interactiveElements: page.interactiveElements || [],
      quizQuestion: page.quizQuestion,
    };
  });
  return {
    id: form.storyId || createStoryId(draft.title || form.title || 'Buku Cerita Baru'),
    title: draft.title?.trim() || form.title.trim() || 'Buku Cerita Baru',
    author: 'BacaYuk Studio',
    category: draft.category?.trim() || 'Petualangan',
    coverImage: DRAFT_COVER_PLACEHOLDER,
    coverBg: 'from-warning to-warning',
    themeColor: 'amber',
    accentColor: 'orange',
    moralMessage:
      draft.moralMessage?.trim() ||
      'Setiap perjalanan menjadi lebih indah saat dijalani dengan berani dan hati baik.',
    targetAge: targetAgeLabel(form.targetAge),
    description: draft.description?.trim() || pages[0]?.text.slice(0, 150) || 'Draft buku cerita baru dari AI.',
    status: 'draft',
    pipelineStatus: 'story_complete',
    accessStatus: 'free_member',
    downloadEnabled: true,
    ebookPrice: defaultEbookPrice,
    watermarkEnabled: true,
    pages,
    glossary: draft.glossary || [],
    vocabularyQuiz: draft.vocabularyQuiz,
    productionGuide: draft.productionGuide,
  };
};


export const normalizeStoryForSave = (story: Story): Story => {
  const pages = story.pages.map((page, index) => ({
    ...page,
    pageNumber: index + 1,
    title: page.title?.trim() || `Halaman ${index + 1}`,
    titleEn: page.titleEn?.trim(),
    text: page.text.trim(),
    textEn: page.textEn?.trim(),
    imageUrl: page.imageUrl?.trim(),
    illustrationType: page.illustrationType || 'forest',
    colors: page.colors || createBlankPage(index + 1).colors,
  }));
  const storyText = [
    story.title,
    story.description,
    story.moralMessage,
    ...pages.flatMap((page) => [page.title, page.titleEn || '', page.text, page.textEn || '']),
  ].join('\n');

  return {
    ...story,
    id: story.id.trim(),
    title: story.title.trim(),
    author: story.author.trim(),
    category: story.category.trim(),
    targetAge: story.targetAge.trim(),
    description: story.description.trim(),
    moralMessage: story.moralMessage.trim(),
    coverImage: story.coverImage.trim(),
    status: story.status || 'draft',
    pages,
    glossary: (story.glossary || []).filter(
      (item) =>
        item.wordEn.trim() &&
        item.translationId.trim() &&
        includesGlossaryTerm(storyText, [item.wordEn, item.translationId])
    ),
  };
};

export const validateStory = (story: Story): string[] => {
  const errors: string[] = [];
  const normalized = normalizeStoryForSave(story);

  if (!normalized.title) errors.push('Judul buku wajib diisi.');
  if (!normalized.id.trim()) errors.push('ID buku wajib diisi.');
  if (!normalized.author) errors.push('Nama penulis wajib diisi.');
  if (!normalized.category) errors.push('Kategori wajib diisi.');
  if (!normalized.description) errors.push('Deskripsi singkat wajib diisi.');
  if (!normalized.coverImage) errors.push('URL cover wajib diisi.');
  if (normalized.downloadEnabled !== false && (normalized.ebookPrice || 0) < 0) {
    errors.push('Harga e-book tidak boleh negatif.');
  }
  if (normalized.pages.length === 0) errors.push('Buku minimal harus punya 1 halaman.');

  normalized.pages.forEach((page, index) => {
    if (!page.text) errors.push(`Teks Bahasa Indonesia halaman ${index + 1} masih kosong.`);
    if (
      page.illustrationType === 'custom' &&
      !page.illustrationPrompt?.trim() &&
      !page.customSvgPath?.trim() &&
      !page.imageUrl?.trim()
    ) {
      errors.push(`Halaman ${index + 1} bertipe custom perlu prompt ilustrasi, path SVG, atau image URL.`);
    }
  });

  return errors;
};

// Finance Filter
