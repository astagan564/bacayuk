import React, { useCallback, useState } from 'react';
import type { Story } from '../types';
import { BookStudioAdminWorkspace } from '../features/book-studio';
import {
  AdminSidebar,
  AdminSettingsTab,
  AnalyticsTab,
  CostLedgerTab,
  FinanceTab,
  UsersTab,
  useAdminFinanceController,
  useAdminSettingsController,
  useAdminUsersController,
  useCostLedgerController,
} from '../features/admin';
import type { AdminSection } from '../features/admin';
import {
  CheckCircle2,
} from 'lucide-react';

interface AdminDashboardProps {
  stories: Story[];
  onUpdateStories: (updatedStories: Story[]) => void | Promise<void>;
  onBackToHome: () => void;
  adminPin?: string;
  activeSection?: AdminSection;
  routeAction?: 'new' | 'edit' | 'canvas';
  routeStoryId?: string;
  onSectionChange?: (section: AdminSection) => void;
  onCloseRouteAction?: () => void;
  onOpenQuickCreate?: () => void;
  onOpenStoryEditor?: (storyId: string, mode: 'edit' | 'canvas') => void;
}
export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stories,
  onUpdateStories,
  onBackToHome,
  adminPin,
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

  // Toast / Feedback message
  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const {
    users: userList,
    readingLogs,
    searchQuery: userSearchQuery,
    setSearchQuery: setUserSearchQuery,
    handleExportCsv: handleExportUsersCSV,
  } = useAdminUsersController({ showToast });

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

  const selectSection = useCallback((section: AdminSection) => {
    setInternalActiveTab(section);
    onSectionChange?.(section);
  }, [onSectionChange]);

  return (
    <div className="min-h-screen w-full flex overflow-hidden animate-fade-in bg-background text-primary">
      
      {/* Toast Feedback */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 p-3 rounded-xl bg-brand-green text-white font-semibold text-xs shadow-xl animate-fade-in flex items-center gap-2 border border-white/20">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toast}</span>
        </div>
      )}

      <AdminSidebar
        activeSection={activeTab}
        userCount={userList.length}
        onSectionChange={selectSection}
        onBackToHome={onBackToHome}
      />

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto p-5 sm:p-8 relative">
        <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-20">

        {/* TAB 1: Book management */}
        {activeTab === 'cms' && (
          <BookStudioAdminWorkspace
            stories={stories}
            settings={settings}
            onUpdateStories={onUpdateStories}
            showToast={showToast}
            adminPin={adminPin}
            routeAction={routeAction}
            routeStoryId={routeStoryId}
            onCloseRouteAction={onCloseRouteAction}
            onOpenQuickCreate={onOpenQuickCreate}
            onOpenStoryEditor={onOpenStoryEditor}
          />
        )}

        {activeTab === 'users' && <UsersTab users={userList} readingLogs={readingLogs} searchQuery={userSearchQuery} onSearchQueryChange={setUserSearchQuery} onExportCsv={handleExportUsersCSV} />}

        {activeTab === 'finance' && <FinanceTab totalRevenue={totalRevenue} successfulTransactions={successTrxs} pendingTransactions={pendingTrxs} transactions={transactions} coupons={coupons} showCouponForm={showCouponForm} newCouponCode={newCouponCode} newCouponType={newCouponType} newCouponValue={newCouponValue} onToggleCouponForm={() => setShowCouponForm(!showCouponForm)} onCouponCodeChange={setNewCouponCode} onCouponTypeChange={setNewCouponType} onCouponValueChange={setNewCouponValue} onCreateCoupon={handleCreateCoupon} onToggleCoupon={handleToggleCoupon} onDeleteCoupon={handleDeleteCoupon} onUpdateTransactionStatus={handleUpdateTrxStatus} />}

        {activeTab === 'costs' && <CostLedgerTab error={costLedgerError} totalRevenue={totalRevenue} totalAiCost={totalAiCost} totalPaymentFee={totalPaymentFee} netProfit={netProfit} storyRows={storyCostRows} onReload={() => void loadCostEvents()} />}

        {activeTab === 'settings' && <AdminSettingsTab settings={settings} cronStatus={cronStatus} onSettingsChange={setSettings} onRunCleanup={handleRunCleanup} onSubmit={handleSaveSettings} />}

        {activeTab === 'analytics' && <AnalyticsTab stories={stories} />}

        </div>
      </main>
    </div>
  );
};
