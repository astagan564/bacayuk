import type { Dispatch, SetStateAction } from 'react';
import type { Story } from '@/types';
import type { AdminSettings } from '@/features/admin/types/adminStore';

export interface StoryMetadataEditorProps {
  story: Story;
  isNewStory: boolean;
  settings: AdminSettings;
  onStoryChange: Dispatch<SetStateAction<Story | null>>;
}

export type UpdateStoryMetadata = (changes: Partial<Story>) => void;
