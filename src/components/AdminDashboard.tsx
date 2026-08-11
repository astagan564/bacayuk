import React, { useCallback, useState, useEffect } from 'react';
import { Story } from '../types';
import bacaYukLogo from '../assets/bacayuk-logo.svg';
import bacaYukMark from '../assets/bacayuk-mark.svg';
import {
  adminStore,
  UserReadingActivity,
} from '../utils/adminStore';
import { userAuthStore, UserAccount } from '../utils/userAuthStore';
import {
  LEGACY_DEMO_USER_IDS,
  useQuickCreateController,
  useStoryEditorController,
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

  const {
    editingStory,
    isNewStory,
    errors: storyFormErrors,
    previewPageIndex,
    showAdvancedEditor,
    interactionPlaceMode,
    setEditingStory,
    setPreviewPageIndex,
    setShowAdvancedEditor,
    setInteractionPlaceMode,
    openDraftInEditor,
    openManualStory,
    openExistingStory,
    closeEditor,
    refreshGlossaryCandidates,
    handleCanvasInteractionClick,
    handleSaveStory,
    handleDeleteStory,
    isGeneratingTranslation,
    generatingEnhancement,
    generatingImagePageNumber,
    imageGenerationProgress,
    handleGenerateTranslation,
    handleGenerateEnhancement,
    handleGeneratePageImage,
    handleGenerateAllImages,
  } = useStoryEditorController({
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

  const selectSection = (section: AdminSection) => {
    setInternalActiveTab(section);
    onSectionChange?.(section);
  };

  // Search queries
  const [userSearchQuery, setUserSearchQuery] = useState('');

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
            onCreateManually={openManualStory}
            onEdit={openExistingStory}
            onDelete={handleDeleteStory}
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
            onSubmit={handleSaveStory}
            onClose={closeEditor}
          />
        )}
        </div>
      </main>
    </div>
  );
};
