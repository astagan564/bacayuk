import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  MAX_PDF_IMPORT_SIZE,
} from '@/features/book-studio/constants';
import { storybookApi } from '@/features/book-studio/api/storybookApi';
import { createStoryId } from '@/features/book-studio/helpers/storyDraft';
import {
  buildPdfManuscript,
  getSuggestedPdfTitle,
  type PdfSourcePage,
} from '@/features/book-studio/helpers/pdfManuscript';
import type {
  PdfImportSummary,
  QuickCreateForm,
} from '@/features/book-studio/types';

interface QuickCreatePdfImportOptions {
  adminPin?: string;
  form: QuickCreateForm;
  onFormChange: Dispatch<SetStateAction<QuickCreateForm>>;
  onErrorsChange: Dispatch<SetStateAction<string[]>>;
  showToast: (message: string) => void;
}

function abortError(): DOMException {
  return new DOMException('PDF import dibatalkan.', 'AbortError');
}

export function useQuickCreatePdfImport({
  adminPin,
  form,
  onFormChange,
  onErrorsChange,
  showToast,
}: QuickCreatePdfImportOptions) {
  const [pdfImport, setPdfImport] = useState<PdfImportSummary | null>(null);
  const [pdfImportProgress, setPdfImportProgress] = useState<string | null>(null);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const operationIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const releasePdfRef = useRef<(() => Promise<void>) | null>(null);
  const cancelRenderRef = useRef<(() => void) | null>(null);
  const isMountedRef = useRef(true);

  const cancelImport = useCallback((): void => {
    operationIdRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    cancelRenderRef.current?.();
    cancelRenderRef.current = null;
    void releasePdfRef.current?.().catch(() => undefined);
    releasePdfRef.current = null;
    if (isMountedRef.current) {
      setIsExtractingPdf(false);
      setPdfImportProgress(null);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cancelImport();
    };
  }, [cancelImport]);

  const resetPdfImport = useCallback((): void => {
    cancelImport();
    setPdfImport(null);
    setPdfImportProgress(null);
  }, [cancelImport]);

  const handlePdfImport = useCallback(async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || abortControllerRef.current) return;

    onErrorsChange([]);
    setPdfImport(null);
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      onErrorsChange(['Pilih berkas PDF untuk diubah menjadi naskah buku.']);
      return;
    }
    if (file.size > MAX_PDF_IMPORT_SIZE) {
      onErrorsChange(['PDF terlalu besar. Pilih berkas hingga 400 MB agar dapat diproses di browser.']);
      return;
    }

    const suggestedTitle = getSuggestedPdfTitle(file.name);
    const trackingStoryId = form.storyId || createStoryId(suggestedTitle || 'buku-pdf');
    const operationId = ++operationIdRef.current;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setIsExtractingPdf(true);
    setPdfImportProgress('Membuka PDF…');
    let releasePdf: (() => Promise<void>) | null = null;

    const ensureActive = (): void => {
      if (!isMountedRef.current
        || operationId !== operationIdRef.current
        || abortController.signal.aborted) throw abortError();
    };
    const updateProgress = (message: string): void => {
      ensureActive();
      setPdfImportProgress(message);
    };

    try {
      const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
      ensureActive();
      GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
      const fileBuffer = await file.arrayBuffer();
      ensureActive();
      const loadingTask = getDocument({ data: new Uint8Array(fileBuffer) });
      let isReleased = false;
      releasePdf = async () => {
        if (isReleased) return;
        isReleased = true;
        await loadingTask.destroy();
      };
      releasePdfRef.current = releasePdf;
      const document = await loadingTask.promise;
      ensureActive();
      const sourcePages: PdfSourcePage[] = [];

      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        updateProgress(`Membaca halaman ${pageNumber} dari ${document.numPages}…`);
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        ensureActive();
        sourcePages.push({
          pageNumber,
          text: content.items
            .map((item) => ('str' in item ? item.str : ''))
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim(),
        });
      }

      for (const sourcePage of sourcePages.filter((page) => !page.text)) {
        updateProgress(`Mengenali teks pada halaman ${sourcePage.pageNumber} dari ${document.numPages}…`);
        const page = await document.getPage(sourcePage.pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(1.8, 1_400 / Math.max(baseViewport.width, baseViewport.height));
        const viewport = page.getViewport({ scale });
        const canvas = window.document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        if (!canvas.getContext('2d', { alpha: false })) {
          throw new Error('Kanvas untuk membaca PDF tidak tersedia di browser ini.');
        }

        try {
          const renderTask = page.render({ canvas, viewport });
          cancelRenderRef.current = () => renderTask.cancel();
          await renderTask.promise;
          cancelRenderRef.current = null;
          ensureActive();
          let imageBase64 = canvas.toDataURL('image/jpeg', 0.76).split(',')[1] || '';
          if (imageBase64.length > 650_000) {
            imageBase64 = canvas.toDataURL('image/jpeg', 0.52).split(',')[1] || '';
          }
          if (!imageBase64 || imageBase64.length > 650_000) {
            throw new Error(`Halaman ${sourcePage.pageNumber} terlalu detail untuk OCR. Coba PDF dengan resolusi lebih rendah.`);
          }
          if (!adminPin) throw new Error('PIN admin tidak tersedia untuk membaca PDF hasil scan.');
          sourcePage.text = await storybookApi.extractPdfPageText(
            adminPin,
            {
              imageBase64,
              storyId: trackingStoryId,
              storyTitle: form.title.trim() || suggestedTitle,
            },
            abortController.signal,
          );
          ensureActive();
        } finally {
          cancelRenderRef.current = null;
          canvas.width = 1;
          canvas.height = 1;
        }
      }

      const { manuscript, readablePageCount } = buildPdfManuscript(sourcePages);
      ensureActive();
      onFormChange((currentForm) => ({
        ...currentForm,
        storyId: currentForm.storyId || trackingStoryId,
        brief: manuscript,
        title: currentForm.title.trim() || suggestedTitle,
      }));
      setPdfImport({
        fileName: file.name,
        pageCount: readablePageCount,
        characterCount: manuscript.length,
      });
      showToast('Teks PDF siap dijadikan draft buku.');
    } catch (error) {
      if (abortController.signal.aborted || error instanceof DOMException && error.name === 'AbortError') return;
      console.error('PDF import failed:', error);
      if (isMountedRef.current && operationId === operationIdRef.current) {
        onErrorsChange([
          error instanceof Error ? error.message : 'PDF belum dapat dibaca. Coba berkas PDF lain.',
        ]);
      }
    } finally {
      if (releasePdf) await releasePdf().catch(() => undefined);
      if (operationId === operationIdRef.current) {
        abortControllerRef.current = null;
        releasePdfRef.current = null;
        cancelRenderRef.current = null;
        if (isMountedRef.current) {
          setIsExtractingPdf(false);
          setPdfImportProgress(null);
        }
      }
    }
  }, [adminPin, form.storyId, form.title, onErrorsChange, onFormChange, showToast]);

  return {
    pdfImport,
    pdfImportProgress,
    isExtractingPdf,
    handlePdfImport,
    cancelImport,
    resetPdfImport,
  };
}

export type QuickCreatePdfImportController = ReturnType<typeof useQuickCreatePdfImport>;
