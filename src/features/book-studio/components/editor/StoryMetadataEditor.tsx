import { useCallback } from 'react';
import type { Story } from '@/types';
import type { StoryMetadataEditorProps } from '@/features/book-studio/types/storyMetadata';
import { StoryAccessSettings } from '@/features/book-studio/components/editor/metadata/StoryAccessSettings';
import { StoryCatalogFields } from '@/features/book-studio/components/editor/metadata/StoryCatalogFields';
import { StoryDownloadSettings } from '@/features/book-studio/components/editor/metadata/StoryDownloadSettings';
import { StoryIdentityFields } from '@/features/book-studio/components/editor/metadata/StoryIdentityFields';

export function StoryMetadataEditor({
  story,
  isNewStory,
  settings,
  onStoryChange,
}: StoryMetadataEditorProps) {
  const updateStory = useCallback((changes: Partial<Story>) => {
    onStoryChange((currentStory) => currentStory ? { ...currentStory, ...changes } : currentStory);
  }, [onStoryChange]);

  return (
    <>
      <StoryIdentityFields story={story} isNewStory={isNewStory} onUpdateStory={updateStory} />
      <StoryCatalogFields story={story} onUpdateStory={updateStory} />
      <StoryAccessSettings accessStatus={story.accessStatus} onUpdateStory={updateStory} />
      <StoryDownloadSettings story={story} settings={settings} onUpdateStory={updateStory} />
    </>
  );
}
