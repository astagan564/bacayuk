import type { Dispatch, SetStateAction } from 'react';
import type { AdminSettings } from '@/utils/adminStore';
import type { Story } from '@/types';
import { BilingualPagesEditor } from './BilingualPagesEditor';
import { ManualGlossaryEditor } from './ManualGlossaryEditor';
import { PageInteractionQuizEditor } from './PageInteractionQuizEditor';
import { PagePreviewSection } from './PagePreviewSection';
import { StoryMetadataEditor } from './StoryMetadataEditor';

interface AdvancedStoryEditorProps {
  story: Story;
  isNewStory: boolean;
  settings: AdminSettings;
  previewPageIndex: number;
  onStoryChange: Dispatch<SetStateAction<Story | null>>;
  onPreviewPageChange: Dispatch<SetStateAction<number>>;
}

export function AdvancedStoryEditor({
  story,
  isNewStory,
  settings,
  previewPageIndex,
  onStoryChange,
  onPreviewPageChange,
}: AdvancedStoryEditorProps) {
  return (
    <>
      <StoryMetadataEditor
        story={story}
        isNewStory={isNewStory}
        settings={settings}
        onStoryChange={onStoryChange}
      />

      <BilingualPagesEditor
        story={story}
        previewPageIndex={previewPageIndex}
        onStoryChange={onStoryChange}
        onPreviewPageChange={onPreviewPageChange}
      />

      <PagePreviewSection
        story={story}
        previewPageIndex={previewPageIndex}
        onPreviewPageChange={onPreviewPageChange}
      />

      <PageInteractionQuizEditor
        story={story}
        previewPageIndex={previewPageIndex}
        onStoryChange={onStoryChange}
      />

      <ManualGlossaryEditor story={story} onStoryChange={onStoryChange} />
    </>
  );
}
