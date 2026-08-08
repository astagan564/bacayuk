import React, { useState, useEffect } from 'react';
import { InteractiveElement, Story, StoryPage } from '../types';
import {
  adminStore,
  AdminSettings,
  DiscountCoupon,
  TransactionRecord,
  UserReadingActivity,
} from '../utils/adminStore';
import { userAuthStore, UserAccount } from '../utils/userAuthStore';
import {
  X,
  BookOpen,
  Users,
  CreditCard,
  Settings,
  Plus,
  Trash2,
  Edit,
  Download,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Tag,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  Upload,
  Eye,
  RefreshCw,
  Sparkles,
  Search,
  Check,
  AlertCircle,
  Megaphone,
  Languages,
} from 'lucide-react';

interface AdminDashboardProps {
  stories: Story[];
  onUpdateStories: (updatedStories: Story[]) => void | Promise<void>;
  onBackToHome: () => void;
  adminPin?: string;
  isNight?: boolean;
}

interface QuickCreateForm {
  title: string;
  targetAge: string;
  primaryLanguage: 'id' | 'en';
  manuscript: string;
}

interface PageDraft {
  title: string;
  text: string;
}

interface AiBookDraftPage {
  title?: string;
  text?: string;
  textEn?: string;
  illustrationType?: StoryPage['illustrationType'];
  illustrationPrompt?: string;
  interactiveElements?: InteractiveElement[];
  quizQuestion?: StoryPage['quizQuestion'];
}

interface AiBookDraft {
  title?: string;
  category?: string;
  description?: string;
  moralMessage?: string;
  coverPrompt?: string;
  pages?: AiBookDraftPage[];
  glossary?: Story['glossary'];
  vocabularyQuiz?: Story['vocabularyQuiz'];
}

const DEFAULT_QUICK_CREATE_FORM: QuickCreateForm = {
  title: '',
  targetAge: '4-8 Tahun',
  primaryLanguage: 'id',
  manuscript: '',
};

