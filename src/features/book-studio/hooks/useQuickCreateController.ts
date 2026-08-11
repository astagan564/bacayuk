import { useCallback, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { Story } from '@/types';
import {
  DEFAULT_QUICK_CREATE_FORM,
  MAX_PDF_IMPORT_SIZE,
  MAX_PDF_MANUSCRIPT_LENGTH,
} from '@/features/book-studio/constants';
import { storybookApi } from '@/features/book-studio/api/storybookApi';
import { createStoryId, resolvedVisualPreset } from '@/features/book-studio/helpers/storyDraft';
import {
  buildDraftStoryFromAiDraft,
  buildDraftStoryFromQuickCreate,
} from '@/features/book-studio/helpers/storyMapping';
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
  const [pdfImport, setPdfImport] = useState<{ fileName: string; pageCount: number; characterCount: number } | null>(null);
  const [pdfImportProgress, setPdfImportProgress] = useState<string | null>(null);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [isGeneratingBookDraft, setIsGeneratingBookDraft] = useState(false);

  const resetQuickCreate = useCallback(() => {
    setQuickCreateForm(DEFAULT_QUICK_CREATE_FORM);
    setQuickCreateErrors([]);
    setShowQuickCreateAdvanced(false);
    setPdfImport(null);
    setPdfImportProgress(null);
  }, []);

  const openQuickCreate = useCallback(() => {
    resetQuickCreate();
    setShowQuickCreate(true);
  }, [resetQuickCreate]);

  const closeQuickCreate = useCallback(() => {
    setShowQuickCreate(false);
  }, []);

  const extractTextFromPdfPageImage = async (imageBase64: string, storyId: string, storyTitle: string): Promise<string> => {
    if (!adminPin) throw new Error('PIN admin tidak tersedia untuk membaca PDF hasil scan.');
    return storybookApi.extractPdfPageText(adminPin, { imageBase64, storyId, storyTitle });
  };

  const handlePdfImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    setQuickCreateErrors([]);
    setPdfImport(null);

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setQuickCreateErrors(['Pilih berkas PDF untuk diubah menjadi naskah buku.']);
      return;
    }

    if (file.size > MAX_PDF_IMPORT_SIZE) {
      setQuickCreateErrors(['PDF terlalu besar. Pilih berkas hingga 400 MB agar dapat diproses di browser.']);
      return;
    }

    const suggestedPdfTitle = file.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
    const trackingStoryId = quickCreateForm.storyId || createStoryId(suggestedPdfTitle || 'buku-pdf');

    setIsExtractingPdf(true);
    setPdfImportProgress('Membuka PDF…');
    let releasePdf: (() => Promise<void>) | null = null;

    try {
      const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
      GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

      const loadingTask = getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
      releasePdf = () => loadingTask.destroy();
      const document = await loadingTask.promise;
      const sourcePages: Array<{ pageNumber: number; text: string }> = [];

      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        setPdfImportProgress(`Membaca halaman ${pageNumber} dari ${document.numPages}…`);
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        const text = content.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        sourcePages.push({ pageNumber, text });
      }

      const scannedPages = sourcePages.filter((sourcePage) => !sourcePage.text);
      for (const sourcePage of scannedPages) {
        setPdfImportProgress(`Mengenali teks pada halaman ${sourcePage.pageNumber} dari ${document.numPages}…`);
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

        await page.render({ canvas, viewport }).promise;
        let imageBase64 = canvas.toDataURL('image/jpeg', 0.76).split(',')[1] || '';
        if (imageBase64.length > 650_000) {
          imageBase64 = canvas.toDataURL('image/jpeg', 0.52).split(',')[1] || '';
        }
        if (!imageBase64 || imageBase64.length > 650_000) {
          throw new Error(`Halaman ${sourcePage.pageNumber} terlalu detail untuk OCR. Coba PDF dengan resolusi lebih rendah.`);
        }

        sourcePage.text = await extractTextFromPdfPageImage(imageBase64, trackingStoryId, quickCreateForm.title.trim() || suggestedPdfTitle);
        canvas.width = 1;
        canvas.height = 1;
      }

      const readableSourcePages = sourcePages.filter((sourcePage) => sourcePage.text);

      if (readableSourcePages.length === 0) {
        throw new Error('Teks tidak ditemukan pada PDF ini, termasuk setelah OCR. Tambahkan naskah secara manual atau gunakan PDF lain.');
      }

      let remainingCharacters = MAX_PDF_MANUSCRIPT_LENGTH;
      const manuscriptSections = readableSourcePages.flatMap(({ pageNumber, text }) => {
        const heading = `## Halaman sumber ${pageNumber}\n`;
        const availableCharacters = remainingCharacters - heading.length;
        if (availableCharacters < 120) return [];

        const pageText = text.slice(0, availableCharacters).trim();
        remainingCharacters -= heading.length + pageText.length + 2;
        return [`${heading}${pageText}`];
      });
      const manuscript = manuscriptSections.join('\n\n').trim();

      if (manuscript.length < 12) {
        throw new Error('Teks PDF terlalu sedikit untuk dibuat menjadi buku. Tambahkan naskah atau pilih PDF lain.');
      }

      const suggestedTitle = file.name
        .replace(/\.pdf$/i, '')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      setQuickCreateForm((current) => ({
        ...current,
        storyId: current.storyId || trackingStoryId,
        brief: manuscript,
        title: current.title.trim() || suggestedTitle,
      }));
      setPdfImport({
        fileName: file.name,
        pageCount: readableSourcePages.length,
        characterCount: manuscript.length,
      });
      showToast('Teks PDF siap dijadikan draft buku.');
    } catch (error) {
      console.error('PDF import failed:', error);
      setQuickCreateErrors([
        error instanceof Error ? error.message : 'PDF belum dapat dibaca. Coba berkas PDF lain.',
      ]);
    } finally {
      if (releasePdf) {
        await releasePdf().catch(() => undefined);
      }
      setIsExtractingPdf(false);
      setPdfImportProgress(null);
    }
  };

  const createDraftWithAi = async (form: QuickCreateForm): Promise<Story> => {
    if (!adminPin) throw new Error('PIN admin tidak tersedia untuk AI draft.');
    const draft = await storybookApi.generateDraft(adminPin, {
      ...form,
      visualPreset: resolvedVisualPreset(form),
    });
    return buildDraftStoryFromAiDraft(form, draft, defaultEbookPrice);
  };

  const openDraftStory = (draftStory: Story) => {
    onDraftReady(draftStory);
    setShowQuickCreate(false);
    setQuickCreateForm(DEFAULT_QUICK_CREATE_FORM);
    setQuickCreateErrors([]);
    setShowQuickCreateAdvanced(false);
    setPdfImport(null);
    setPdfImportProgress(null);
  };

  const handleQuickCreateDraft = async (e: FormEvent) => {
    e.preventDefault();

    const errors: string[] = [];
    if (quickCreateForm.brief.trim().length < 12) {
      errors.push('Tuliskan sedikitnya satu ide cerita yang jelas.');
    }

    if (errors.length > 0) {
      setQuickCreateErrors(errors);
      return;
    }

    const normalizedForm = {
      ...quickCreateForm,
      storyId: quickCreateForm.storyId || createStoryId(quickCreateForm.title || 'buku-ai'),
      brief: quickCreateForm.brief.trim(),
      title: quickCreateForm.title.trim(),
      moralMessage: quickCreateForm.moralMessage.trim(),
      characterHints: quickCreateForm.characterHints.trim(),
      tabooContent: quickCreateForm.tabooContent.trim(),
    };

    setIsGeneratingBookDraft(true);
    try {
      const draftStory = await createDraftWithAi(normalizedForm);
      openDraftStory(draftStory);
      showToast(`Draft AI "${draftStory.title}" siap direview.`);
    } catch (error) {
      console.error('AI book draft failed:', error);
      if (normalizedForm.brief.length >= 120) {
        const draftStory = buildDraftStoryFromQuickCreate(normalizedForm, defaultEbookPrice);
        openDraftStory(draftStory);
        showToast('AI belum tersedia. Naskah tetap dipecah menjadi draft lokal untuk direview.');
      } else {
        setQuickCreateErrors([
          error instanceof Error ? error.message : 'Buku belum berhasil dibuat. Coba kembali beberapa saat lagi.',
        ]);
      }
    } finally {
      setIsGeneratingBookDraft(false);
    }
  };


  return {
    showQuickCreate,
    quickCreateForm,
    quickCreateErrors,
    showQuickCreateAdvanced,
    pdfImport,
    pdfImportProgress,
    isExtractingPdf,
    isGeneratingBookDraft,
    setQuickCreateForm,
    setShowQuickCreateAdvanced,
    openQuickCreate,
    closeQuickCreate,
    handlePdfImport,
    handleQuickCreateDraft,
  };
}
