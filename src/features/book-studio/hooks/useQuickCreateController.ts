import { useCallback, useState } from 'react';
import type { Story } from '@/types';
import { DEFAULT_QUICK_CREATE_FORM } from '@/features/book-studio/constants';
import { useQuickCreateDraftGeneration } from '@/features/book-studio/hooks/useQuickCreateDraftGeneration';
import { useQuickCreatePdfImport } from '@/features/book-studio/hooks/useQuickCreatePdfImport';
import type { QuickCreateForm } from '@/features/book-studio/types';

interface QuickCreateControllerOptions {
  adminPin?: string;
  defaultEbookPrice: number;
  onDraftReady: (story: Story) => void;
  showToast: (message: string) => void;
}

export function useQuickCreateController({
  adminPin,
  defaultEbookPrice,
  onDraftReady,
  showToast,
}: QuickCreateControllerOptions) {
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreateForm, setQuickCreateForm] = useState<QuickCreateForm>(DEFAULT_QUICK_CREATE_FORM);
  const [quickCreateErrors, setQuickCreateErrors] = useState<string[]>([]);
  const [showQuickCreateAdvanced, setShowQuickCreateAdvanced] = useState(false);

  const pdfImport = useQuickCreatePdfImport({
    adminPin,
    form: quickCreateForm,
    onFormChange: setQuickCreateForm,
    onErrorsChange: setQuickCreateErrors,
    showToast,
  });

  const resetBaseForm = useCallback((): void => {
    setQuickCreateForm(DEFAULT_QUICK_CREATE_FORM);
    setQuickCreateErrors([]);
    setShowQuickCreateAdvanced(false);
  }, []);

  const completeDraft = useCallback((story: Story, message: string): void => {
    onDraftReady(story);
    setShowQuickCreate(false);
    resetBaseForm();
    pdfImport.resetPdfImport();
    showToast(message);
  }, [onDraftReady, pdfImport.resetPdfImport, resetBaseForm, showToast]);

  const draftGeneration = useQuickCreateDraftGeneration({
    adminPin,
    defaultEbookPrice,
    form: quickCreateForm,
    onErrorsChange: setQuickCreateErrors,
    onDraftReady: completeDraft,
  });

  const resetQuickCreate = useCallback((): void => {
    draftGeneration.cancelGeneration();
    pdfImport.resetPdfImport();
    resetBaseForm();
  }, [draftGeneration.cancelGeneration, pdfImport.resetPdfImport, resetBaseForm]);

  const openQuickCreate = useCallback((): void => {
    resetQuickCreate();
    setShowQuickCreate(true);
  }, [resetQuickCreate]);

  const closeQuickCreate = useCallback((): void => {
    draftGeneration.cancelGeneration();
    pdfImport.cancelImport();
    setShowQuickCreate(false);
  }, [draftGeneration.cancelGeneration, pdfImport.cancelImport]);

  return {
    showQuickCreate,
    quickCreateForm,
    quickCreateErrors,
    showQuickCreateAdvanced,
    pdfImport: pdfImport.pdfImport,
    pdfImportProgress: pdfImport.pdfImportProgress,
    isExtractingPdf: pdfImport.isExtractingPdf,
    isGeneratingBookDraft: draftGeneration.isGenerating,
    setQuickCreateForm,
    setShowQuickCreateAdvanced,
    openQuickCreate,
    closeQuickCreate,
    handlePdfImport: pdfImport.handlePdfImport,
    handleQuickCreateDraft: draftGeneration.handleSubmit,
  };
}

export type QuickCreateController = ReturnType<typeof useQuickCreateController>;
