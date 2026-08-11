import React, { useState, useEffect } from 'react';
import {
  InteractiveElement,
  Story,
  StoryPage,
} from '../types';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import bacaYukLogo from '../assets/bacayuk-logo.svg';
import bacaYukMark from '../assets/bacayuk-mark.svg';
import {
  adminStore,
  AdminSettings,
  DiscountCoupon,
  TransactionRecord,
  UserReadingActivity,
} from '../utils/adminStore';
import { userAuthStore, UserAccount } from '../utils/userAuthStore';
import {
  DEFAULT_QUICK_CREATE_FORM,
  LEGACY_DEMO_USER_IDS,
  MAX_PDF_IMPORT_SIZE,
  MAX_PDF_MANUSCRIPT_LENGTH,
  PIPELINE_STEPS,
  chunkSentences,
  createBlankPage,
  createStoryId,
  extractGlossaryCandidates,
  hasCompleteStoryImages,
  includesGlossaryTerm,
  inferIllustrationType,
  inferPipelineStatus,
  isPlaceholderCover,
  resolvedVisualPreset,
  sentenceCaseTitle,
  splitManuscriptIntoPageDrafts,
  splitTextIntoSentences,
  storybookApi,
  targetAgeLabel,
  visualPresetLabel,
} from '../features/book-studio';
import type { AiBookDraft, BookCostEvent, QuickCreateForm } from '../features/book-studio';
import { QuickCreateDialog } from '../features/book-studio/components/QuickCreateDialog';
import { UsersTab } from '../features/admin/components/UsersTab';
import { FinanceTab } from '../features/admin/components/FinanceTab';
import { CostLedgerTab } from '../features/admin/components/CostLedgerTab';
import { AdminSettingsTab } from '../features/admin/components/AdminSettingsTab';
import { AnalyticsTab } from '../features/admin/components/AnalyticsTab';
import { StoriesTab } from '../features/admin/components/StoriesTab';
import { StoryEditorDialog } from '../features/book-studio/components/StoryEditorDialog';
import {
  X,
  BookOpen,
  Users,
  CreditCard,
  Settings,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  ReceiptText,
} from 'lucide-react';

