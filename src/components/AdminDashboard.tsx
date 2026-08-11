import React, { useCallback, useState, useEffect } from 'react';
import {
  InteractiveElement,
  Story,
  StoryPage,
} from '../types';
import bacaYukLogo from '../assets/bacayuk-logo.svg';
import bacaYukMark from '../assets/bacayuk-mark.svg';
import {
  adminStore,
  UserReadingActivity,
} from '../utils/adminStore';
import { userAuthStore, UserAccount } from '../utils/userAuthStore';
import {
  LEGACY_DEMO_USER_IDS,
  PIPELINE_STEPS,
  chunkSentences,
  extractGlossaryCandidates,
  hasCompleteStoryImages,
  inferPipelineStatus,
  isPlaceholderCover,
  splitTextIntoSentences,
  storybookApi,
  normalizeStoryForSave,
  validateStory,
  useQuickCreateController,
  useStoryAiController,
  visualPresetLabel,
} from '../features/book-studio';
import { QuickCreateDialog } from '../features/book-studio/components/QuickCreateDialog';
import {
  AdminSettingsTab,
  AnalyticsTab,
  CostLedgerTab,
  FinanceTab,
  StoriesTab,
  UsersTab,
  useAdminFinanceController,
  useAdminSettingsController,
  useCostLedgerController,
} from '../features/admin';
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
  // Reading Logs
  const [readingLogs] = useState<UserReadingActivity[]>(() => adminStore.getReadingLogs());

  // Show only the actual account currently signed in on this device.
  const [userList] = useState<UserAccount[]>(() => {
    const current = userAuthStore.getUser();
    return current && !LEGACY_DEMO_USER_IDS.has(current.id) ? [current] : [];
  });

  // Story Uploader / Editor Modal State
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [isNewStory, setIsNewStory] = useState(false);
  const [storyFormErrors, setStoryFormErrors] = useState<string[]>([]);
  const [previewPageIndex, setPreviewPageIndex] = useState(0);
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
  const [interactionPlaceMode, setInteractionPlaceMode] = useState(false);

  // Toast / Feedback message
  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const {
    coupons,
    transactions,
    newCouponCode,
    newCouponType,
    newCouponValue,
    showCouponForm,
    successfulTransactions: successTrxs,
    pendingTransactions: pendingTrxs,
    totalRevenue,
    setNewCouponCode,
    setNewCouponType,
    setNewCouponValue,
    setShowCouponForm,
    refreshTransactions,
    handleCreateCoupon,
    handleToggleCoupon,
    handleDeleteCoupon,
    handleUpdateTransactionStatus: handleUpdateTrxStatus,
  } = useAdminFinanceController({ showToast });

  const {
    settings,
    cronStatus,
    setSettings,
    handleSaveSettings,
    handleRunCleanup,
  } = useAdminSettingsController({
    onTransactionsRefresh: refreshTransactions,
    showToast,
  });

  const {
    error: costLedgerError,
    totalAiCost,
    totalPaymentFee,
    netProfit,
    storyRows: storyCostRows,
    loadCostEvents,
  } = useCostLedgerController({ adminPin, totalRevenue });

  const openDraftInEditor = useCallback((draftStory: Story) => {
    setEditingStory(draftStory);
    setIsNewStory(true);
    setStoryFormErrors([]);
    setPreviewPageIndex(0);
    setShowAdvancedEditor(false);
    setInteractionPlaceMode(false);
  }, []);

  const {
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
  } = useQuickCreateController({
    adminPin,
    defaultEbookPrice: settings.defaultEbookPrice,
    onDraftReady: openDraftInEditor,
    showToast,
  });

  useEffect(() => {
    if (routeAction === 'new') {
      openQuickCreate();
    }
  }, [openQuickCreate, routeAction]);

  useEffect(() => {
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

  const {
    isGeneratingTranslation,
    generatingEnhancement,
    generatingImagePageNumber,
    imageGenerationProgress,
    handleGenerateTranslation,
    handleGenerateEnhancement,
    handleGeneratePageImage,
    handleGenerateAllImages,
  } = useStoryAiController({
    editingStory,
    setEditingStory,
    adminPin,
    showToast,
  });

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

  // Search queries
  const [userSearchQuery, setUserSearchQuery] = useState('');

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
              openQuickCreate();
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

        {activeTab === 'settings' && <AdminSettingsTab settings={settings} cronStatus={cronStatus} onSettingsChange={setSettings} onRunCleanup={handleRunCleanup} onSubmit={handleSaveSettings} />}

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
              closeQuickCreate();
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
