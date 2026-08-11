import { useCallback, useEffect } from 'react';
import type { AdminSettings } from '@/utils/adminStore';
import type { Story } from '@/types';
import { useQuickCreateController } from '@/features/book-studio/hooks/useQuickCreateController';
import { useStoryEditorController } from '@/features/book-studio/hooks/useStoryEditorController';
import { QuickCreateDialog } from '@/features/book-studio/components/QuickCreateDialog';
import { StoriesTab } from '@/features/book-studio/components/StoriesTab';
import { StoryEditorDialog } from '@/features/book-studio/components/StoryEditorDialog';

interface BookStudioAdminWorkspaceProps {
  stories: Story[];
  settings: AdminSettings;
  onUpdateStories: (stories: Story[]) => void | Promise<void>;
  showToast: (message: string) => void;
  adminPin?: string;
  routeAction?: 'new' | 'edit' | 'canvas';
  routeStoryId?: string;
  onCloseRouteAction?: () => void;
  onOpenQuickCreate?: () => void;
  onOpenStoryEditor?: (storyId: string, mode: 'edit' | 'canvas') => void;
}

export function BookStudioAdminWorkspace({
  stories,
  settings,
  onUpdateStories,
  showToast,
  adminPin,
  routeAction,
  routeStoryId,
  onCloseRouteAction,
  onOpenQuickCreate,
  onOpenStoryEditor,
}: BookStudioAdminWorkspaceProps) {
  const editor = useStoryEditorController({
    stories,
    onUpdateStories,
    defaultEbookPrice: settings.defaultEbookPrice,
    adminPin,
    routeAction,
    routeStoryId,
    onCloseRouteAction,
    onOpenStoryEditor,
    showToast,
  });

  const quickCreate = useQuickCreateController({
    adminPin,
    defaultEbookPrice: settings.defaultEbookPrice,
    onDraftReady: editor.openDraftInEditor,
    showToast,
  });

  useEffect(() => {
    if (routeAction === 'new') quickCreate.openQuickCreate();
  }, [quickCreate.openQuickCreate, routeAction]);

  const handleOpenQuickCreate = useCallback(() => {
    quickCreate.openQuickCreate();
    onOpenQuickCreate?.();
  }, [onOpenQuickCreate, quickCreate.openQuickCreate]);

  const handleCloseQuickCreate = useCallback(() => {
    quickCreate.closeQuickCreate();
    onCloseRouteAction?.();
  }, [onCloseRouteAction, quickCreate.closeQuickCreate]);

  return (
    <>
      <StoriesTab
        defaultEbookPrice={settings.defaultEbookPrice}
        stories={stories}
        onCreateWithAi={handleOpenQuickCreate}
        onCreateManually={editor.openManualStory}
        onEdit={editor.openExistingStory}
        onDelete={editor.handleDeleteStory}
      />

      {quickCreate.showQuickCreate && (
        <QuickCreateDialog
          form={quickCreate.quickCreateForm}
          errors={quickCreate.quickCreateErrors}
          pdfImport={quickCreate.pdfImport}
          pdfImportProgress={quickCreate.pdfImportProgress}
          isExtractingPdf={quickCreate.isExtractingPdf}
          isGenerating={quickCreate.isGeneratingBookDraft}
          showAdvanced={quickCreate.showQuickCreateAdvanced}
          onFormChange={quickCreate.setQuickCreateForm}
          onAdvancedChange={quickCreate.setShowQuickCreateAdvanced}
          onPdfImport={quickCreate.handlePdfImport}
          onSubmit={quickCreate.handleQuickCreateDraft}
          onClose={handleCloseQuickCreate}
        />
      )}

      {editor.editingStory && (
        <StoryEditorDialog
          story={editor.editingStory}
          isNewStory={editor.isNewStory}
          settings={settings}
          errors={editor.errors}
          previewPageIndex={editor.previewPageIndex}
          showAdvanced={editor.showAdvancedEditor}
          interactionPlaceMode={editor.interactionPlaceMode}
          isGeneratingTranslation={editor.isGeneratingTranslation}
          generatingEnhancement={editor.generatingEnhancement}
          generatingImagePageNumber={editor.generatingImagePageNumber}
          imageGenerationProgress={editor.imageGenerationProgress}
          onStoryChange={editor.setEditingStory}
          onPreviewPageChange={editor.setPreviewPageIndex}
          onAdvancedChange={editor.setShowAdvancedEditor}
          onInteractionPlaceModeChange={editor.setInteractionPlaceMode}
          onGenerateTranslation={editor.handleGenerateTranslation}
          onGenerateEnhancement={editor.handleGenerateEnhancement}
          onGeneratePageImage={editor.handleGeneratePageImage}
          onGenerateAllImages={editor.handleGenerateAllImages}
          onCanvasInteractionClick={editor.handleCanvasInteractionClick}
          onRefreshGlossary={editor.refreshGlossaryCandidates}
          onSubmit={editor.handleSaveStory}
          onClose={editor.closeEditor}
        />
      )}
    </>
  );
}
