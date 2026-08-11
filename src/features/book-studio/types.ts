import type { InteractiveElement, Story, StoryPage, StoryProductionGuide, StoryVisualPreset } from '@/types';

export interface QuickCreateForm {
  storyId?: string;
  brief: string;
  targetAge: '3-5' | '6-8' | '9-12';
  primaryLanguage: 'id' | 'en';
  title: string;
  moralMessage: string;
  characterHints: string;
  pageCount: 8 | 10 | 12;
  visualPreset: 'auto' | StoryVisualPreset;
  tabooContent: string;
}

export interface PageDraft {
  title: string;
  text: string;
}

export interface AiBookDraftPage {
  title?: string;
  titleEn?: string;
  text?: string;
  textEn?: string;
  illustrationType?: StoryPage['illustrationType'];
  illustrationPrompt?: string;
  interactiveElements?: InteractiveElement[];
  quizQuestion?: StoryPage['quizQuestion'];
}

export interface AiBookDraft {
  title?: string;
  category?: string;
  description?: string;
  moralMessage?: string;
  coverPrompt?: string;
  pages?: AiBookDraftPage[];
  glossary?: Story['glossary'];
  vocabularyQuiz?: Story['vocabularyQuiz'];
  productionGuide?: StoryProductionGuide;
}

export interface BookCostEvent {
  id: string;
  story_id: string | null;
  story_title: string;
  event_type: 'book_draft' | 'image_generation' | 'pdf_ocr' | 'payment_fee';
  provider: string;
  model: string | null;
  amount_idr: number;
  input_tokens: number | null;
  output_tokens: number | null;
  created_at: string;
}

