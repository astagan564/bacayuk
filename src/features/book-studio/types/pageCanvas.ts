import type { StoryPage } from '@/types';

export type PageEnhancementMode = 'illustration' | 'glossary' | 'quiz_interactions';

export interface ImageGenerationProgress {
  completed: number;
  total: number;
  label: string;
}

export type UpdateStoryPage = (nextPage: StoryPage) => void;