interface AdminDashboardProps {
  stories: Story[];
  onUpdateStories: (updatedStories: Story[]) => void | Promise<void>;
  onBackToHome: () => void;
  adminPin?: string;
  isNight?: boolean;
  activeSection?: AdminSection;
  routeAction?: 'new' | 'edit' | 'canvas';
  routeStoryId?: string;
  onSectionChange?: (section: AdminSection) => void;
  onCloseRouteAction?: () => void;
  onOpenQuickCreate?: () => void;
  onOpenStoryEditor?: (storyId: string, mode: 'edit' | 'canvas') => void;
}
export type AdminSection = 'cms' | 'users' | 'finance' | 'costs' | 'settings' | 'analytics';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stories,
  onUpdateStories,
  onBackToHome,
  adminPin,
  isNight = false,
  activeSection,
  routeAction,
  routeStoryId,
  onSectionChange,
  onCloseRouteAction,
  onOpenQuickCreate,
  onOpenStoryEditor,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<AdminSection>('cms');
  const activeTab = activeSection ?? internalActiveTab;
  const [cronStatus, setCronStatus] = useState<string | null>(null);

  // Admin Settings State
  const [settings, setSettings] = useState<AdminSettings>(() => adminStore.getSettings());
  // Coupons State
  const [coupons, setCoupons] = useState<DiscountCoupon[]>(() => adminStore.getCoupons());
  // Transactions State
  const [transactions, setTransactions] = useState<TransactionRecord[]>(() => adminStore.getTransactions());
  const [costEvents, setCostEvents] = useState<BookCostEvent[]>([]);
  const [costLedgerError, setCostLedgerError] = useState<string | null>(null);
  // Reading Logs
  const [readingLogs, setReadingLogs] = useState<UserReadingActivity[]>(() => adminStore.getReadingLogs());

  // Show only the actual account currently signed in on this device.
  const [userList, setUserList] = useState<UserAccount[]>(() => {
    const current = userAuthStore.getUser();
    return current && !LEGACY_DEMO_USER_IDS.has(current.id) ? [current] : [];
  });

  // Story Uploader / Editor Modal State
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [isNewStory, setIsNewStory] = useState(false);
  const [storyFormErrors, setStoryFormErrors] = useState<string[]>([]);
  const [previewPageIndex, setPreviewPageIndex] = useState(0);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreateForm, setQuickCreateForm] = useState<QuickCreateForm>(DEFAULT_QUICK_CREATE_FORM);
  const [quickCreateErrors, setQuickCreateErrors] = useState<string[]>([]);
  const [showQuickCreateAdvanced, setShowQuickCreateAdvanced] = useState(false);
  const [pdfImport, setPdfImport] = useState<{ fileName: string; pageCount: number; characterCount: number } | null>(null);
  const [pdfImportProgress, setPdfImportProgress] = useState<string | null>(null);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
  const [interactionPlaceMode, setInteractionPlaceMode] = useState(false);
  const [isGeneratingTranslation, setIsGeneratingTranslation] = useState(false);
  const [isGeneratingBookDraft, setIsGeneratingBookDraft] = useState(false);
  const [generatingEnhancement, setGeneratingEnhancement] = useState<'illustration' | 'glossary' | 'quiz_interactions' | null>(null);
  const [generatingImagePageNumber, setGeneratingImagePageNumber] = useState<number | null>(null);
  const [imageGenerationProgress, setImageGenerationProgress] = useState<{
    completed: number;
    total: number;
    label: string;
  } | null>(null);

  // New Coupon Form State
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percent' | 'fixed'>('percent');
  const [newCouponValue, setNewCouponValue] = useState(20);
  const [showCouponForm, setShowCouponForm] = useState(false);

  // Toast / Feedback message
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadCostEvents = async () => {
    if (!adminPin) return;
    try {
      setCostEvents(await storybookApi.getCostEvents(adminPin));
      setCostLedgerError(null);
    } catch (error) {
      setCostLedgerError(error instanceof Error ? error.message : 'Ledger biaya belum dapat dimuat.');
    }
  };

  useEffect(() => {
    void loadCostEvents();
  }, [adminPin]);

  useEffect(() => {
    if (routeAction === 'new') {
      setShowQuickCreate(true);
      return;
    }
    if (!routeStoryId || (routeAction !== 'edit' && routeAction !== 'canvas')) return;
    const story = stories.find((candidate) => candidate.id === routeStoryId);
    if (!story) return;
    setEditingStory({ ...story, pages: story.pages.map((page) => ({ ...page })) });
    setIsNewStory(false);
    setShowAdvancedEditor(routeAction === 'canvas');
  }, [routeAction, routeStoryId, stories]);

  const selectSection = (section: AdminSection) => {
    setInternalActiveTab(section);
    onSectionChange?.(section);
  };

  const updateEditingPage = (pageIndex: number, nextPage: StoryPage) => {
    if (!editingStory) return;
    const newPages = [...editingStory.pages];
    newPages[pageIndex] = nextPage;
    setEditingStory({ ...editingStory, pages: newPages });
  };

  const renderPageImagePreview = (page: StoryPage, className = '') => (
    page.imageUrl ? (
      <img
        src={page.imageUrl}
        alt=""
        className={`h-full w-full object-cover ${className}`}
        loading="lazy"
      />
    ) : null
  );

  const refreshGlossaryCandidates = () => {
    if (!editingStory) return;
    const manuscript = editingStory.pages.map((page) => `${page.title || ''}\n${page.text}`).join('\n\n');
    const candidates = extractGlossaryCandidates(manuscript);
    const existing = editingStory.glossary || [];
    const merged = [
      ...existing,
      ...candidates.filter((candidate) =>
        !existing.some((item) => item.wordEn.toLowerCase() === candidate.wordEn.toLowerCase())
      ),
    ];
    setEditingStory({ ...editingStory, glossary: merged });
    showToast(`Glosarium terdeteksi: ${merged.length} kata.`);
  };

  const handleGenerateTranslation = async () => {
    if (!editingStory) return;
    if (!adminPin) {
      showToast('PIN admin tidak tersedia untuk generate translation.');
      return;
    }

    setIsGeneratingTranslation(true);
    try {
      const data = await storybookApi.translateStory(adminPin, editingStory);

      const translations = Array.isArray(data.translations) ? data.translations : [];
      const translatedPages = editingStory.pages.map((page) => {
        const match = translations.find((item: { pageNumber?: number; titleEn?: string; textEn?: string }) => item.pageNumber === page.pageNumber);
        return match?.textEn
          ? { ...page, titleEn: match.titleEn || page.titleEn, textEn: match.textEn }
          : page;
      });

      setEditingStory({
        ...editingStory,
        titleEn: data.titleEn || editingStory.titleEn,
        pages: translatedPages,
        pipelineStatus: 'enhanced',
      });
      showToast(`Translation dibuat untuk ${translations.length} halaman.`);
    } catch (error) {
      console.error('Translation generation failed:', error);
      showToast(error instanceof Error ? error.message : 'Gagal membuat translation.');
    } finally {
      setIsGeneratingTranslation(false);
    }
  };

  const handleGenerateEnhancement = async (
    mode: 'illustration' | 'glossary' | 'quiz_interactions',
    pageNumber?: number
  ) => {
    if (!editingStory) return;
    if (!adminPin) {
      showToast('PIN admin tidak tersedia untuk generate enhancement.');
      return;
    }

    const sourcePages = pageNumber
      ? editingStory.pages.filter((page) => page.pageNumber === pageNumber)
      : editingStory.pages;

    if (sourcePages.length === 0) {
      showToast('Tidak ada halaman untuk diproses.');
      return;
    }

    setGeneratingEnhancement(mode);
    try {
      const data = await storybookApi.generateEnhancement(adminPin, editingStory, mode, sourcePages);

      if (mode === 'glossary') {
        setEditingStory({
          ...editingStory,
          glossary: Array.isArray(data.glossary) ? data.glossary : [],
          vocabularyQuiz: data.vocabularyQuiz || editingStory.vocabularyQuiz,
          pipelineStatus: 'enhanced',
        });
        showToast(`Glosarium AI dibuat: ${Array.isArray(data.glossary) ? data.glossary.length : 0} kata.`);
        return;
      }

      const enhancedPages = Array.isArray(data.pages) ? data.pages : [];
      const nextPages = editingStory.pages.map((page) => {
        const match = enhancedPages.find((item: { pageNumber?: number }) => item.pageNumber === page.pageNumber);
        if (!match) return page;

        if (mode === 'illustration') {
          return {
            ...page,
            illustrationType: match.illustrationType || page.illustrationType,
            illustrationPrompt: match.illustrationPrompt || page.illustrationPrompt,
          };
        }

        return {
          ...page,
          interactiveElements: match.interactiveElements || page.interactiveElements || [],
          quizQuestion: match.quizQuestion || page.quizQuestion,
        };
      });

      const nextStory: Story = {
        ...editingStory,
        pages: nextPages,
        pipelineStatus: mode === 'illustration' ? inferPipelineStatus(editingStory) : 'enhanced',
      };
      setEditingStory(nextStory);
      showToast(`Enhancement AI diperbarui untuk ${enhancedPages.length} halaman.`);
    } catch (error) {
      console.error('Enhancement generation failed:', error);
      showToast(error instanceof Error ? error.message : 'Gagal membuat enhancement.');
    } finally {
      setGeneratingEnhancement(null);
    }
  };

  const requestGeneratedStoryImage = async (
    story: Story,
    request: { imageKind: 'cover' } | { imageKind: 'page'; page: StoryPage }
  ): Promise<string> => {
    if (!adminPin) throw new Error('PIN admin tidak tersedia untuk generate gambar.');
    return storybookApi.generateImage(adminPin, story, request);
  };

  const handleGeneratePageImage = async (page: StoryPage, pageIndex: number) => {
    if (!editingStory) return;
    if (!adminPin) {
      showToast('PIN admin tidak tersedia untuk generate gambar.');
      return;
    }

    setGeneratingImagePageNumber(page.pageNumber);
    try {
      const imageUrl = await requestGeneratedStoryImage(editingStory, { imageKind: 'page', page });
      setEditingStory((currentStory) => {
        if (!currentStory) return currentStory;
        const nextPages = currentStory.pages.map((item, index) => index === pageIndex
          ? { ...item, imageUrl, illustrationType: 'custom' as const }
          : item
        );
        const hasAllImages = !isPlaceholderCover(currentStory.coverImage)
          && nextPages.every((item) => Boolean(item.imageUrl?.trim()));

        return {
          ...currentStory,
          pages: nextPages,
          pipelineStatus: hasAllImages ? 'illustrated' : 'story_complete',
        };
      });
      showToast(`Gambar halaman ${page.pageNumber} berhasil dibuat.`);
    } catch (error) {
      console.error('Page image generation failed:', error);
      showToast(error instanceof Error ? error.message : 'Gagal generate gambar halaman.');
    } finally {
      setGeneratingImagePageNumber(null);
    }
  };

  const handleGenerateAllImages = async () => {
    if (!editingStory) return;
    if (!adminPin) {
      showToast('PIN admin tidak tersedia untuk generate gambar.');
      return;
    }

    const shouldGenerateCover = isPlaceholderCover(editingStory.coverImage);
    const missingPages = editingStory.pages.filter((page) => !page.imageUrl?.trim());
    const total = (shouldGenerateCover ? 1 : 0) + missingPages.length;

    if (total === 0) {
      showToast('Cover dan semua gambar halaman sudah tersedia.');
      return;
    }

    let nextCoverImage = editingStory.coverImage;
    let nextPages = [...editingStory.pages];
    let completed = 0;
    setImageGenerationProgress({ completed, total, label: shouldGenerateCover ? 'Menyiapkan cover' : `Menyiapkan halaman ${missingPages[0].pageNumber}` });

    try {
      if (shouldGenerateCover) {
        nextCoverImage = await requestGeneratedStoryImage(editingStory, { imageKind: 'cover' });
        completed += 1;
        setEditingStory((currentStory) => currentStory ? {
          ...currentStory,
          coverImage: nextCoverImage,
          pipelineStatus: 'story_complete',
        } : currentStory);
        setImageGenerationProgress({ completed, total, label: 'Cover selesai' });
      }

      for (const page of missingPages) {
        setImageGenerationProgress({ completed, total, label: `Membuat halaman ${page.pageNumber} dari ${editingStory.pages.length}` });
        const imageUrl = await requestGeneratedStoryImage(editingStory, { imageKind: 'page', page });
        nextPages = nextPages.map((item) => item.pageNumber === page.pageNumber
          ? { ...item, imageUrl, illustrationType: 'custom' as const }
          : item
        );
        completed += 1;
        setEditingStory((currentStory) => currentStory ? {
          ...currentStory,
          coverImage: nextCoverImage,
          pages: currentStory.pages.map((item) => item.pageNumber === page.pageNumber
            ? { ...item, imageUrl, illustrationType: 'custom' as const }
            : item
          ),
          pipelineStatus: 'story_complete',
        } : currentStory);
        setImageGenerationProgress({ completed, total, label: `Halaman ${page.pageNumber} selesai` });
      }

      const allImagesReady = !isPlaceholderCover(nextCoverImage) && nextPages.every((page) => Boolean(page.imageUrl?.trim()));
      setEditingStory((currentStory) => currentStory ? {
        ...currentStory,
        coverImage: nextCoverImage,
        pipelineStatus: allImagesReady ? 'illustrated' : 'story_complete',
      } : currentStory);
      showToast(allImagesReady ? 'Cover dan semua gambar halaman selesai dibuat.' : `${completed} gambar selesai dibuat.`);
    } catch (error) {
      console.error('Bulk story image generation failed:', error);
      setEditingStory((currentStory) => currentStory ? {
        ...currentStory,
        coverImage: nextCoverImage,
        pipelineStatus: 'story_complete',
      } : currentStory);
      showToast(`${completed} dari ${total} gambar selesai. Klik lagi untuk melanjutkan.`);
    } finally {
      setImageGenerationProgress(null);
    }
  };

  const handleCanvasInteractionClick = (
    e: React.MouseEvent<HTMLDivElement>,
    page: StoryPage,
    pageIndex: number
  ) => {
    if (!interactionPlaceMode) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    const nextElement: InteractiveElement = {
      id: `elem_${Date.now()}`,
      type: 'character',
      label: 'Interaksi baru',
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
      animation: 'bounce',
      soundType: 'pop',
      dialogue: 'Halo!',
      emoji: '✨',
    };

    updateEditingPage(pageIndex, {
      ...page,
      interactiveElements: [...(page.interactiveElements || []), nextElement],
    });
    setInteractionPlaceMode(false);
    showToast('Interaksi ditaruh di canvas.');
  };

  const buildDraftStoryFromQuickCreate = (form: QuickCreateForm): Story => {
    const pageDrafts = splitManuscriptIntoPageDrafts(form.brief);
    const fallbackTitle = form.title.trim() || sentenceCaseTitle(form.brief, 'Buku Cerita Baru');
    const pages: StoryPage[] = pageDrafts.map((draft, index) => {
      const basePage = createBlankPage(index + 1);
      const illustrationType = inferIllustrationType(`${draft.title} ${draft.text}`);
      const generatedElements: InteractiveElement[] = index === 0
        ? [{
            id: `elem_${Date.now()}_${index}`,
            type: 'character',
            label: 'Tokoh utama',
            x: 50,
            y: 62,
            animation: 'bounce',
            soundType: 'chime',
            dialogue: 'Halo, ayo baca halaman ini.',
            emoji: '✨',
          }]
        : [];

      return {
        ...basePage,
        title: draft.title,
        titleEn: '',
        text: draft.text,
        textEn: '',
        illustrationType,
        illustrationPrompt: `A clear ${illustrationType} story scene with one focal action and expressive child-friendly characters.`,
        interactiveElements: generatedElements,
        quizQuestion: index === pageDrafts.length - 1
          ? {
              question: 'Apa pesan baik dari cerita ini?',
              options: ['Berani mencoba', 'Menyerah', 'Tidak peduli', 'Marah-marah'],
              answerIndex: 0,
              explanation: 'Cerita ini mengajak anak mencoba hal baik dengan berani dan lembut.',
            }
          : undefined,
      };
    });

    return {
      id: form.storyId || createStoryId(fallbackTitle),
      title: fallbackTitle,
      author: 'BacaYuk Studio',
      category: 'Petualangan',
      coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600',
      coverBg: 'from-warning to-warning',
      themeColor: 'amber',
      accentColor: 'orange',
      moralMessage: form.moralMessage.trim() || 'Setiap perjalanan menjadi lebih indah saat dijalani dengan berani dan hati baik.',
      targetAge: targetAgeLabel(form.targetAge),
      description: pages[0]?.text.slice(0, 150) || 'Draft buku cerita baru dari naskah yang ditempel.',
      status: 'draft',
      pipelineStatus: 'story_complete',
      accessStatus: 'free_member',
      downloadEnabled: true,
      ebookPrice: settings.defaultEbookPrice,
      watermarkEnabled: true,
      pages,
      glossary: extractGlossaryCandidates(form.brief),
    };
  };

  const buildDraftStoryFromAiDraft = (form: QuickCreateForm, draft: AiBookDraft): Story => {
    const rawPages = Array.isArray(draft.pages) && draft.pages.length > 0
      ? draft.pages
      : splitManuscriptIntoPageDrafts(form.brief);
    const pages: StoryPage[] = rawPages.slice(0, 12).map((page, index) => {
      const basePage = createBlankPage(index + 1);
      const title = page.title?.trim() || `Halaman ${index + 1}`;
      const text = page.text?.trim() || '';
      const illustrationType = page.illustrationType || inferIllustrationType(`${title} ${text}`);

      return {
        ...basePage,
        title,
        titleEn: page.titleEn?.trim() || '',
        text,
        textEn: page.textEn?.trim() || '',
        illustrationType,
        illustrationPrompt:
          page.illustrationPrompt?.trim() ||
          `A clear ${illustrationType} story scene with one focal action, expressive characters, and a child-safe colorful illustration style.`,
        interactiveElements: page.interactiveElements || [],
        quizQuestion: page.quizQuestion,
      };
    });
    return {
      id: form.storyId || createStoryId(draft.title || form.title || 'Buku Cerita Baru'),
      title: draft.title?.trim() || form.title.trim() || 'Buku Cerita Baru',
      author: 'BacaYuk Studio',
      category: draft.category?.trim() || 'Petualangan',
      coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600',
      coverBg: 'from-warning to-warning',
      themeColor: 'amber',
      accentColor: 'orange',
      moralMessage:
        draft.moralMessage?.trim() ||
        'Setiap perjalanan menjadi lebih indah saat dijalani dengan berani dan hati baik.',
      targetAge: targetAgeLabel(form.targetAge),
      description: draft.description?.trim() || pages[0]?.text.slice(0, 150) || 'Draft buku cerita baru dari AI.',
      status: 'draft',
      pipelineStatus: 'story_complete',
      accessStatus: 'free_member',
      downloadEnabled: true,
      ebookPrice: settings.defaultEbookPrice,
      watermarkEnabled: true,
      pages,
      glossary: draft.glossary || [],
      vocabularyQuiz: draft.vocabularyQuiz,
      productionGuide: draft.productionGuide,
    };
  };

  const extractTextFromPdfPageImage = async (imageBase64: string, storyId: string, storyTitle: string): Promise<string> => {
    if (!adminPin) throw new Error('PIN admin tidak tersedia untuk membaca PDF hasil scan.');
    return storybookApi.extractPdfPageText(adminPin, { imageBase64, storyId, storyTitle });
  };

  const handlePdfImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    return buildDraftStoryFromAiDraft(form, draft);
  };

  const openDraftStory = (draftStory: Story) => {
    setEditingStory(draftStory);
    setIsNewStory(true);
    setStoryFormErrors([]);
    setPreviewPageIndex(0);
    setShowAdvancedEditor(false);
    setInteractionPlaceMode(false);
    setShowQuickCreate(false);
    setQuickCreateForm(DEFAULT_QUICK_CREATE_FORM);
    setQuickCreateErrors([]);
    setShowQuickCreateAdvanced(false);
    setPdfImport(null);
    setPdfImportProgress(null);
  };

  const handleQuickCreateDraft = async (e: React.FormEvent) => {
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
        const draftStory = buildDraftStoryFromQuickCreate(normalizedForm);
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

  const normalizeStoryForSave = (story: Story): Story => {
    const pages = story.pages.map((page, index) => ({
      ...page,
      pageNumber: index + 1,
      title: page.title?.trim() || `Halaman ${index + 1}`,
      titleEn: page.titleEn?.trim(),
      text: page.text.trim(),
      textEn: page.textEn?.trim(),
      imageUrl: page.imageUrl?.trim(),
      illustrationType: page.illustrationType || 'forest',
      colors: page.colors || createBlankPage(index + 1).colors,
    }));
    const storyText = [
      story.title,
      story.description,
      story.moralMessage,
      ...pages.flatMap((page) => [page.title, page.titleEn || '', page.text, page.textEn || '']),
    ].join('\n');

    return {
      ...story,
      id: story.id.trim(),
      title: story.title.trim(),
      author: story.author.trim(),
      category: story.category.trim(),
      targetAge: story.targetAge.trim(),
      description: story.description.trim(),
      moralMessage: story.moralMessage.trim(),
      coverImage: story.coverImage.trim(),
      status: story.status || 'draft',
      pages,
      glossary: (story.glossary || []).filter(
        (item) =>
          item.wordEn.trim() &&
          item.translationId.trim() &&
          includesGlossaryTerm(storyText, [item.wordEn, item.translationId])
      ),
    };
  };

  const validateStory = (story: Story): string[] => {
    const errors: string[] = [];
    const normalized = normalizeStoryForSave(story);

    if (!normalized.title) errors.push('Judul buku wajib diisi.');
    if (!normalized.id.trim()) errors.push('ID buku wajib diisi.');
    if (!normalized.author) errors.push('Nama penulis wajib diisi.');
    if (!normalized.category) errors.push('Kategori wajib diisi.');
    if (!normalized.description) errors.push('Deskripsi singkat wajib diisi.');
    if (!normalized.coverImage) errors.push('URL cover wajib diisi.');
    if (normalized.downloadEnabled !== false && (normalized.ebookPrice || 0) < 0) {
      errors.push('Harga e-book tidak boleh negatif.');
    }
    if (normalized.pages.length === 0) errors.push('Buku minimal harus punya 1 halaman.');

    normalized.pages.forEach((page, index) => {
      if (!page.text) errors.push(`Teks Bahasa Indonesia halaman ${index + 1} masih kosong.`);
      if (
        page.illustrationType === 'custom' &&
        !page.illustrationPrompt?.trim() &&
        !page.customSvgPath?.trim() &&
        !page.imageUrl?.trim()
      ) {
        errors.push(`Halaman ${index + 1} bertipe custom perlu prompt ilustrasi, path SVG, atau image URL.`);
      }
    });

    return errors;
  };

  // Finance Filter
  const [financeTimeframe, setFinanceTimeframe] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');

  // Search queries
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [trxSearchQuery, setTrxSearchQuery] = useState('');

  // Handle saving global admin settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    adminStore.saveSettings(settings);
    showToast('Pengaturan berhasil disimpan.');
  };

  // Handle editing/saving story in CMS
  const handleSaveStoryCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStory) return;

    const errors = validateStory(editingStory);
    if (isNewStory && stories.some((story) => story.id === editingStory.id.trim())) {
      errors.push('ID buku sudah dipakai buku lain.');
    }
    if (errors.length > 0) {
      setStoryFormErrors(errors);
      showToast('Periksa kembali data buku.');
      return;
    }

    const normalizedStory = normalizeStoryForSave(editingStory);
    let updatedList: Story[];
    let successMessage: string;
    if (isNewStory) {
      updatedList = [normalizedStory, ...stories];
      successMessage = `Buku "${normalizedStory.title}" ditambahkan.`;
    } else {
      updatedList = stories.map((s) => (s.id === normalizedStory.id ? normalizedStory : s));
      successMessage = `Perubahan "${normalizedStory.title}" disimpan.`;
    }

    try {
      await onUpdateStories(updatedList);
      showToast(successMessage);
      setStoryFormErrors([]);
      setEditingStory(null);
    } catch {
      showToast('Tersimpan lokal, tetapi belum tersinkron ke Supabase. Periksa service role key/server.');
      setStoryFormErrors([]);
      setEditingStory(null);
    }
  };

  // Handle Adding New Coupon
  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;

    const code = newCouponCode.trim().toUpperCase();
    const newCoupon: DiscountCoupon = {
      code,
      type: newCouponType,
      value: Number(newCouponValue),
      usageCount: 0,
      isActive: true,
    };

    const updated = [newCoupon, ...coupons];
    setCoupons(updated);
    adminStore.saveCoupons(updated);
    setNewCouponCode('');
    setShowCouponForm(false);
    showToast(`Kupon ${code} dibuat.`);
  };

  // Toggle Coupon Active Status
  const handleToggleCoupon = (code: string) => {
    const updated = coupons.map((c) => (c.code === code ? { ...c, isActive: !c.isActive } : c));
    setCoupons(updated);
    adminStore.saveCoupons(updated);
  };

  // Delete Coupon
  const handleDeleteCoupon = (code: string) => {
    const updated = coupons.filter((c) => c.code !== code);
    setCoupons(updated);
    adminStore.saveCoupons(updated);
    showToast(`Kupon ${code} dihapus.`);
  };

  // Change Transaction Status
  const handleUpdateTrxStatus = (id: string, newStatus: 'success' | 'pending' | 'expired') => {
    adminStore.updateTransactionStatus(id, newStatus);
    const updated = adminStore.getTransactions();
    setTransactions(updated);
    showToast(`Status transaksi #${id} menjadi ${newStatus}.`);
  };

  // Export Users CSV
  const handleExportUsersCSV = () => {
    const headers = ['ID,Nama,Email,No_WhatsApp,Metode_Login,Tanggal_Daftar'];
    const rows = userList.map((u) =>
      `"${u.id}","${u.name}","${u.email}","${u.phone || '-'}","${u.loginMethod}","${u.createdAt}"`
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Database_OrangTua_BukuCerita_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Data orang tua diekspor ke CSV.');
  };

  // Calculate Financial Stats
  const successTrxs = transactions.filter((t) => t.status === 'success');
  const pendingTrxs = transactions.filter((t) => t.status === 'pending');
  const totalRevenue = successTrxs.reduce((sum, t) => sum + t.amount, 0);
  const totalAiCost = costEvents
    .filter((event) => event.event_type !== 'payment_fee')
    .reduce((sum, event) => sum + event.amount_idr, 0);
  const totalPaymentFee = costEvents
    .filter((event) => event.event_type === 'payment_fee')
    .reduce((sum, event) => sum + event.amount_idr, 0);
  const netProfit = totalRevenue - totalAiCost - totalPaymentFee;
  const storyCostRows = Object.values(costEvents.reduce<Record<string, {
    storyId: string;
    title: string;
    aiCost: number;
    paymentFee: number;
    imageCount: number;
  }>>((rows, event) => {
    const storyId = event.story_id || 'belum-tertaut';
    const row = rows[storyId] || {
      storyId,
      title: event.story_title || 'Biaya belum ditautkan ke buku',
      aiCost: 0,
      paymentFee: 0,
      imageCount: 0,
    };
    if (event.event_type === 'payment_fee') row.paymentFee += event.amount_idr;
    else row.aiCost += event.amount_idr;
    if (event.event_type === 'image_generation') row.imageCount += 1;
    rows[storyId] = row;
    return rows;
  }, {})).sort((a, b) => (b.aiCost + b.paymentFee) - (a.aiCost + a.paymentFee));

  return (
    <div className="min-h-screen w-full flex overflow-hidden animate-fade-in bg-background text-primary">
      
      {/* Toast Feedback */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 p-3 rounded-xl bg-brand-green text-white font-semibold text-xs shadow-xl animate-fade-in flex items-center gap-2 border border-white/20">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toast}</span>
        </div>
      )}

      {/* Sidebar Menu */}
      <aside className="w-20 sm:w-72 shrink-0 border-r border-default flex flex-col h-screen bg-surface">
        <div className="p-4 sm:p-6 border-b border-transparent">
          <div className="flex flex-col gap-2 items-center sm:items-start">
            <img src={bacaYukMark} alt="BacaYuk" className="h-11 w-11 sm:hidden" />
            <img src={bacaYukLogo} alt="BacaYuk" className="hidden h-12 w-auto max-w-full sm:block" />
            <div className="inline-flex items-center gap-2 text-[10px] font-bold text-secondary">
              <ShieldCheck className="w-4 h-4 text-brand-blue shrink-0" />
              <span className="hidden sm:inline">Ruang pengelola</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 sm:p-4 flex flex-col gap-2 overflow-y-auto">
          {[
            { id: 'cms', icon: BookOpen, label: 'Kelola buku' },
            { id: 'users', icon: Users, label: `Pengguna (${userList.length})` },
            { id: 'finance', icon: CreditCard, label: 'Pembayaran' },
            { id: 'costs', icon: ReceiptText, label: 'Biaya & margin' },
            { id: 'settings', icon: Settings, label: 'Pengaturan' },
            { id: 'analytics', icon: TrendingUp, label: 'Retensi baca' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => selectSection(item.id as AdminSection)}
              className={`w-full py-3 px-3 sm:px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center sm:justify-start gap-3 ${
                activeTab === item.id
                  ? 'bg-[var(--text-primary)] text-[var(--bg-surface)] shadow-sm'
                  : 'text-secondary hover:bg-surface-hover'
              }`}
              title={item.label}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-2 sm:p-4 border-t-2 border-transparent mt-auto">
          <button
            onClick={onBackToHome}
            className="w-full py-3 px-3 sm:px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center sm:justify-start gap-2 bg-surface/70 hover:bg-card text-secondary hover:text-primary border border-default"
            title="Tutup & Kembali"
          >
            <X className="w-5 h-5 shrink-0" />
            <span className="hidden sm:inline">Tutup & Kembali</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto p-5 sm:p-8 relative">
        <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-20">

        {/* TAB 1: Book management */}
        {activeTab === 'cms' && (
          <StoriesTab
            defaultEbookPrice={settings.defaultEbookPrice}
            stories={stories}
            onCreateWithAi={() => {
              setQuickCreateForm(DEFAULT_QUICK_CREATE_FORM);
              setQuickCreateErrors([]);
              setShowQuickCreateAdvanced(false);
              setPdfImport(null);
              setPdfImportProgress(null);
              setShowQuickCreate(true);
              onOpenQuickCreate?.();
            }}
            onCreateManually={() => {
              setEditingStory({
                id: `story_${Date.now()}`,
                title: 'Buku Cerita Baru',
                author: 'Penulis Cilik',
                category: 'Petualangan',
                coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600',
                coverBg: 'from-warning to-warning',
                themeColor: 'amber',
                accentColor: 'orange',
                moralMessage: 'Belajar dan bersabar membawa keberhasilan!',
                targetAge: '6-8 Tahun',
                description: 'Kisah seru yang penuh pesan kebaikan untuk anak.',
                status: 'draft',
                pipelineStatus: 'draft',
                accessStatus: 'free_member',
                downloadEnabled: true,
                ebookPrice: 15000,
                watermarkEnabled: true,
                pages: [{
                  pageNumber: 1,
                  text: 'Di sebuah desa yang indah, hiduplah seekor anak hewan yang rajin...',
                  illustrationType: 'forest',
                  colors: { bgGradFrom: 'from-brand-green', bgGradTo: 'to-warning', textBg: 'bg-card/80', accentColor: 'emerald', borderAccent: 'border-brand-green' },
                }],
              });
              setIsNewStory(true);
              setStoryFormErrors([]);
              setPreviewPageIndex(0);
              setShowAdvancedEditor(false);
              setInteractionPlaceMode(false);
            }}
            onEdit={(story) => {
              setEditingStory(story);
              setIsNewStory(false);
              setStoryFormErrors([]);
              setPreviewPageIndex(0);
              setShowAdvancedEditor(false);
              setInteractionPlaceMode(false);
              onOpenStoryEditor?.(story.id, 'edit');
            }}
            onDelete={async (story) => {
              if (!window.confirm(`Hapus buku "${story.title}" dari katalog?`)) return;
              try {
                await onUpdateStories(stories.filter((item) => item.id !== story.id));
                showToast(`Buku "${story.title}" dihapus.`);
              } catch {
                showToast('Buku dihapus dari data lokal, tetapi sinkron Supabase belum berhasil.');
              }
            }}
          />
        )}

        {activeTab === 'users' && <UsersTab users={userList} readingLogs={readingLogs} searchQuery={userSearchQuery} onSearchQueryChange={setUserSearchQuery} onExportCsv={handleExportUsersCSV} />}

        {activeTab === 'finance' && <FinanceTab totalRevenue={totalRevenue} successfulTransactions={successTrxs} pendingTransactions={pendingTrxs} transactions={transactions} coupons={coupons} showCouponForm={showCouponForm} newCouponCode={newCouponCode} newCouponType={newCouponType} newCouponValue={newCouponValue} onToggleCouponForm={() => setShowCouponForm(!showCouponForm)} onCouponCodeChange={setNewCouponCode} onCouponTypeChange={setNewCouponType} onCouponValueChange={setNewCouponValue} onCreateCoupon={handleCreateCoupon} onToggleCoupon={handleToggleCoupon} onDeleteCoupon={handleDeleteCoupon} onUpdateTransactionStatus={handleUpdateTrxStatus} />}

        {activeTab === 'costs' && <CostLedgerTab error={costLedgerError} totalRevenue={totalRevenue} totalAiCost={totalAiCost} totalPaymentFee={totalPaymentFee} netProfit={netProfit} storyRows={storyCostRows} onReload={() => void loadCostEvents()} />}

        {activeTab === 'settings' && <AdminSettingsTab settings={settings} cronStatus={cronStatus} onSettingsChange={setSettings} onCronStatusChange={setCronStatus} onTransactionsChange={setTransactions} onSubmit={handleSaveSettings} onToast={showToast} />}

        {activeTab === 'analytics' && <AnalyticsTab stories={stories} />}

        {showQuickCreate && (
          <QuickCreateDialog
            form={quickCreateForm}
            errors={quickCreateErrors}
            pdfImport={pdfImport}
            pdfImportProgress={pdfImportProgress}
            isExtractingPdf={isExtractingPdf}
            isGenerating={isGeneratingBookDraft}
            showAdvanced={showQuickCreateAdvanced}
            onFormChange={setQuickCreateForm}
            onAdvancedChange={setShowQuickCreateAdvanced}
            onPdfImport={handlePdfImport}
            onSubmit={handleQuickCreateDraft}
            onClose={() => {
              setShowQuickCreate(false);
              onCloseRouteAction?.();
            }}
          />
        )}

        {editingStory && (
          <StoryEditorDialog
            story={editingStory}
            isNewStory={isNewStory}
            settings={settings}
            errors={storyFormErrors}
            previewPageIndex={previewPageIndex}
            showAdvanced={showAdvancedEditor}
            interactionPlaceMode={interactionPlaceMode}
            isGeneratingTranslation={isGeneratingTranslation}
            generatingEnhancement={generatingEnhancement}
            generatingImagePageNumber={generatingImagePageNumber}
            imageGenerationProgress={imageGenerationProgress}
            onStoryChange={setEditingStory}
            onPreviewPageChange={setPreviewPageIndex}
            onAdvancedChange={setShowAdvancedEditor}
            onInteractionPlaceModeChange={setInteractionPlaceMode}
            onGenerateTranslation={handleGenerateTranslation}
            onGenerateEnhancement={handleGenerateEnhancement}
            onGeneratePageImage={handleGeneratePageImage}
            onGenerateAllImages={handleGenerateAllImages}
            onCanvasInteractionClick={handleCanvasInteractionClick}
            onRefreshGlossary={refreshGlossaryCandidates}
            renderPageImagePreview={renderPageImagePreview}
            onSubmit={handleSaveStoryCMS}
            onClose={() => {
              setEditingStory(null);
              onCloseRouteAction?.();
            }}
          />
        )}
        </div>
      </main>
    </div>
  );
};
