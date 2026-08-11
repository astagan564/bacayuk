import type { InteractiveElement, Story, StoryPage } from '@/types';
import type { AiBookDraft, BookCostEvent, QuickCreateForm } from '../types';

interface TranslationRow {
  pageNumber: number;
  titleEn?: string;
  textEn: string;
}

interface EnhancementPage {
  pageNumber: number;
  illustrationType?: StoryPage['illustrationType'];
  illustrationPrompt?: string;
  interactiveElements?: InteractiveElement[];
  quizQuestion?: StoryPage['quizQuestion'];
}

interface EnhancementResponse {
  pages?: EnhancementPage[];
  glossary?: Story['glossary'];
  vocabularyQuiz?: Story['vocabularyQuiz'];
}

async function requestJson<T>(
  path: string,
  adminPin: string,
  init: Omit<RequestInit, 'headers'> & { headers?: Record<string, string> } = {},
  fallbackError: string,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
      'x-admin-pin': adminPin,
    },
  });
  const data = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || fallbackError);
  return data;
}

export const storybookApi = {
  async getCostEvents(adminPin: string): Promise<BookCostEvent[]> {
    const data = await requestJson<{ events?: BookCostEvent[] }>(
      '/api/admin/book-cost-events', adminPin, {}, 'Ledger biaya belum dapat dimuat.',
    );
    return Array.isArray(data.events) ? data.events : [];
  },

  translateStory(adminPin: string, story: Story, signal?: AbortSignal) {
    return requestJson<{ titleEn?: string; translations?: TranslationRow[] }>(
      '/api/admin/translate-story',
      adminPin,
      {
        method: 'POST',
        signal,
        body: JSON.stringify({
          title: story.title,
          pages: story.pages.map(({ pageNumber, title, text }) => ({ pageNumber, title, text })),
        }),
      },
      'Gagal membuat translation.',
    );
  },

  generateEnhancement(
    adminPin: string,
    story: Story,
    mode: 'illustration' | 'glossary' | 'quiz_interactions',
    pages: StoryPage[],
    signal?: AbortSignal,
  ) {
    return requestJson<EnhancementResponse>(
      '/api/admin/generate-book-enhancement',
      adminPin,
      {
        method: 'POST',
        signal,
        body: JSON.stringify({
          mode,
          title: story.title,
          targetAge: story.targetAge,
          productionGuide: story.productionGuide,
          pages: pages.map(({ pageNumber, title, text, illustrationType }) => ({
            pageNumber, title, text, illustrationType,
          })),
        }),
      },
      'Gagal membuat enhancement.',
    );
  },

  async generateImage(
    adminPin: string,
    story: Story,
    request: { imageKind: 'cover' } | { imageKind: 'page'; page: StoryPage },
    signal?: AbortSignal,
  ): Promise<string> {
    const page = request.imageKind === 'page' ? request.page : undefined;
    const data = await requestJson<{ imageUrl?: string }>(
      '/api/admin/generate-page-image',
      adminPin,
      {
        method: 'POST',
        signal,
        body: JSON.stringify({
          imageKind: request.imageKind,
          storyId: story.id,
          storyTitle: story.title,
          targetAge: story.targetAge,
          coverPrompt: story.productionGuide?.coverPrompt,
          pageNumber: page?.pageNumber,
          pageTitle: page?.title,
          pageText: page?.text,
          illustrationType: page?.illustrationType,
          illustrationPrompt: page?.illustrationPrompt,
          productionGuide: story.productionGuide,
        }),
      },
      'Gagal generate gambar buku.',
    );
    if (!data.imageUrl) throw new Error('Gagal generate gambar buku.');
    return data.imageUrl;
  },

  async extractPdfPageText(
    adminPin: string,
    input: { imageBase64: string; storyId: string; storyTitle: string },
    signal?: AbortSignal,
  ): Promise<string> {
    const data = await requestJson<{ text?: string }>(
      '/api/admin/extract-pdf-page-text', adminPin,
      { method: 'POST', body: JSON.stringify(input), signal }, 'OCR halaman PDF gagal.',
    );
    return typeof data.text === 'string' ? data.text.trim() : '';
  },

  async generateDraft(
    adminPin: string,
    form: QuickCreateForm,
    signal?: AbortSignal,
  ): Promise<AiBookDraft> {
    const data = await requestJson<{ draft?: AiBookDraft }>(
      '/api/admin/generate-book-draft',
      adminPin,
      {
        method: 'POST',
        signal,
        body: JSON.stringify({
          ...form,
          visualPreset: form.visualPreset,
          tabooContent: form.tabooContent.split(',').map((item) => item.trim()).filter(Boolean),
        }),
      },
      'Gagal membuat draft buku dengan AI.',
    );
    return data.draft || {};
  },
};
