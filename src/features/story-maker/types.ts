import type { Story } from '@/types';

export interface StoryMakerFormState {
  characterName: string;
  characterType: string;
  setting: string;
  moralValue: string;
  pageCount: number;
}

export interface StoryMakerModalProps {
  onClose: () => void;
  onStoryCreated: (newStory: Story) => void;
}