const PIPELINE_STEPS: Array<{ id: NonNullable<Story['pipelineStatus']>; label: string }> = [
  { id: 'draft', label: 'Draft' },
  { id: 'story_complete', label: 'Story Complete' },
  { id: 'illustrated', label: 'Illustrated' },
  { id: 'enhanced', label: 'Enhanced' },
  { id: 'ready_to_publish', label: 'Ready to Publish' },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stories,
  onUpdateStories,
  onBackToHome,
  adminPin,
  isNight = false,
}) => {
  const [activeTab, setActiveTab] = useState<'cms' | 'users' | 'finance' | 'settings' | 'analytics'>('cms');
  const [cronStatus, setCronStatus] = useState<string | null>(null);

  // Admin Settings State
  const [settings, setSettings] = useState<AdminSettings>(() => adminStore.getSettings());
  // Coupons State
  const [coupons, setCoupons] = useState<DiscountCoupon[]>(() => adminStore.getCoupons());
  // Transactions State
  const [transactions, setTransactions] = useState<TransactionRecord[]>(() => adminStore.getTransactions());
  // Reading Logs
  const [readingLogs, setReadingLogs] = useState<UserReadingActivity[]>(() => adminStore.getReadingLogs());

  // Demo user accounts list
  const [userList, setUserList] = useState<UserAccount[]>(() => {
    const current = userAuthStore.getUser();
    const demoAccounts: UserAccount[] = [
      {
        id: 'usr_g_8812',
        name: 'Bunda Sarah',
        email: 'sarah.bunda@gmail.com',
        phone: '081298765432',
        loginMethod: 'google',
        createdAt: '2026-08-01T10:15:00Z',
      },
      {
        id: 'usr_wa_9941',
        name: 'Ayah Budi',
        email: 'budi.santoso@yahoo.com',
        phone: '081311223344',
        loginMethod: 'whatsapp',
        createdAt: '2026-08-03T14:22:00Z',
      },
      {
        id: 'usr_em_1204',
        name: 'Bunda Ratna',
        email: 'ratna.dewi@gmail.com',
        phone: '085712345678',
        loginMethod: 'email',
        createdAt: '2026-08-05T09:05:00Z',
      },
    ];

    if (current && !demoAccounts.some((a) => a.id === current.id || a.email === current.email)) {
      demoAccounts.unshift(current);
    }
    return demoAccounts;
  });

  // Story Uploader / Editor Modal State
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [isNewStory, setIsNewStory] = useState(false);
  const [storyFormErrors, setStoryFormErrors] = useState<string[]>([]);
  const [previewPageIndex, setPreviewPageIndex] = useState(0);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreateForm, setQuickCreateForm] = useState<QuickCreateForm>(DEFAULT_QUICK_CREATE_FORM);
  const [quickCreateErrors, setQuickCreateErrors] = useState<string[]>([]);
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
  const [interactionPlaceMode, setInteractionPlaceMode] = useState(false);
  const [isGeneratingTranslation, setIsGeneratingTranslation] = useState(false);
  const [isGeneratingBookDraft, setIsGeneratingBookDraft] = useState(false);
  const [generatingEnhancement, setGeneratingEnhancement] = useState<'illustration' | 'glossary' | 'quiz_interactions' | null>(null);
  const [generatingImagePageNumber, setGeneratingImagePageNumber] = useState<number | null>(null);

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

  const createBlankPage = (pageNumber: number): StoryPage => ({
    pageNumber,
    title: `Halaman ${pageNumber}`,
    text: '',
    textEn: '',
    illustrationType: 'forest',
    colors: {
      bgGradFrom: 'from-emerald-100',
      bgGradTo: 'to-amber-100',
      textBg: 'bg-white/80',
      accentColor: 'emerald',
      borderAccent: 'border-emerald-300',
    },
  });

  const createStoryId = (title: string): string => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 42);
    return `${slug || 'buku-baru'}-${Date.now()}`;
  };

  const sentenceCaseTitle = (sentence: string, fallback: string): string => {
    const cleaned = sentence
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/[*_`>#]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleaned) return fallback;
    const words = cleaned.split(' ').slice(0, 5).join(' ');
    return words.charAt(0).toUpperCase() + words.slice(1).replace(/[.!?,;:]$/, '');
  };

  const splitTextIntoSentences = (text: string): string[] => {
    return text
      .replace(/\r\n/g, '\n')
      .split('\n')
      .flatMap((line) => {
        const trimmed = line.trim();
        if (/^[-*+]\s+/.test(trimmed) || /^\d+[.)]\s+/.test(trimmed) || /^>\s+/.test(trimmed)) {
          return [trimmed];
        }
        return trimmed.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [trimmed];
      })
      .map((sentence) => sentence.replace(/[ \t]+/g, ' ').trim())
      .filter(Boolean);
  };

  const chunkSentences = (sentences: string[], targetPageCount: number): string[] => {
    const pages: string[] = [];
    const sentencesPerPage = Math.max(1, Math.ceil(sentences.length / targetPageCount));

    for (let i = 0; i < sentences.length; i += sentencesPerPage) {
      pages.push(sentences.slice(i, i + sentencesPerPage).join(' '));
    }

    return pages;
  };

  const splitManuscriptIntoPageDrafts = (manuscript: string): PageDraft[] => {
    const markdownSections: PageDraft[] = [];
    let currentTitle = '';
    let currentLines: string[] = [];

    manuscript.split(/\r?\n/).forEach((line) => {
      const headingMatch = line.match(/^\s{0,3}#{1,3}\s+(.+?)\s*#*\s*$/);
      if (headingMatch) {
        if (currentTitle || currentLines.some((item) => item.trim())) {
          const text = currentLines.join('\n').trim();
          if (text) {
            markdownSections.push({
              title: currentTitle || sentenceCaseTitle(text, `Halaman ${markdownSections.length + 1}`),
              text,
            });
          }
        }
        currentTitle = headingMatch[1].trim();
        currentLines = [];
        return;
      }

      currentLines.push(line);
    });

    if (currentTitle || currentLines.some((item) => item.trim())) {
      const text = currentLines.join('\n').trim();
      if (text) {
        markdownSections.push({
          title: currentTitle || sentenceCaseTitle(text, `Halaman ${markdownSections.length + 1}`),
          text,
        });
      }
    }

    if (markdownSections.length > 0) {
      const totalSentences = markdownSections.reduce((sum, section) => {
        return sum + splitTextIntoSentences(section.text).length;
      }, 0);
      const targetPageCount = Math.min(12, Math.max(8, Math.ceil(totalSentences / 2)));
      const averageSentencesPerPage = Math.max(1, Math.ceil(totalSentences / targetPageCount));

      const pageDrafts = markdownSections.flatMap((section) => {
        const sectionSentences = splitTextIntoSentences(section.text);
        const sectionPageCount = Math.max(1, Math.ceil(sectionSentences.length / averageSentencesPerPage));
        return chunkSentences(sectionSentences, sectionPageCount).map((text, index) => ({
          title: index === 0 ? section.title : `${section.title} ${index + 1}`,
          text,
        }));
      });

      return pageDrafts.slice(0, 12);
    }

    const paragraphs = manuscript
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    const cleanSentences = paragraphs.length > 1
      ? paragraphs.flatMap(splitTextIntoSentences)
      : splitTextIntoSentences(manuscript);
    const targetPageCount = Math.min(12, Math.max(8, Math.ceil(cleanSentences.length / 2)));
    const pages = chunkSentences(cleanSentences, targetPageCount);

    return pages.slice(0, 12).map((text, index) => ({
      title: sentenceCaseTitle(text, `Halaman ${index + 1}`),
      text,
    }));
  };

  const inferIllustrationType = (text: string): StoryPage['illustrationType'] => {
    const lower = text.toLowerCase();
    if (/laut|pantai|ombak|ikan|perahu|sungai|danau|hujan/.test(lower)) return 'sea';
    if (/bintang|bulan|langit|planet|roket|angkasa|awan/.test(lower)) return 'space';
    if (/naga|ajaib|sihir|peri|cahaya|kristal/.test(lower)) return 'dragon';
    if (/istana|raja|ratu|putri|pangeran|menara/.test(lower)) return 'castle';
    if (/kebun|bunga|taman|kupu|lebah/.test(lower)) return 'garden';
    return 'forest';
  };

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const includesGlossaryTerm = (text: string, values: string[]) =>
    values
      .map((value) => value.trim())
      .filter(Boolean)
      .some((value) => new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(value)}([^\\p{L}\\p{N}]|$)`, 'iu').test(text));

  const extractGlossaryCandidates = (manuscript: string) => {
    const terms = [
      { id: 'forest', wordEn: 'Forest', translationId: 'Hutan', phonetic: 'for-est', emoji: '🌲', aliases: ['hutan'] },
      { id: 'river', wordEn: 'River', translationId: 'Sungai', phonetic: 'ri-ver', emoji: '💧', aliases: ['sungai'] },
      { id: 'friend', wordEn: 'Friend', translationId: 'Sahabat', phonetic: 'frend', emoji: '🤝', aliases: ['sahabat', 'teman'] },
      { id: 'rabbit', wordEn: 'Rabbit', translationId: 'Kelinci', phonetic: 'rab-bit', emoji: '🐰', aliases: ['kelinci'] },
      { id: 'butterfly', wordEn: 'Butterfly', translationId: 'Kupu-kupu', phonetic: 'but-ter-fly', emoji: '🦋', aliases: ['kupu-kupu', 'kupu'] },
      { id: 'star', wordEn: 'Star', translationId: 'Bintang', phonetic: 'star', emoji: '⭐', aliases: ['bintang'] },
      { id: 'tree', wordEn: 'Tree', translationId: 'Pohon', phonetic: 'tree', emoji: '🌳', aliases: ['pohon'] },
      { id: 'flower', wordEn: 'Flower', translationId: 'Bunga', phonetic: 'flow-er', emoji: '🌼', aliases: ['bunga'] },
      { id: 'dragon', wordEn: 'Dragon', translationId: 'Naga', phonetic: 'dra-gon', emoji: '🐉', aliases: ['naga'] },
      { id: 'castle', wordEn: 'Castle', translationId: 'Istana', phonetic: 'cas-tle', emoji: '🏰', aliases: ['istana'] },
      { id: 'sea', wordEn: 'Sea', translationId: 'Laut', phonetic: 'see', emoji: '🌊', aliases: ['laut'] },
      { id: 'light', wordEn: 'Light', translationId: 'Cahaya', phonetic: 'light', emoji: '✨', aliases: ['cahaya'] },
    ];

    return terms
      .filter((term) => includesGlossaryTerm(manuscript, term.aliases))
      .slice(0, 12)
      .map(({ aliases, ...term }) => term);
  };

  const inferPipelineStatus = (story: Story): NonNullable<Story['pipelineStatus']> => {
    if (story.pipelineStatus) return story.pipelineStatus;
    const hasStory = story.pages.length > 0 && story.pages.every((page) => page.text.trim());
    const hasIllustrations = story.pages.length > 0 && story.pages.every((page) => page.illustrationType || page.illustrationPrompt);
    const hasEnhancements = Boolean(
      story.glossary?.length ||
      story.pages.some((page) => page.textEn || page.quizQuestion || page.interactiveElements?.length)
    );

    if (story.status === 'published') return 'ready_to_publish';
    if (hasEnhancements) return 'enhanced';
    if (hasIllustrations) return 'illustrated';
    if (hasStory) return 'story_complete';
    return 'draft';
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
      const response = await fetch('/api/admin/translate-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': adminPin,
        },
        body: JSON.stringify({
          title: editingStory.title,
          pages: editingStory.pages.map((page) => ({
            pageNumber: page.pageNumber,
            title: page.title,
            text: page.text,
          })),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Gagal membuat translation.');
      }

      const translations = Array.isArray(data.translations) ? data.translations : [];
      const translatedPages = editingStory.pages.map((page) => {
        const match = translations.find((item: { pageNumber?: number }) => item.pageNumber === page.pageNumber);
        return match?.textEn ? { ...page, textEn: match.textEn } : page;
      });

      setEditingStory({
        ...editingStory,
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
      const response = await fetch('/api/admin/generate-book-enhancement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': adminPin,
        },
        body: JSON.stringify({
          mode,
          title: editingStory.title,
          targetAge: editingStory.targetAge,
          pages: sourcePages.map((page) => ({
            pageNumber: page.pageNumber,
            title: page.title,
            text: page.text,
            illustrationType: page.illustrationType,
          })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Gagal membuat enhancement.');
      }

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

      setEditingStory({
        ...editingStory,
        pages: nextPages,
        pipelineStatus: mode === 'illustration' ? 'illustrated' : 'enhanced',
      });
      showToast(`Enhancement AI diperbarui untuk ${enhancedPages.length} halaman.`);
    } catch (error) {
      console.error('Enhancement generation failed:', error);
      showToast(error instanceof Error ? error.message : 'Gagal membuat enhancement.');
    } finally {
      setGeneratingEnhancement(null);
    }
  };

  const handleGeneratePageImage = async (page: StoryPage, pageIndex: number) => {
    if (!editingStory) return;
    if (!adminPin) {
      showToast('PIN admin tidak tersedia untuk generate gambar.');
      return;
    }

    setGeneratingImagePageNumber(page.pageNumber);
    try {
      const response = await fetch('/api/admin/generate-page-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': adminPin,
        },
        body: JSON.stringify({
          storyId: editingStory.id,
          storyTitle: editingStory.title,
          targetAge: editingStory.targetAge,
          pageNumber: page.pageNumber,
          pageTitle: page.title,
          pageText: page.text,
          illustrationType: page.illustrationType,
          illustrationPrompt: page.illustrationPrompt,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Gagal generate gambar halaman.');
      }

      updateEditingPage(pageIndex, {
        ...page,
        imageUrl: data.imageUrl,
        illustrationType: 'custom',
      });
      showToast(`Gambar halaman ${page.pageNumber} berhasil dibuat.`);
    } catch (error) {
      console.error('Page image generation failed:', error);
      showToast(error instanceof Error ? error.message : 'Gagal generate gambar halaman.');
    } finally {
      setGeneratingImagePageNumber(null);
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
    const pageDrafts = splitManuscriptIntoPageDrafts(form.manuscript);
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
        text: draft.text,
        textEn: '',
        illustrationType,
        illustrationPrompt: `${illustrationType} scene for "${draft.title}"`,
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
      id: createStoryId(form.title),
      title: form.title.trim(),
      author: 'BacaYuk Studio',
      category: 'Petualangan',
      coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600',
      coverBg: 'from-amber-400 to-orange-500',
      themeColor: 'amber',
      accentColor: 'orange',
      moralMessage: 'Setiap perjalanan menjadi lebih indah saat dijalani dengan berani dan hati baik.',
      targetAge: form.targetAge,
      description: pages[0]?.text.slice(0, 150) || 'Draft buku cerita baru dari naskah yang ditempel.',
      status: 'draft',
      pipelineStatus: 'story_complete',
      accessStatus: 'free_member',
      downloadEnabled: true,
      ebookPrice: settings.defaultEbookPrice,
      watermarkEnabled: true,
      pages,
      glossary: extractGlossaryCandidates(form.manuscript),
    };
  };

  const buildDraftStoryFromAiDraft = (form: QuickCreateForm, draft: AiBookDraft): Story => {
    const rawPages = Array.isArray(draft.pages) && draft.pages.length > 0
      ? draft.pages
      : splitManuscriptIntoPageDrafts(form.manuscript);
    const pages: StoryPage[] = rawPages.slice(0, 12).map((page, index) => {
      const basePage = createBlankPage(index + 1);
      const title = page.title?.trim() || `Halaman ${index + 1}`;
      const text = page.text?.trim() || '';
      const illustrationType = page.illustrationType || inferIllustrationType(`${title} ${text}`);

      return {
        ...basePage,
        title,
        text,
        textEn: page.textEn?.trim() || '',
        illustrationType,
        illustrationPrompt:
          page.illustrationPrompt?.trim() ||
          `${title}: ${text.slice(0, 180)} Child-safe colorful storybook illustration.`,
        interactiveElements: page.interactiveElements || [],
        quizQuestion: page.quizQuestion,
      };
    });
    const hasEnhancements = Boolean(
      draft.glossary?.length ||
      draft.vocabularyQuiz?.questions?.length ||
      pages.some((page) => page.quizQuestion || page.interactiveElements?.length)
    );

    return {
      id: createStoryId(draft.title || form.title),
      title: draft.title?.trim() || form.title.trim(),
      author: 'BacaYuk Studio',
      category: draft.category?.trim() || 'Petualangan',
      coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600',
      coverBg: 'from-amber-400 to-orange-500',
      themeColor: 'amber',
      accentColor: 'orange',
      moralMessage:
        draft.moralMessage?.trim() ||
        'Setiap perjalanan menjadi lebih indah saat dijalani dengan berani dan hati baik.',
      targetAge: form.targetAge,
      description: draft.description?.trim() || pages[0]?.text.slice(0, 150) || 'Draft buku cerita baru dari AI.',
      status: 'draft',
      pipelineStatus: hasEnhancements ? 'enhanced' : 'illustrated',
      accessStatus: 'free_member',
      downloadEnabled: true,
      ebookPrice: settings.defaultEbookPrice,
      watermarkEnabled: true,
      pages,
      glossary: draft.glossary || [],
      vocabularyQuiz: draft.vocabularyQuiz,
    };
  };

  const createDraftWithAi = async (form: QuickCreateForm): Promise<Story> => {
    if (!adminPin) {
      throw new Error('PIN admin tidak tersedia untuk AI draft.');
    }

    const response = await fetch('/api/admin/generate-book-draft', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': adminPin,
      },
      body: JSON.stringify(form),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'Gagal membuat draft buku dengan AI.');
    }

    return buildDraftStoryFromAiDraft(form, data.draft || {});
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
  };

  const handleQuickCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: string[] = [];
    if (!quickCreateForm.title.trim()) errors.push('Judul buku wajib diisi.');
    if (!quickCreateForm.targetAge.trim()) errors.push('Kelompok umur wajib diisi.');
    if (quickCreateForm.manuscript.trim().length < 120) {
      errors.push('Naskah cerita terlalu pendek untuk dipecah menjadi draft buku.');
    }

    if (errors.length > 0) {
      setQuickCreateErrors(errors);
      return;
    }

    const normalizedForm = {
      ...quickCreateForm,
      title: quickCreateForm.title.trim(),
      targetAge: quickCreateForm.targetAge.trim(),
      manuscript: quickCreateForm.manuscript.trim(),
    };

    setIsGeneratingBookDraft(true);
    try {
      const draftStory = await createDraftWithAi(normalizedForm);
      openDraftStory(draftStory);
      showToast(`Draft AI "${draftStory.title}" siap direview.`);
    } catch (error) {
      console.error('AI book draft failed, using local fallback:', error);
      const draftStory = buildDraftStoryFromQuickCreate(normalizedForm);
      openDraftStory(draftStory);
      showToast('AI draft belum berhasil, jadi dibuat draft lokal untuk direview.');
    } finally {
      setIsGeneratingBookDraft(false);
    }
  };

  const normalizeStoryForSave = (story: Story): Story => {
    const pages = story.pages.map((page, index) => ({
      ...page,
      pageNumber: index + 1,
      title: page.title?.trim() || `Halaman ${index + 1}`,
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
      ...pages.flatMap((page) => [page.title, page.text, page.textEn || '']),
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

  return (
    <div className={`min-h-screen w-full flex overflow-hidden animate-fade-in ${
      isNight ? 'night-paper text-slate-100' : 'app-paper text-[var(--ink)]'
    }`}>
      
      {/* Toast Feedback */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 p-3 rounded-xl bg-[var(--story-green)] text-white font-semibold text-xs shadow-xl animate-fade-in flex items-center gap-2 border border-white/20">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toast}</span>
        </div>
      )}

      {/* Sidebar Menu */}
      <aside className={`w-20 sm:w-72 shrink-0 border-r flex flex-col h-screen ${
        isNight ? 'bg-[#101923]/95 border-blue-900/60' : 'bg-[#fffaf0]/95 border-[#eadbc1]'
      }`}>
        <div className="p-4 sm:p-6 border-b border-transparent">
          <div className="flex flex-col gap-2 items-center sm:items-start">
            <div className="inline-flex items-center gap-2 text-[10px] font-bold text-[var(--muted-ink)] dark:text-blue-200">
              <ShieldCheck className="w-4 h-4 text-[var(--magic-blue)] shrink-0" />
              <span className="hidden sm:inline">Ruang pengelola</span>
            </div>
            <h2 className="hidden sm:block text-xl leading-tight mb-0">BacaYuk</h2>
          </div>
        </div>

        <nav className="flex-1 p-2 sm:p-4 flex flex-col gap-2 overflow-y-auto">
          {[
            { id: 'cms', icon: BookOpen, label: 'Kelola buku' },
            { id: 'users', icon: Users, label: `Pengguna (${userList.length})` },
            { id: 'finance', icon: CreditCard, label: 'Pembayaran' },
            { id: 'settings', icon: Settings, label: 'Pengaturan' },
            { id: 'analytics', icon: TrendingUp, label: 'Retensi baca' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full py-3 px-3 sm:px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center sm:justify-start gap-3 ${
                activeTab === item.id
                  ? 'bg-[var(--ink)] text-[#fff7e6] shadow-sm dark:bg-blue-100 dark:text-[#101923]'
                  : 'text-[var(--muted-ink)] dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'
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
            className="w-full py-3 px-3 sm:px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center sm:justify-start gap-2 bg-white/70 hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-700 text-[var(--muted-ink)] dark:text-slate-200 border border-[#eadbc1] dark:border-slate-700"
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
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl mb-1">Kelola buku ({stories.length})</h3>
                <p className="text-xs text-[var(--muted-ink)] dark:text-slate-400 font-medium">
                  Atur akses baca, unduhan offline, harga, dan stempel lisensi.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setQuickCreateForm(DEFAULT_QUICK_CREATE_FORM);
                    setQuickCreateErrors([]);
                    setShowQuickCreate(true);
                  }}
                  className="btn-primary py-2.5 px-4 text-xs flex items-center gap-1.5 shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Buat Draft Buku</span>
                </button>
                <button
                  onClick={() => {
                    setEditingStory({
                      id: `story_${Date.now()}`,
                      title: 'Buku Cerita Baru',
                      author: 'Penulis Cilik',
                      category: 'Petualangan',
                      coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600',
                      coverBg: 'from-amber-400 to-orange-500',
                      themeColor: 'amber',
                      accentColor: 'orange',
                      moralMessage: 'Belajar dan bersabar membawa keberhasilan!',
                      targetAge: '4-8 Tahun',
                      description: 'Kisah seru yang penuh pesan kebaikan untuk anak.',
                      status: 'draft',
                      pipelineStatus: 'draft',
                      accessStatus: 'free_member',
                      downloadEnabled: true,
                      ebookPrice: 15000,
                      watermarkEnabled: true,
                      pages: [
                        {
                          pageNumber: 1,
                          text: 'Di sebuah desa yang indah, hiduplah seekor anak hewan yang rajin...',
                          illustrationType: 'forest',
                          colors: {
                            bgGradFrom: 'from-emerald-100',
                            bgGradTo: 'to-amber-100',
                            textBg: 'bg-white/80',
                            accentColor: 'emerald',
                            borderAccent: 'border-emerald-300',
                          },
                        },
                      ],
                    });
                    setIsNewStory(true);
                    setStoryFormErrors([]);
                    setPreviewPageIndex(0);
                    setShowAdvancedEditor(false);
                    setInteractionPlaceMode(false);
                  }}
                  className="py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 shrink-0 bg-white/70 hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-700 text-[var(--muted-ink)] dark:text-slate-200 border border-[#eadbc1] dark:border-slate-700 font-bold transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Manual</span>
                </button>
              </div>
            </div>

            {/* Story Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stories.map((story, idx) => {
                const status = story.accessStatus || (idx === 0 ? 'free_guest' : 'free_member');
                const downloadOk = story.downloadEnabled !== false;
                const price = story.ebookPrice || settings.defaultEbookPrice;

                return (
                  <div
                    key={story.id}
                    className="p-4 rounded-xl border bg-white/80 dark:bg-slate-800/80 border-[#eadbc1] dark:border-blue-900/60 flex items-start gap-4 shadow-sm hover:shadow-md transition-all"
                  >
                    <img
                      src={story.coverImage}
                      alt={story.title}
                      className="w-20 h-28 object-cover rounded-lg shadow-sm shrink-0 border border-[#eadbc1]"
                    />

                    <div className="flex-1 flex flex-col justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          {status === 'free_guest' && (
                            <span className="px-2 py-0.5 rounded-md bg-[var(--story-green)]/15 text-[var(--story-green)] text-[10px] font-bold border border-[var(--story-green)]/30">
                              Gratis tanpa login
                            </span>
                          )}
                          {status === 'free_member' && (
                            <span className="px-2 py-0.5 rounded-md bg-[var(--warm-gold)]/20 text-[#8a5e12] dark:text-amber-300 text-[10px] font-bold border border-[var(--warm-gold)]/35">
                              Gratis setelah login
                            </span>
                          )}
                          {status === 'paid' && (
                            <span className="px-2 py-0.5 rounded-md bg-[var(--magic-blue)]/15 text-[var(--magic-blue)] dark:text-blue-300 text-[10px] font-bold border border-[var(--magic-blue)]/30">
                              Berbayar
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            story.status === 'draft'
                              ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700'
                              : 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300'
                          }`}>
                            {story.status === 'draft' ? 'Draft' : 'Published'}
                          </span>

                          {downloadOk ? (
                            <span className="px-2 py-0.5 rounded-md bg-white/70 text-[var(--muted-ink)] dark:bg-slate-900 dark:text-blue-200 text-[10px] font-bold">
                              Unduh Rp {price.toLocaleString('id-ID')}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-[var(--rose)]/15 text-[var(--rose)] text-[10px] font-bold">
                              Unduh dikunci
                            </span>
                          )}
                        </div>

                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                          {story.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {story.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
                        <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                          {story.pages.length} halaman
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingStory({ ...story, accessStatus: status, downloadEnabled: downloadOk, ebookPrice: price });
                              setIsNewStory(false);
                              setStoryFormErrors([]);
                              setPreviewPageIndex(0);
                              setShowAdvancedEditor(false);
                              setInteractionPlaceMode(false);
                            }}
                            className="p-1.5 rounded-lg bg-[var(--magic-blue)]/10 text-[var(--magic-blue)] dark:text-blue-200 hover:bg-[var(--magic-blue)]/18 font-bold transition-colors flex items-center gap-1"
                            title="Edit Buku Cerita"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={async () => {
                              if (!window.confirm(`Hapus buku "${story.title}" dari katalog?`)) return;
                              try {
                                await onUpdateStories(stories.filter((item) => item.id !== story.id));
                                showToast(`Buku "${story.title}" dihapus.`);
                              } catch {
                                showToast('Buku dihapus dari data lokal, tetapi sinkron Supabase belum berhasil.');
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-300 hover:bg-rose-500/18 font-bold transition-colors flex items-center gap-1"
                            title="Hapus Buku Cerita"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: USER MANAGEMENT & READING LOGS */}
        {activeTab === 'users' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl mb-1">Orang tua terdaftar ({userList.length})</h3>
                <p className="text-xs text-[var(--muted-ink)] dark:text-slate-400 font-medium">
                  Pantau akun orang tua, kontak, dan aktivitas membaca keluarga.
                </p>
              </div>

              <button
                onClick={handleExportUsersCSV}
                className="btn-primary py-2.5 px-4 text-xs flex items-center gap-2 shrink-0"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Ekspor CSV (Mailchimp/Kirim.Email)</span>
              </button>
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan nama, email, atau nomor WhatsApp..."
                className="w-full pl-10 pr-3 py-2 rounded-xl border border-amber-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* User List Table */}
            <div className="rounded-2xl border border-amber-200 dark:border-indigo-800 overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#fff7e6] dark:bg-slate-700/80 text-[var(--muted-ink)] dark:text-blue-100 font-bold text-[10px]">
                    <tr>
                      <th className="p-3">Nama Orang Tua</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">No. WhatsApp</th>
                      <th className="p-3">Metode Login</th>
                      <th className="p-3">Tanggal Daftar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100 dark:divide-slate-700 font-medium">
                    {userList
                      .filter(
                        (u) =>
                          u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                          (u.phone && u.phone.includes(userSearchQuery))
                      )
                      .map((u) => (
                        <tr key={u.id} className="hover:bg-amber-50/50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{u.name}</td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">{u.email}</td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">{u.phone || '-'}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-bold uppercase">
                              {u.loginMethod}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 dark:text-slate-400">
                            {new Date(u.createdAt).toLocaleDateString('id-ID')}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reading Logs Section */}
            <div className="flex flex-col gap-3 pt-4 border-t border-amber-200/50">
              <h3 className="text-base font-extrabold font-sans mb-1 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>Riwayat Aktivitas Membaca (Real-Time Reading Logs)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {readingLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-amber-500/10 dark:bg-slate-800 border border-amber-300 dark:border-indigo-800 flex flex-col gap-1 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-200">
                      <span>{log.userName}</span>
                      <span className="text-[10px] font-normal text-slate-500">
                        {new Date(log.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 font-semibold truncate">
                      📖 {log.storyTitle}
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-500">Halaman {log.lastPageRead} dari {log.totalPages}</span>
                      {log.isCompleted ? (
                        <span className="text-[var(--story-green)] font-bold">Selesai</span>
                      ) : (
                        <span className="text-[#8a5e12] font-bold">Sedang dibaca</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FINANCIAL REPORT & COUPON MANAGER */}
        {activeTab === 'finance' && (
          <div className="flex flex-col gap-6">
            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="book-panel p-4 rounded-xl flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between text-[var(--muted-ink)] dark:text-blue-200 text-xs font-bold">
                  <span>Total pendapatan</span>
                  <DollarSign className="w-5 h-5 text-[var(--story-green)]" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold tabular-nums">
                  Rp {totalRevenue.toLocaleString('id-ID')}
                </div>
                <div className="text-[11px] text-[var(--muted-ink)] dark:text-blue-200 font-medium">
                  Dari {successTrxs.length} transaksi berhasil
                </div>
              </div>

              <div className="book-panel p-4 rounded-xl flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between text-[var(--muted-ink)] dark:text-blue-200 text-xs font-bold">
                  <span>Menunggu pembayaran</span>
                  <Clock className="w-5 h-5 text-[var(--warm-gold)]" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold tabular-nums">
                  {pendingTrxs.length} transaksi
                </div>
                <div className="text-[11px] text-[var(--muted-ink)] dark:text-blue-200 font-medium">
                  Belum selesai dibayar
                </div>
              </div>

              <div className="book-panel p-4 rounded-xl flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between text-[var(--muted-ink)] dark:text-blue-200 text-xs font-bold">
                  <span>Konversi pesanan</span>
                  <TrendingUp className="w-5 h-5 text-[var(--magic-blue)]" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold tabular-nums">
                  {transactions.length > 0
                    ? Math.round((successTrxs.length / transactions.length) * 100)
                    : 0}
                  %
                </div>
                <div className="text-[11px] text-[var(--muted-ink)] dark:text-blue-200 font-medium">
                  {successTrxs.length} dari {transactions.length} total pesanan
                </div>
              </div>
            </div>

            {/* Coupons Section */}
            <div className="p-4 rounded-xl border border-[#eadbc1] dark:border-blue-900/60 bg-white/80 dark:bg-slate-800/80 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold font-sans mb-1 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[var(--warm-gold)]" />
                    <span>Kupon diskon</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Buat kode promo untuk pembelian buku dan langganan.
                  </p>
                </div>

                <button
                  onClick={() => setShowCouponForm(!showCouponForm)}
                  className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showCouponForm ? 'Batal' : 'Buat kupon'}</span>
                </button>
              </div>

              {/* Create Coupon Form */}
              {showCouponForm && (
                <form
                  onSubmit={handleCreateCoupon}
                  className="p-3 rounded-xl bg-[#fff7e6] dark:bg-slate-700/50 border border-[#eadbc1] dark:border-blue-900/60 flex flex-col sm:flex-row items-end gap-3 animate-fade-in text-xs"
                >
                  <div className="flex-1 w-full">
                    <label className="font-bold block mb-1">Kode kupon</label>
                    <input
                      type="text"
                      value={newCouponCode}
                      onChange={(e) => setNewCouponCode(e.target.value)}
                      placeholder="Contoh: BUKUANAK20"
                      className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white dark:bg-slate-800 font-bold uppercase"
                      required
                    />
                  </div>

                  <div className="w-full sm:w-36">
                    <label className="font-bold block mb-1">Jenis Diskon</label>
                    <select
                      value={newCouponType}
                      onChange={(e) => setNewCouponType(e.target.value as 'percent' | 'fixed')}
                      className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white dark:bg-slate-800 font-bold"
                    >
                      <option value="percent">Persentase (%)</option>
                      <option value="fixed">Potongan (Rp)</option>
                    </select>
                  </div>

                  <div className="w-full sm:w-32">
                    <label className="font-bold block mb-1">Nilai Diskon</label>
                    <input
                      type="number"
                      value={newCouponValue}
                      onChange={(e) => setNewCouponValue(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white dark:bg-slate-800 font-bold"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto py-2 px-4 rounded-lg bg-[var(--story-green)] hover:bg-[#27795b] text-white font-bold text-xs shadow-sm"
                  >
                    Simpan Kupon
                  </button>
                </form>
              )}

              {/* Coupons List */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {coupons.map((c) => (
                  <div
                    key={c.code}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs shadow-sm ${
                      c.isActive
                        ? 'bg-amber-50 dark:bg-slate-700 border-amber-300 dark:border-indigo-700'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-300 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="font-black text-sm text-amber-900 dark:text-amber-200">
                        {c.code}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        Diskon {c.type === 'percent' ? `${c.value}%` : `Rp ${c.value.toLocaleString('id-ID')}`} • Terpakai {c.usageCount}x
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleCoupon(c.code)}
                        className={`p-1.5 rounded-lg text-[10px] font-bold ${
                          c.isActive ? 'bg-emerald-500/20 text-emerald-700' : 'bg-slate-300 text-slate-700'
                        }`}
                        title="Aktifkan/Nonaktifkan Kupon"
                      >
                        {c.isActive ? 'Aktif' : 'Off'}
                      </button>

                      <button
                        onClick={() => handleDeleteCoupon(c.code)}
                        className="p-1.5 rounded-lg bg-rose-500/20 text-rose-700 hover:bg-rose-500/30 transition-colors"
                        title="Hapus Kupon"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transactions Log Table */}
            <div className="flex flex-col gap-3">
              <h3 className="text-base font-extrabold font-sans mb-1 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span>Riwayat Transaksi Penagihan (Midtrans Log)</span>
              </h3>

              <div className="rounded-2xl border border-amber-200 dark:border-indigo-800 overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#fff7e6] dark:bg-slate-700/80 text-[var(--muted-ink)] dark:text-blue-100 font-bold text-[10px]">
                      <tr>
                        <th className="p-3">ID Transaksi</th>
                        <th className="p-3">Pembeli</th>
                        <th className="p-3">Buku Cerita</th>
                        <th className="p-3">Metode</th>
                        <th className="p-3">Jumlah (Rp)</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Aksi Simu Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100 dark:divide-slate-700 font-medium">
                      {transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-amber-50/50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="p-3 font-mono font-bold text-amber-900 dark:text-amber-200">{t.id}</td>
                          <td className="p-3">
                            <div className="font-bold">{t.customerName}</div>
                            <div className="text-[10px] text-slate-500">{t.customerEmail}</div>
                          </td>
                          <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{t.storyTitle}</td>
                          <td className="p-3 uppercase font-bold text-[10px]">{t.paymentMethod}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                            Rp {t.amount.toLocaleString('id-ID')}
                          </td>
                          <td className="p-3">
                            {t.status === 'success' && (
                              <span className="px-2 py-0.5 rounded-md bg-[var(--story-green)]/15 text-[var(--story-green)] font-bold text-[10px]">
                                Berhasil
                              </span>
                            )}
                            {t.status === 'pending' && (
                              <span className="px-2 py-0.5 rounded-md bg-[var(--warm-gold)]/20 text-[#8a5e12] dark:text-amber-300 font-bold text-[10px]">
                                Menunggu
                              </span>
                            )}
                            {t.status === 'expired' && (
                              <span className="px-2 py-0.5 rounded-md bg-[var(--rose)]/15 text-[var(--rose)] font-bold text-[10px]">
                                ❌ EXPIRED
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {t.status === 'pending' && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleUpdateTrxStatus(t.id, 'success')}
                                  className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px]"
                                  title="Tandai Sudah Bayar (Lunas)"
                                >
                                  Bayar
                                </button>
                                <button
                                  onClick={() => handleUpdateTrxStatus(t.id, 'expired')}
                                  className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px]"
                                  title="Tandai Kedaluwarsa"
                                >
                                  Expired
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GLOBAL SYSTEM & CHILD EYE HEALTH SETTINGS */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="flex flex-col gap-6">
            <div className="p-4 rounded-2xl border-2 border-amber-300 dark:border-indigo-800 bg-white dark:bg-slate-800 flex flex-col gap-4">
              <h3 className="text-base font-black flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>Pengaturan Kesehatan Anak & Waktu Aturan "20-20-20"</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Interval Pengingat Istirahat Mata Anak (Menit)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={60}
                    value={settings.eyeRestIntervalMinutes}
                    onChange={(e) =>
                      setSettings({ ...settings, eyeRestIntervalMinutes: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-indigo-700 bg-amber-50/50 dark:bg-slate-900 font-bold"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Sistem akan secara otomatis memunculkan animasi pengingat istirahat mata setiap {settings.eyeRestIntervalMinutes} menit membaca tanpa henti.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Batas Waktu Masa Aktif Link Unduh E-Book (Jam)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={168}
                    value={settings.downloadLinkExpireHours}
                    onChange={(e) =>
                      setSettings({ ...settings, downloadLinkExpireHours: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-indigo-700 bg-amber-50/50 dark:bg-slate-900 font-bold"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Link unduhan PDF & EPUB setelah pembelian akan otomatis hangus setelah {settings.downloadLinkExpireHours} jam.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Harga Standar E-Book Unduhan Offline (Rp)
                  </label>
                  <input
                    type="number"
                    step={1000}
                    value={settings.defaultEbookPrice}
                    onChange={(e) =>
                      setSettings({ ...settings, defaultEbookPrice: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-indigo-700 bg-amber-50/50 dark:bg-slate-900 font-bold"
                  />
                </div>

                <div className="flex flex-col justify-center">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Perlindungan Hak Cipta (Social Watermarking)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={settings.enableGlobalWatermark}
                      onChange={(e) =>
                        setSettings({ ...settings, enableGlobalWatermark: e.target.checked })
                      }
                      className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                    />
                    <span className="font-bold text-xs text-amber-900 dark:text-amber-200">
                      Otomatis sematkan stempel Lisensi Resmi dengan Nama & Email pembeli pada file PDF/EPUB
                    </span>
                  </label>
                </div>

                {/* Anti-Right Click & Copy Protection Toggle */}
                <div className="reader-soft-panel flex flex-col justify-center col-span-1 md:col-span-2 p-3 rounded-xl">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    🔒 Fitur Anti-Right Click & Copy Protection (Perlindungan Konten E-Book)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={settings.enableCopyProtection ?? true}
                      onChange={(e) =>
                        setSettings({ ...settings, enableCopyProtection: e.target.checked })
                      }
                      className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                    />
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      Aktifkan pencegahan Klik Kanan, Blokir Kombinasi Tombol Ctrl+S / Inspect Element, & Matikan Seleksi Teks saat anak membaca cerita.
                    </span>
                  </label>
                </div>

                {/* Promo Banner Settings */}
                <div className="reader-soft-panel col-span-1 md:col-span-2 p-4 rounded-xl flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <label className="font-black text-purple-900 dark:text-purple-200 flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>Manajemen Spanduk / Banner Pengumuman Promo Katalog</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={settings.promoBannerActive ?? true}
                        onChange={(e) =>
                          setSettings({ ...settings, promoBannerActive: e.target.checked })
                        }
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <span className="font-bold text-xs text-purple-800 dark:text-purple-300">
                        Tampilkan Banner
                      </span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={settings.promoBannerText ?? ''}
                    onChange={(e) =>
                      setSettings({ ...settings, promoBannerText: e.target.value })
                    }
                    placeholder="Contoh: 🎉 Promo Hari Anak: Diskon Unduhan 50% dengan Kupon BUKUANAK20!"
                    className="w-full px-3 py-2 rounded-xl border border-purple-300 dark:border-indigo-700 bg-white dark:bg-slate-800 font-bold text-xs text-slate-900 dark:text-white"
                  />
                  <p className="text-[11px] text-slate-500">
                    Spanduk pengumuman promo akan muncul di halaman katalog utama e-book tanpa perlu mengubah kode web.
                  </p>
                </div>

                {/* Cron Job Cleanup Tool */}
                <div className="reader-soft-panel col-span-1 md:col-span-2 p-4 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="font-black text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin-slow" />
                        <span>Pembersihan Link Kedaluwarsa Otomatis (Cron Job Engine)</span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Sistem cron job di latar belakang otomatis menghapus file sementara watermark & menandai link transaksi yang lewat {settings.downloadLinkExpireHours} jam.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const res = adminStore.runCronJobCleanup();
                        setCronStatus(`[${res.timestamp}] ${res.message}`);
                        showToast(`🧹 Pembersihan Cron Job berhasil! ${res.purgedCount} link kedaluwarsa dibersihkan.`);
                        setTransactions(adminStore.getTransactions());
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Jalankan Cron Pembersihan Otomatis Sekarang</span>
                    </button>
                  </div>

                  {cronStatus && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
                      {cronStatus}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white font-black text-sm shadow-xl transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Simpan Semua Pengaturan Sistem Global</span>
            </button>
          </form>
        )}

        {/* TAB 5: ANALISIS RETENSI MEMBACA (DROP-OFF ANALYTICS) */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col gap-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white shadow-xl flex items-center justify-between flex-wrap gap-4 border border-indigo-500/40">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Evaluasi Bisnis & Daya Tarik Konten</span>
                </span>
                <h3 className="text-xl font-black">Analisis Retensi Membaca (Drop-off Analytics)</h3>
                <p className="text-xs text-indigo-200 mt-1 max-w-2xl">
                  Laporan statistik per-halaman untuk mengetahui di halaman berapa anak-anak berhenti/meninggalkan bacaan, sehingga penulis/desainer dapat merevisi bagian cerita yang kurang menarik.
                </p>
              </div>
            </div>

            {/* Stories Drop-off Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adminStore.getDropoffAnalytics(stories).map((analytics) => (
                <div
                  key={analytics.storyId}
                  className="p-5 rounded-2xl border-2 border-amber-200 dark:border-indigo-800 bg-white dark:bg-slate-800 shadow-md flex flex-col gap-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-amber-100 dark:border-indigo-900 pb-3">
                    <div>
                      <h4 className="font-black text-base text-slate-900 dark:text-white">
                        {analytics.storyTitle}
                      </h4>
                      <div className="text-xs text-slate-500 font-semibold flex flex-wrap items-center gap-2 mt-0.5">
                        <span>Total Pembaca: <strong>{analytics.totalReaders} Anak</strong></span>
                        <span>•</span>
                        <span>Selesai: <strong>{analytics.completedCount} Anak ({analytics.completionRate}%)</strong></span>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black shrink-0 ${
                        analytics.completionRate >= 70
                          ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                          : analytics.completionRate >= 40
                          ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                          : 'bg-rose-500/20 text-rose-800 dark:text-rose-300'
                      }`}
                    >
                      {analytics.completionRate >= 70 ? '🌟 Sangat Disukai' : analytics.completionRate >= 40 ? '👍 Cukup Menarik' : '⚠️ Perlu Revisi'}
                    </span>
                  </div>

                  {/* Hotspot Drop-off Alert */}
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-slate-900 border border-amber-300 dark:border-amber-700/60 flex items-center gap-3 text-xs">
                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-300 font-black">
                      Halaman {analytics.biggestDropPage}
                    </div>
                    <div>
                      <div className="font-black text-amber-950 dark:text-amber-200">
                        Titik Drop-off Terbesar
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        Sebagian besar pembaca berhenti di <strong>Halaman {analytics.biggestDropPage}</strong> dari total {analytics.totalPages} halaman. Disarankan merevisi ilustrasi / kalimat di halaman ini.
                      </div>
                    </div>
                  </div>

                  {/* Page-by-Page Reading Funnel */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                      Grafik Corong Retensi Per Halaman:
                    </span>
                    <div className="flex flex-col gap-1 text-[11px] font-bold">
                      {analytics.pageCounts.map((count, idx) => {
                        const pct = Math.round((count / analytics.totalReaders) * 100);
                        return (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="w-16 shrink-0 text-slate-500">Hal {idx + 1}</span>
                            <div className="flex-1 h-3.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden p-0.5">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-12 text-right shrink-0 text-slate-700 dark:text-slate-300 font-black">
                              {pct}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Create modal */}
        {showQuickCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
            <div className="reader-modal w-full max-w-3xl rounded-[1.35rem] p-5 sm:p-6 relative my-auto flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start sm:items-center justify-between gap-3 pb-3 border-b reader-divider">
                <div>
                  <div className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-black text-[var(--story-green)] dark:text-emerald-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Quick Create</span>
                  </div>
                  <h3 className="text-lg font-black">Buat draft buku dari naskah</h3>
                  <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--muted-ink)] dark:text-slate-300">
                    Tempel cerita lengkap, lalu BacaYuk menyiapkan halaman, scene ilustrasi, glosarium kandidat, kuis, dan ide interaksi untuk direview.
                  </p>
                </div>
                <button
                  onClick={() => setShowQuickCreate(false)}
                  className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  type="button"
                  aria-label="Tutup quick create"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleQuickCreateDraft} className="flex flex-col gap-4 text-xs font-semibold">
                {quickCreateErrors.length > 0 && (
                  <div className="rounded-2xl border border-rose-300 bg-rose-50 p-3 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                    <div className="flex items-center gap-2 font-black mb-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>Perlu dilengkapi dulu</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 font-semibold">
                      {quickCreateErrors.map((error) => (
                        <li key={error}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_12rem_12rem] gap-3">
                  <div>
                    <label className="block font-bold mb-1">Judul</label>
                    <input
                      type="text"
                      value={quickCreateForm.title}
                      onChange={(e) => setQuickCreateForm({ ...quickCreateForm, title: e.target.value })}
                      className="reader-field w-full px-3 py-2 rounded-xl font-bold"
                      placeholder="Kiko dan Hutan Kristal"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Kelompok umur</label>
                    <input
                      type="text"
                      value={quickCreateForm.targetAge}
                      onChange={(e) => setQuickCreateForm({ ...quickCreateForm, targetAge: e.target.value })}
                      className="reader-field w-full px-3 py-2 rounded-xl"
                      placeholder="4-8 Tahun"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Bahasa utama</label>
                    <select
                      value={quickCreateForm.primaryLanguage}
                      onChange={(e) => setQuickCreateForm({ ...quickCreateForm, primaryLanguage: e.target.value as QuickCreateForm['primaryLanguage'] })}
                      className="reader-field w-full px-3 py-2 rounded-xl"
                    >
                      <option value="id">Indonesia</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">Naskah cerita</label>
                  <textarea
                    rows={12}
                    value={quickCreateForm.manuscript}
                    onChange={(e) => setQuickCreateForm({ ...quickCreateForm, manuscript: e.target.value })}
                    className="reader-field w-full px-3 py-3 rounded-xl leading-6"
                    placeholder="Tempel cerita lengkap di sini. Gunakan paragraf atau kalimat biasa, nanti sistem akan memecahnya menjadi halaman buku."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  {[
                    '8-12 halaman',
                    'Judul per halaman',
                    'Scene ilustrasi',
                    'Glosarium & kuis',
                  ].map((item) => (
                    <div key={item} className="reader-soft-panel rounded-xl p-3 flex items-center gap-2 text-[11px] font-black">
                      <Check className="w-4 h-4 text-[var(--story-green)] shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t reader-divider">
                  <p className="text-[11px] leading-5 text-[var(--muted-ink)] dark:text-slate-300">
                    Draft tetap berstatus belum terbit. Setelah dibuat, kamu akan masuk ke editor untuk review dan koreksi.
                  </p>
                  <button
                    type="submit"
                    disabled={isGeneratingBookDraft}
                    className="btn-primary py-3 px-5 text-xs flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-60 disabled:cursor-wait"
                  >
                    {isGeneratingBookDraft ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>{isGeneratingBookDraft ? 'Membuat Draft...' : 'Buat Draft Buku'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Story editor sub-modal */}
        {editingStory && (
          <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/80 backdrop-blur-md animate-fade-in overflow-hidden">
            <div
              className="reader-modal w-full max-w-none h-[100dvh] rounded-none p-4 sm:p-6 relative flex flex-col gap-5 overflow-y-auto"
            >
              <div className="flex items-start sm:items-center justify-between gap-3 pb-3 border-b reader-divider">
                <h3 className="text-lg font-black">
                  {isNewStory ? 'Tambah buku cerita' : `Edit buku: "${editingStory.title}"`}
                </h3>
                <button
                  onClick={() => setEditingStory(null)}
                  className="p-2 rounded-full hover:bg-black/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveStoryCMS} className="flex flex-col gap-4 text-xs font-semibold">
                {storyFormErrors.length > 0 && (
                  <div className="rounded-2xl border border-rose-300 bg-rose-50 p-3 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                    <div className="flex items-center gap-2 font-black mb-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>Perlu diperbaiki sebelum disimpan</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 font-semibold">
                      {storyFormErrors.map((error) => (
                        <li key={error}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <section className="reader-soft-panel rounded-2xl p-3.5 flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-black uppercase text-[var(--muted-ink)] dark:text-blue-200">
                        Status produksi buku
                      </span>
                      <p className="mt-1 text-[11px] leading-5 text-[var(--muted-ink)] dark:text-slate-300">
                        Buku tetap draft sampai kamu publish, tetapi pipeline ini membantu melacak kesiapan konten.
                      </p>
                    </div>
                    <select
                      value={inferPipelineStatus(editingStory)}
                      onChange={(e) =>
                        setEditingStory({
                          ...editingStory,
                          pipelineStatus: e.target.value as NonNullable<Story['pipelineStatus']>,
                        })
                      }
                      className="reader-field rounded-xl px-3 py-2 text-[11px] font-black"
                    >
                      {PIPELINE_STEPS.map((step) => (
                        <option key={step.id} value={step.id}>
                          {step.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {PIPELINE_STEPS.map((step) => {
                      const activeIndex = PIPELINE_STEPS.findIndex((item) => item.id === inferPipelineStatus(editingStory));
                      const stepIndex = PIPELINE_STEPS.findIndex((item) => item.id === step.id);
                      return (
                        <div
                          key={step.id}
                          className={`rounded-xl px-2.5 py-2 text-[10px] font-black border ${
                            stepIndex <= activeIndex
                              ? 'bg-[var(--story-green)]/12 border-[var(--story-green)]/35 text-[var(--story-green)]'
                              : 'bg-white/45 dark:bg-slate-900/45 border-[#eadbc1] dark:border-blue-900/60 text-[var(--muted-ink)] dark:text-slate-300'
                          }`}
                        >
                          {step.label}
                        </div>
                      );
                    })}
                  </div>
                </section>

                {editingStory.pages.length > 0 && (() => {
                  const pageIndex = Math.min(previewPageIndex, editingStory.pages.length - 1);
                  const page = editingStory.pages[pageIndex];
                  const updatePage = (nextPage: StoryPage) => {
                    const newPages = [...editingStory.pages];
                    newPages[pageIndex] = nextPage;
                    setEditingStory({ ...editingStory, pages: newPages });
                  };

                  return (
                    <section className="reader-soft-panel rounded-2xl overflow-hidden border border-[#eadbc1] dark:border-blue-900/60">
                      <div className="grid grid-cols-1 xl:grid-cols-[14rem_minmax(32rem,1fr)_18rem] min-h-[42rem] xl:h-[calc(100dvh-15rem)]">
                        <aside className="border-b xl:border-b-0 xl:border-r border-[#eadbc1] dark:border-blue-900/60 bg-white/45 dark:bg-slate-950/30 p-3 overflow-hidden">
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="font-black text-[11px] text-[var(--muted-ink)] dark:text-blue-200">
                              Halaman
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const nextPage = createBlankPage(editingStory.pages.length + 1);
                                setEditingStory({ ...editingStory, pages: [...editingStory.pages, nextPage] });
                                setPreviewPageIndex(editingStory.pages.length);
                              }}
                              className="px-2 py-1 rounded-lg bg-[var(--story-green)] text-white font-black text-[10px]"
                            >
                              + Halaman
                            </button>
                          </div>
                          <div className="flex xl:flex-col gap-2 overflow-x-auto xl:overflow-x-hidden xl:overflow-y-auto xl:max-h-[calc(100dvh-20rem)] pr-1">
                            {editingStory.pages.map((pageItem, idx) => (
                              <button
                                key={`${pageItem.pageNumber}-${idx}`}
                                type="button"
                                onClick={() => setPreviewPageIndex(idx)}
                                className={`min-w-32 lg:min-w-0 text-left rounded-xl p-2 transition-all ${
                                  pageIndex === idx
                                    ? 'bg-[var(--story-green)] text-white shadow-sm'
                                    : 'bg-white/70 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-900 text-[var(--ink)] dark:text-slate-100'
                                }`}
                              >
                                <span className="block text-[10px] font-black opacity-75">
                                  {idx === 0 ? 'Cover' : `Halaman ${idx + 1}`}
                                </span>
                                <span className="mt-1 block text-[11px] font-black line-clamp-2">
                                  {pageItem.title || sentenceCaseTitle(pageItem.text, `Halaman ${idx + 1}`)}
                                </span>
                              </button>
                            ))}
                          </div>
                        </aside>

                        <div className="p-4 sm:p-5 bg-[#fffaf0]/70 dark:bg-slate-950/50 min-w-0">
                          <div className="h-full min-h-[38rem] rounded-2xl border border-[#eadbc1] dark:border-blue-900/60 bg-gradient-to-br from-emerald-100 to-amber-100 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-6 flex flex-col gap-4">
                            <div className="shrink-0">
                              <input
                                value={page.title || ''}
                                onChange={(e) => updatePage({ ...page, title: e.target.value })}
                                className="w-full bg-transparent text-xl sm:text-2xl font-black outline-none placeholder:text-slate-500/70"
                                placeholder={`Judul halaman ${pageIndex + 1}`}
                              />
                              <textarea
                                value={page.text}
                                onChange={(e) => updatePage({ ...page, text: e.target.value })}
                                rows={5}
                                className="mt-4 w-full resize-none rounded-2xl bg-white/70 dark:bg-slate-950/70 p-4 text-sm leading-7 font-bold text-slate-800 dark:text-slate-100 outline-none border border-white/70 dark:border-blue-900/50"
                                placeholder="Teks cerita halaman ini"
                              />
                            </div>
                            <div
                              onClick={(e) => handleCanvasInteractionClick(e, page, pageIndex)}
                              className={`relative flex-1 min-h-[20rem] rounded-2xl bg-white/65 dark:bg-slate-950/70 overflow-hidden border border-white/70 dark:border-blue-900/50 ${
                                interactionPlaceMode ? 'cursor-crosshair ring-2 ring-[var(--story-green)]' : ''
                              }`}
                            >
                              {renderPageImagePreview(page, 'absolute inset-0 opacity-95')}
                              {page.imageUrl && <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />}
                              <div className="relative z-10 p-4">
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <span className="text-[10px] font-black text-[var(--story-green)] dark:text-emerald-300">
                                  Illustration canvas
                                </span>
                                <span className="text-[10px] font-black text-[var(--muted-ink)] dark:text-blue-200">
                                  {page.illustrationType}
                                </span>
                              </div>
                              <p className={`text-xs leading-5 ${page.imageUrl ? 'text-white font-bold drop-shadow' : 'text-[var(--muted-ink)] dark:text-slate-300'}`}>
                                {page.illustrationPrompt || `Scene ${page.illustrationType} untuk halaman ini.`}
                              </p>
                              </div>
                              {(page.interactiveElements || []).map((element) => (
                                <button
                                  key={element.id}
                                  type="button"
                                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--story-green)] px-2 py-1 text-xs font-black text-white shadow-md"
                                  style={{ left: `${element.x}%`, top: `${element.y}%` }}
                                  title={`${element.label} (${element.x}%, ${element.y}%)`}
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  {element.emoji || '✨'}
                                </button>
                              ))}
                              {interactionPlaceMode && (
                                <div className="absolute inset-x-3 bottom-3 rounded-xl bg-[var(--story-green)] px-3 py-2 text-[11px] font-black text-white shadow-lg">
                                  Klik area canvas untuk menaruh interaksi.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <aside className="border-t xl:border-t-0 xl:border-l border-[#eadbc1] dark:border-blue-900/60 bg-white/45 dark:bg-slate-950/30 p-4 flex flex-col gap-3 overflow-y-auto">
                          <div>
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <label className="block text-[10px] font-black text-[var(--muted-ink)] dark:text-blue-200">
                                Illustration
                              </label>
                              <button
                                type="button"
                                onClick={() => handleGenerateEnhancement('illustration', page.pageNumber)}
                                disabled={generatingEnhancement === 'illustration'}
                                className="rounded-lg bg-[var(--story-green)]/12 px-2 py-1 text-[10px] font-black text-[var(--story-green)] disabled:opacity-50 dark:text-emerald-200"
                              >
                                {generatingEnhancement === 'illustration' ? 'Generating...' : 'Regenerate'}
                              </button>
                            </div>
                            <select
                              value={page.illustrationType}
                              onChange={(e) => updatePage({ ...page, illustrationType: e.target.value as StoryPage['illustrationType'] })}
                              className="reader-field w-full p-2 text-[11px] rounded-lg"
                            >
                              <option value="forest">Forest</option>
                              <option value="dragon">Dragon / magic</option>
                              <option value="space">Space</option>
                              <option value="sea">Sea</option>
                              <option value="castle">Castle</option>
                              <option value="garden">Garden</option>
                              <option value="custom">Custom</option>
                            </select>
                            <input
                              type="url"
                              value={page.imageUrl || ''}
                              onChange={(e) => updatePage({ ...page, imageUrl: e.target.value })}
                              className="reader-field mt-2 w-full p-2 text-[11px] rounded-lg"
                              placeholder="Image URL hasil generate / asset"
                            />
                            <button
                              type="button"
                              onClick={() => handleGeneratePageImage(page, pageIndex)}
                              disabled={generatingImagePageNumber === page.pageNumber}
                              className="mt-2 w-full rounded-lg bg-[var(--magic-blue)] px-3 py-2 text-[11px] font-black text-white disabled:opacity-60 disabled:cursor-wait"
                            >
                              {generatingImagePageNumber === page.pageNumber ? 'Generate gambar...' : 'Generate gambar halaman'}
                            </button>
                          </div>
                          <div>
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <label className="block text-[10px] font-black text-[var(--muted-ink)] dark:text-blue-200">
                                Translation
                              </label>
                              <button
                                type="button"
                                onClick={handleGenerateTranslation}
                                disabled={isGeneratingTranslation}
                                className="rounded-lg bg-[var(--magic-blue)]/12 px-2 py-1 text-[10px] font-black text-[var(--magic-blue)] disabled:opacity-50 dark:text-blue-200"
                              >
                                {isGeneratingTranslation ? 'Generating...' : 'Generate'}
                              </button>
                            </div>
                            <textarea
                              value={page.textEn || ''}
                              onChange={(e) => updatePage({ ...page, textEn: e.target.value })}
                              rows={5}
                              className="reader-field w-full p-2 text-[11px] rounded-lg leading-5"
                              placeholder="Draft English translation"
                            />
                          </div>
                          <div className="reader-soft-panel rounded-xl p-3 flex flex-col gap-2 text-[11px]">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-black">Enhancements</span>
                              <span className="font-black text-[var(--story-green)] dark:text-emerald-300">
                                Review
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span>Interaksi</span>
                              <span>{page.interactiveElements?.length || 0}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span>Kuis</span>
                              <span>{page.quizQuestion ? 'Ada' : '-'}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleGenerateEnhancement('quiz_interactions', page.pageNumber)}
                              disabled={generatingEnhancement === 'quiz_interactions'}
                              className="mt-1 rounded-lg bg-[var(--magic-blue)]/12 px-2 py-2 text-[10px] font-black text-[var(--magic-blue)] disabled:opacity-50 dark:text-blue-200"
                            >
                              {generatingEnhancement === 'quiz_interactions' ? 'Generating...' : 'Regenerate kuis & interaksi'}
                            </button>
                          </div>
                          <p className="text-[11px] leading-5 text-[var(--muted-ink)] dark:text-slate-300">
                            Pengaturan detail tetap tersedia di bagian Advanced di bawah.
                          </p>
                          <button
                            type="button"
                            onClick={() => setInteractionPlaceMode((value) => !value)}
                            className={`rounded-xl px-3 py-2 text-[11px] font-black transition-all ${
                              interactionPlaceMode
                                ? 'bg-[var(--story-green)] text-white'
                                : 'reader-field text-[var(--ink)] dark:text-slate-100'
                            }`}
                          >
                            {interactionPlaceMode ? 'Batal taruh interaksi' : '+ Klik canvas untuk interaction'}
                          </button>
                        </aside>
                      </div>
                    </section>
                  );
                })()}

                <section className="reader-soft-panel rounded-2xl p-3.5 flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-black text-xs text-[var(--muted-ink)] dark:text-blue-200">
                        Glosarium terdeteksi — {editingStory.glossary?.length || 0} kata
                      </span>
                      <p className="mt-1 text-[11px] leading-5 text-[var(--muted-ink)] dark:text-slate-300">
                        Approve kata yang layak masuk kamus sentuh. Kata yang dihapus tidak ikut tersimpan.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleGenerateEnhancement('glossary')}
                        disabled={generatingEnhancement === 'glossary'}
                        className="rounded-xl bg-[var(--story-green)]/12 px-3 py-2 text-[11px] font-black text-[var(--story-green)] disabled:opacity-50 dark:text-emerald-200"
                      >
                        {generatingEnhancement === 'glossary' ? 'Generating...' : 'Generate AI'}
                      </button>
                      <button
                        type="button"
                        onClick={refreshGlossaryCandidates}
                        className="rounded-xl bg-[var(--magic-blue)]/12 px-3 py-2 text-[11px] font-black text-[var(--magic-blue)] dark:text-blue-200"
                      >
                        Generate ulang
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingStory({ ...editingStory, glossary: [] })}
                        className="rounded-xl bg-rose-500/10 px-3 py-2 text-[11px] font-black text-rose-600 dark:text-rose-300"
                      >
                        Kosongkan
                      </button>
                    </div>
                  </div>
                  {(editingStory.glossary || []).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      {(editingStory.glossary || []).map((item) => (
                        <label
                          key={item.id}
                          className="reader-field rounded-xl p-2.5 flex items-center gap-2 text-[11px] cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked
                            onChange={() =>
                              setEditingStory({
                                ...editingStory,
                                glossary: (editingStory.glossary || []).filter((entry) => entry.id !== item.id),
                              })
                            }
                          />
                          <span className="text-base leading-none">{item.emoji || '•'}</span>
                          <span className="min-w-0">
                            <span className="block font-black truncate">{item.wordEn}</span>
                            <span className="block text-[var(--muted-ink)] dark:text-slate-300 truncate">
                              {item.translationId}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[#eadbc1] dark:border-blue-900/60 p-4 text-center text-[11px] font-bold text-[var(--muted-ink)] dark:text-slate-300">
                      Belum ada kandidat glosarium. Klik Generate ulang setelah teks halaman siap.
                    </div>
                  )}
                </section>

                <button
                  type="button"
                  onClick={() => setShowAdvancedEditor((value) => !value)}
                  className="reader-soft-panel rounded-2xl p-3.5 flex items-center justify-between gap-3 text-left"
                >
                  <span>
                    <span className="block text-xs font-black text-[var(--ink)] dark:text-slate-100">
                      Advanced editor
                    </span>
                    <span className="mt-1 block text-[11px] font-bold text-[var(--muted-ink)] dark:text-slate-300">
                      Metadata, akses, halaman detail, kuis, koordinat X/Y, glosarium manual, dan narasi.
                    </span>
                  </span>
                  <span className="rounded-lg bg-white/70 px-3 py-1 text-[11px] font-black dark:bg-slate-900">
                    {showAdvancedEditor ? 'Sembunyikan' : 'Buka'}
                  </span>
                </button>

                {showAdvancedEditor && (
                  <>
                <div>
                  <label className="block font-bold mb-1">Judul Buku Cerita</label>
                  <input
                    type="text"
                    value={editingStory.title}
                    onChange={(e) => setEditingStory({ ...editingStory, title: e.target.value })}
                    className="reader-field w-full px-3 py-2 rounded-xl font-bold"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Penulis</label>
                    <input
                      type="text"
                      value={editingStory.author}
                      onChange={(e) => setEditingStory({ ...editingStory, author: e.target.value })}
                      className="reader-field w-full px-3 py-2 rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Status Publikasi</label>
                    <select
                      value={editingStory.status || 'draft'}
                      onChange={(e) => setEditingStory({ ...editingStory, status: e.target.value as Story['status'] })}
                      className="reader-field w-full px-3 py-2 rounded-xl"
                    >
                      <option value="draft">Draft - belum tampil di katalog</option>
                      <option value="published">Published - tampil di katalog</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">ID Buku</label>
                    <input
                      type="text"
                      value={editingStory.id}
                      onChange={(e) => setEditingStory({ ...editingStory, id: e.target.value.trim() })}
                      className="reader-field w-full px-3 py-2 rounded-xl"
                      disabled={!isNewStory}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Kategori / Genrenya</label>
                    <input
                      type="text"
                      value={editingStory.category}
                      onChange={(e) => setEditingStory({ ...editingStory, category: e.target.value })}
                      className="reader-field w-full px-3 py-2 rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Usia Target Anak</label>
                    <input
                      type="text"
                      value={editingStory.targetAge}
                      onChange={(e) => setEditingStory({ ...editingStory, targetAge: e.target.value })}
                      className="reader-field w-full px-3 py-2 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">URL Gambar Cover</label>
                  <input
                    type="text"
                    value={editingStory.coverImage}
                    onChange={(e) => setEditingStory({ ...editingStory, coverImage: e.target.value })}
                    className="reader-field w-full px-3 py-2 rounded-xl"
                    required
                  />
                  <div className="mt-2 flex items-center gap-3 rounded-2xl reader-soft-panel p-3">
                    <img
                      src={editingStory.coverImage}
                      alt={editingStory.title}
                      className="h-28 w-20 rounded-xl object-cover border border-[#eadbc1] dark:border-blue-900 bg-white"
                    />
                    <div className="min-w-0">
                      <p className="font-black text-sm truncate">{editingStory.title || 'Judul buku'}</p>
                      <p className="mt-1 text-[11px] text-[var(--muted-ink)] dark:text-slate-300 line-clamp-3">
                        {editingStory.description || 'Deskripsi buku akan tampil di kartu katalog.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">Deskripsi Singkat Katalog</label>
                  <textarea
                    rows={2}
                    value={editingStory.description}
                    onChange={(e) => setEditingStory({ ...editingStory, description: e.target.value })}
                    className="reader-field w-full px-3 py-2 rounded-xl"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Pesan Moral Cerita</label>
                  <textarea
                    rows={2}
                    value={editingStory.moralMessage}
                    onChange={(e) => setEditingStory({ ...editingStory, moralMessage: e.target.value })}
                    className="reader-field w-full px-3 py-2 rounded-xl"
                    required
                  />
                </div>

                {/* STATUS AKSES BUKU */}
                <div className="reader-soft-panel p-3 rounded-2xl flex flex-col gap-2">
                  <label className="font-black text-xs text-[var(--muted-ink)] dark:text-blue-200">
                    Akses membaca online
                  </label>
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="accessStatus"
                        value="free_guest"
                        checked={editingStory.accessStatus === 'free_guest'}
                        onChange={() => setEditingStory({ ...editingStory, accessStatus: 'free_guest' })}
                      />
                      <span>Gratis tanpa login untuk buku pertama</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="accessStatus"
                        value="free_member"
                        checked={editingStory.accessStatus === 'free_member' || !editingStory.accessStatus}
                        onChange={() => setEditingStory({ ...editingStory, accessStatus: 'free_member' })}
                      />
                      <span>Gratis setelah orang tua login</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="accessStatus"
                        value="paid"
                        checked={editingStory.accessStatus === 'paid'}
                        onChange={() => setEditingStory({ ...editingStory, accessStatus: 'paid' })}
                      />
                      <span>Berbayar</span>
                    </label>
                  </div>
                </div>

                {/* PENGUNCI FITUR UNDUHAN & HARGA */}
                <div className="reader-soft-panel p-3 rounded-2xl flex flex-col gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="font-bold text-xs text-[var(--muted-ink)] dark:text-blue-200">
                      Unduhan offline
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingStory.downloadEnabled !== false}
                        onChange={(e) => setEditingStory({ ...editingStory, downloadEnabled: e.target.checked })}
                      />
                      <span className="font-bold text-xs">Aktifkan Unduh</span>
                    </label>
                  </div>

                  {editingStory.downloadEnabled !== false && (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div>
                        <label className="block text-[11px] font-bold">Harga E-Book (Rp)</label>
                        <input
                          type="number"
                          step={1000}
                          value={editingStory.ebookPrice || settings.defaultEbookPrice}
                          onChange={(e) =>
                            setEditingStory({ ...editingStory, ebookPrice: Number(e.target.value) })
                          }
                          className="reader-field w-full px-3 py-1.5 rounded-xl font-bold"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-4">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingStory.watermarkEnabled !== false}
                            onChange={(e) =>
                              setEditingStory({ ...editingStory, watermarkEnabled: e.target.checked })
                            }
                          />
                          <span className="text-[11px] font-bold">Stempel otomatis</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* --- 1. MANAJEMEN HALAMAN BILINGUAL (TEKS GANDA INDONESIA ⇄ INGGRIS) --- */}
                <div className="reader-soft-panel p-3.5 rounded-2xl flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-black text-xs uppercase text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                      <Languages className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Teks dua bahasa</span>
                    </span>
                    <span className="text-[10px] bg-indigo-200 text-indigo-900 font-bold px-2 py-0.5 rounded-full">
                      {editingStory.pages.length} Halaman
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const nextPage = createBlankPage(editingStory.pages.length + 1);
                        setEditingStory({ ...editingStory, pages: [...editingStory.pages, nextPage] });
                        setPreviewPageIndex(editingStory.pages.length);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px]"
                    >
                      + Tambah Halaman
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 max-h-[28rem] overflow-y-auto pr-1">
                    {editingStory.pages.map((pg, idx) => (
                      <div
                        key={pg.id || idx}
                        className="reader-soft-panel p-3 rounded-xl flex flex-col gap-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewPageIndex(idx)}
                            className={`text-left font-extrabold text-xs ${
                              previewPageIndex === idx ? 'text-[var(--story-green)]' : 'text-indigo-800 dark:text-indigo-300'
                            }`}
                          >
                            Halaman {idx + 1}
                          </button>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const newPages = [...editingStory.pages];
                                const copy = {
                                  ...pg,
                                  id: `page_${Date.now()}`,
                                  pageNumber: idx + 2,
                                  title: `${pg.title || `Halaman ${idx + 1}`} (salinan)`,
                                };
                                newPages.splice(idx + 1, 0, copy);
                                setEditingStory({ ...editingStory, pages: newPages });
                                setPreviewPageIndex(idx + 1);
                              }}
                              className="px-2 py-1 rounded-lg bg-white/70 dark:bg-slate-900 text-[10px] font-bold"
                            >
                              Duplikat
                            </button>
                            <button
                              type="button"
                              disabled={editingStory.pages.length <= 1}
                              onClick={() => {
                                const newPages = editingStory.pages.filter((_, pageIdx) => pageIdx !== idx);
                                setEditingStory({ ...editingStory, pages: newPages });
                                setPreviewPageIndex(Math.max(0, Math.min(previewPageIndex, newPages.length - 1)));
                              }}
                              className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-300 disabled:opacity-40 text-[10px] font-bold"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_12rem] gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-[var(--muted-ink)] dark:text-slate-300">
                              Judul halaman
                            </label>
                            <input
                              type="text"
                              value={pg.title || ''}
                              onChange={(e) => {
                                const newPages = [...editingStory.pages];
                                newPages[idx] = { ...newPages[idx], title: e.target.value };
                                setEditingStory({ ...editingStory, pages: newPages });
                              }}
                              className="reader-field w-full p-2 text-[11px] rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-[var(--muted-ink)] dark:text-slate-300">
                              Ilustrasi
                            </label>
                            <select
                              value={pg.illustrationType}
                              onChange={(e) => {
                                const newPages = [...editingStory.pages];
                                newPages[idx] = { ...newPages[idx], illustrationType: e.target.value as StoryPage['illustrationType'] };
                                setEditingStory({ ...editingStory, pages: newPages });
                              }}
                              className="reader-field w-full p-2 text-[11px] rounded-lg"
                            >
                              <option value="forest">Forest</option>
                              <option value="dragon">Dragon</option>
                              <option value="space">Space</option>
                              <option value="sea">Sea</option>
                              <option value="castle">Castle</option>
                              <option value="garden">Garden</option>
                              <option value="custom">Custom</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-amber-900 dark:text-amber-200">
                              🇮🇩 Teks Bahasa Indonesia
                            </label>
                            <textarea
                              rows={2}
                              value={pg.text}
                              onChange={(e) => {
                                const newPages = [...editingStory.pages];
                                newPages[idx] = { ...newPages[idx], text: e.target.value };
                                setEditingStory({ ...editingStory, pages: newPages });
                              }}
                              className="reader-field w-full p-2 text-[11px] rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-indigo-900 dark:text-indigo-200">
                              🇬🇧 English Translation (Edisi Belajar)
                            </label>
                            <textarea
                              rows={2}
                              value={pg.textEn || ''}
                              placeholder="Masukkan teks versi bahasa Inggris..."
                              onChange={(e) => {
                                const newPages = [...editingStory.pages];
                                newPages[idx] = { ...newPages[idx], textEn: e.target.value };
                                setEditingStory({ ...editingStory, pages: newPages });
                              }}
                              className="reader-field w-full p-2 text-[11px] rounded-lg"
                            />
                          </div>
                        </div>

                        {pg.illustrationType === 'custom' && (
                          <div>
                            <label className="block text-[10px] font-bold text-[var(--muted-ink)] dark:text-slate-300">
                              Prompt ilustrasi custom / catatan aset
                            </label>
                            <textarea
                              rows={2}
                              value={pg.illustrationPrompt || ''}
                              onChange={(e) => {
                                const newPages = [...editingStory.pages];
                                newPages[idx] = { ...newPages[idx], illustrationPrompt: e.target.value };
                                setEditingStory({ ...editingStory, pages: newPages });
                              }}
                              className="reader-field w-full p-2 text-[11px] rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {editingStory.pages.length > 0 && (
                  <div className="reader-soft-panel p-3.5 rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-xs uppercase text-[var(--muted-ink)] dark:text-blue-200 flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-[var(--story-green)]" />
                        Preview halaman
                      </span>
                      <select
                        value={Math.min(previewPageIndex, editingStory.pages.length - 1)}
                        onChange={(e) => setPreviewPageIndex(Number(e.target.value))}
                        className="reader-field px-2 py-1 rounded-lg text-[11px]"
                      >
                        {editingStory.pages.map((page, idx) => (
                          <option key={`${page.pageNumber}-${idx}`} value={idx}>
                            Halaman {idx + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                    {(() => {
                      const page = editingStory.pages[Math.min(previewPageIndex, editingStory.pages.length - 1)];
                      return (
                        <div className="rounded-2xl border border-[#eadbc1] dark:border-blue-900 overflow-hidden bg-[#fffaf0] dark:bg-slate-950">
                          <div className="p-4 bg-gradient-to-br from-emerald-100 to-amber-100 dark:from-slate-800 dark:to-slate-900">
                            <div className="min-h-36 rounded-2xl bg-white/70 dark:bg-slate-900/70 p-4 flex flex-col justify-end">
                              <p className="text-[11px] font-black text-[var(--story-green)] uppercase">
                                {page.illustrationType}
                              </p>
                              <h4 className="text-base font-black mb-1">{page.title || `Halaman ${page.pageNumber}`}</h4>
                              <p className="text-sm leading-relaxed font-bold text-slate-800 dark:text-slate-100">
                                {page.text || 'Teks cerita halaman ini belum diisi.'}
                              </p>
                              {page.textEn && (
                                <p className="mt-2 text-xs leading-relaxed text-indigo-800 dark:text-indigo-200">
                                  {page.textEn}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {editingStory.pages.length > 0 && (() => {
                  const pageIndex = Math.min(previewPageIndex, editingStory.pages.length - 1);
                  const page = editingStory.pages[pageIndex];
                  const updatePage = (nextPage: StoryPage) => {
                    const newPages = [...editingStory.pages];
                    newPages[pageIndex] = nextPage;
                    setEditingStory({ ...editingStory, pages: newPages });
                  };

                  return (
                    <div className="reader-soft-panel p-3.5 rounded-2xl flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="font-black text-xs uppercase text-[var(--muted-ink)] dark:text-blue-200">
                          Interaksi & kuis halaman {pageIndex + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const nextElement: InteractiveElement = {
                              id: `elem_${Date.now()}`,
                              type: 'character',
                              label: 'Tokoh',
                              x: 50,
                              y: 50,
                              animation: 'bounce',
                              soundType: 'pop',
                              dialogue: 'Halo!',
                              emoji: '⭐',
                            };
                            updatePage({ ...page, interactiveElements: [...(page.interactiveElements || []), nextElement] });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[var(--story-green)] hover:bg-[#27795b] text-white font-bold text-[11px]"
                        >
                          + Elemen Interaktif
                        </button>
                      </div>

                      <div className="flex flex-col gap-2">
                        {(page.interactiveElements || []).map((element, elemIdx) => (
                          <div key={element.id || elemIdx} className="grid grid-cols-1 sm:grid-cols-[1fr_4rem_4rem_4rem_auto] gap-2 items-end rounded-xl bg-white/60 dark:bg-slate-900/60 p-2">
                            <div>
                              <label className="block text-[10px] font-bold">Label & dialog</label>
                              <input
                                value={element.label}
                                onChange={(e) => {
                                  const updated = [...(page.interactiveElements || [])];
                                  updated[elemIdx] = { ...updated[elemIdx], label: e.target.value };
                                  updatePage({ ...page, interactiveElements: updated });
                                }}
                                className="reader-field w-full p-2 text-[11px] rounded-lg"
                              />
                              <input
                                value={element.dialogue || ''}
                                onChange={(e) => {
                                  const updated = [...(page.interactiveElements || [])];
                                  updated[elemIdx] = { ...updated[elemIdx], dialogue: e.target.value };
                                  updatePage({ ...page, interactiveElements: updated });
                                }}
                                className="reader-field w-full p-2 text-[11px] rounded-lg mt-1"
                                placeholder="Dialog saat disentuh"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold">Emoji</label>
                              <input
                                value={element.emoji || ''}
                                onChange={(e) => {
                                  const updated = [...(page.interactiveElements || [])];
                                  updated[elemIdx] = { ...updated[elemIdx], emoji: e.target.value };
                                  updatePage({ ...page, interactiveElements: updated });
                                }}
                                className="reader-field w-full p-2 text-[11px] rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold">X%</label>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={element.x}
                                onChange={(e) => {
                                  const updated = [...(page.interactiveElements || [])];
                                  updated[elemIdx] = { ...updated[elemIdx], x: Number(e.target.value) };
                                  updatePage({ ...page, interactiveElements: updated });
                                }}
                                className="reader-field w-full p-2 text-[11px] rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold">Y%</label>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={element.y}
                                onChange={(e) => {
                                  const updated = [...(page.interactiveElements || [])];
                                  updated[elemIdx] = { ...updated[elemIdx], y: Number(e.target.value) };
                                  updatePage({ ...page, interactiveElements: updated });
                                }}
                                className="reader-field w-full p-2 text-[11px] rounded-lg"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (page.interactiveElements || []).filter((_, i) => i !== elemIdx);
                                updatePage({ ...page, interactiveElements: updated });
                              }}
                              className="px-2 py-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-300 text-[10px] font-bold"
                            >
                              Hapus
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-xl bg-white/60 dark:bg-slate-900/60 p-3 flex flex-col gap-2">
                        <label className="flex items-center gap-2 font-bold">
                          <input
                            type="checkbox"
                            checked={Boolean(page.quizQuestion)}
                            onChange={(e) => {
                              updatePage({
                                ...page,
                                quizQuestion: e.target.checked
                                  ? {
                                      question: 'Apa pesan dari halaman ini?',
                                      options: ['Berani mencoba', 'Menyerah', 'Tidak peduli', 'Marah-marah'],
                                      answerIndex: 0,
                                      explanation: 'Jawaban terbaik adalah berani mencoba dengan hati baik.',
                                    }
                                  : undefined,
                              });
                            }}
                          />
                          Kuis mini di halaman ini
                        </label>
                        {page.quizQuestion && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <textarea
                              rows={2}
                              value={page.quizQuestion.question}
                              onChange={(e) =>
                                updatePage({ ...page, quizQuestion: { ...page.quizQuestion!, question: e.target.value } })
                              }
                              className="reader-field w-full p-2 text-[11px] rounded-lg sm:col-span-2"
                              placeholder="Pertanyaan"
                            />
                            {page.quizQuestion.options.map((option, optionIdx) => (
                              <input
                                key={optionIdx}
                                value={option}
                                onChange={(e) => {
                                  const options = [...page.quizQuestion!.options];
                                  options[optionIdx] = e.target.value;
                                  updatePage({ ...page, quizQuestion: { ...page.quizQuestion!, options } });
                                }}
                                className="reader-field w-full p-2 text-[11px] rounded-lg"
                                placeholder={`Pilihan ${optionIdx + 1}`}
                              />
                            ))}
                            <select
                              value={page.quizQuestion.answerIndex}
                              onChange={(e) =>
                                updatePage({ ...page, quizQuestion: { ...page.quizQuestion!, answerIndex: Number(e.target.value) } })
                              }
                              className="reader-field w-full p-2 text-[11px] rounded-lg"
                            >
                              {page.quizQuestion.options.map((_, optionIdx) => (
                                <option key={optionIdx} value={optionIdx}>
                                  Jawaban benar: pilihan {optionIdx + 1}
                                </option>
                              ))}
                            </select>
                            <input
                              value={page.quizQuestion.explanation}
                              onChange={(e) =>
                                updatePage({ ...page, quizQuestion: { ...page.quizQuestion!, explanation: e.target.value } })
                              }
                              className="reader-field w-full p-2 text-[11px] rounded-lg"
                              placeholder="Penjelasan jawaban"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* --- 2. MANAJEMEN GLOSARIUM KAMUS SENTUH --- */}
                <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-slate-800 border-2 border-purple-200 dark:border-purple-800 flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-black text-xs uppercase text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>Glosarium sentuh</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const currentGlossary = editingStory.glossary || [];
                        const newItem = {
                          id: `g_${Date.now()}`,
                          wordEn: 'Friend',
                          translationId: 'Sahabat',
                          phonetic: 'frend',
                          emoji: '🤝',
                        };
                        setEditingStory({
                          ...editingStory,
                          glossary: [...currentGlossary, newItem],
                        });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px]"
                    >
                      + Tambah Kata
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    {(editingStory.glossary || []).map((item, gIdx) => (
                      <div
                        key={item.id || gIdx}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-700/60 grid grid-cols-1 sm:grid-cols-5 gap-2 items-center text-[11px]"
                      >
                        <input
                          type="text"
                          placeholder="Kata EN (Mis: Rabbit)"
                          value={item.wordEn}
                          onChange={(e) => {
                            const updated = [...(editingStory.glossary || [])];
                            updated[gIdx] = { ...updated[gIdx], wordEn: e.target.value };
                            setEditingStory({ ...editingStory, glossary: updated });
                          }}
                          className="px-2 py-1 rounded border border-purple-300 font-bold"
                        />
                        <input
                          type="text"
                          placeholder="Arti ID (Mis: Kelinci)"
                          value={item.translationId}
                          onChange={(e) => {
                            const updated = [...(editingStory.glossary || [])];
                            updated[gIdx] = { ...updated[gIdx], translationId: e.target.value };
                            setEditingStory({ ...editingStory, glossary: updated });
                          }}
                          className="px-2 py-1 rounded border border-purple-300"
                        />
                        <input
                          type="text"
                          placeholder="Fonetik (Mis: rab-it)"
                          value={item.phonetic || ''}
                          onChange={(e) => {
                            const updated = [...(editingStory.glossary || [])];
                            updated[gIdx] = { ...updated[gIdx], phonetic: e.target.value };
                            setEditingStory({ ...editingStory, glossary: updated });
                          }}
                          className="px-2 py-1 rounded border border-purple-300"
                        />
                        <input
                          type="text"
                          placeholder="Emoji (Mis: 🐰)"
                          value={item.emoji || ''}
                          onChange={(e) => {
                            const updated = [...(editingStory.glossary || [])];
                            updated[gIdx] = { ...updated[gIdx], emoji: e.target.value };
                            setEditingStory({ ...editingStory, glossary: updated });
                          }}
                          className="px-2 py-1 rounded border border-purple-300 text-center"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (editingStory.glossary || []).filter((_, i) => i !== gIdx);
                            setEditingStory({ ...editingStory, glossary: updated });
                          }}
                          className="px-2 py-1 rounded bg-rose-500 hover:bg-rose-600 text-white font-bold text-[10px]"
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* --- 3. PUSTAKA SUARA (AUDIO LIBRARY NATIVE NARRATION) --- */}
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-slate-800 border-2 border-amber-200 dark:border-amber-800 flex flex-col gap-2">
                  <span className="font-black text-xs uppercase text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <Megaphone className="w-4 h-4 text-amber-600" />
                    <span>Pustaka suara narator</span>
                  </span>
                  <p className="text-[11px] text-amber-800/80 dark:text-indigo-200">
                    Audio otomatis memakai suara perangkat. Orang tua juga dapat merekam narasi per halaman.
                  </p>
                </div>
                  </>
                )}

                <button
                  type="submit"
                  className="btn-primary w-full py-3 px-5 text-xs mt-2"
                >
                  Simpan buku
                </button>
              </form>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
};
