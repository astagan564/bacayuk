import type { Dispatch, SetStateAction } from 'react';
import type { Story } from '@/types';

export type StoryEnhancementMode = 'illustration' | 'glossary' | 'quiz_interactions';

export interface StoryImageGenerationProgress {
  completed: number;
  total: number;
  label: string;
}

export interface StoryAiControllerOptions {
  editingStory: Story | null;
  setEditingStory: Dispatch<SetStateAction<Story | null>>;
  adminPin?: string;
  showToast: (message: string) => void;
}

export interface StoryAiOperationTicket {
  id: number;
  signal: AbortSignal;
}

export interface StoryAiOperationCoordinator {
  start: () => StoryAiOperationTicket | null;
  isCurrent: (operationId: number) => boolean;
  finish: (operationId: number) => void;
}
