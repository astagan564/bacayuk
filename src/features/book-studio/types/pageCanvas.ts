import type { StoryPage } from '@/types';

export type {
  StoryEnhancementMode as PageEnhancementMode,
  StoryImageGenerationProgress as ImageGenerationProgress,
} from '@/features/book-studio/types/storyAi';

export type UpdateStoryPage = (nextPage: StoryPage) => void;
