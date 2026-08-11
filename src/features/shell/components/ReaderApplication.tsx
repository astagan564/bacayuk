import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { Story } from '@/types';
import { userAuthStore } from '@/utils/userAuthStore';
import { adminStore } from '@/utils/adminStore';
import { useUserSessionController } from '@/features/account';
import { usePurchaseFlowController } from '@/features/commerce';
import {
  LibraryWorkspace,
  type ReaderSettingsController,
  useReaderOverlayController,
  useReaderSessionController,
} from '@/features/reader';
import { ApplicationFooter } from '@/features/shell/components/ApplicationFooter';
import { ApplicationHeader } from '@/features/shell/components/ApplicationHeader';
import { ReaderApplicationModals } from '@/features/shell/components/ReaderApplicationModals';
import { useChangelogController } from '@/features/shell/hooks/useChangelogController';

interface ReaderApplicationProps {
  stories: Story[];
  onStoriesChange: Dispatch<SetStateAction<Story[]>>;
  readerSettings: ReaderSettingsController;
  showToast: (message: string) => void;
}

export function ReaderApplication({
  stories,
  onStoriesChange,
  readerSettings,
  showToast,
}: ReaderApplicationProps) {
  const navigate = useNavigate();
  const changelog = useChangelogController();
  const userSession = useUserSessionController({ showToast });
  const readerSession = useReaderSessionController({
    stories,
    onStoriesChange,
    currentUser: userSession.currentUser,
    readyStory: userSession.readyStory,
    clearReadyStory: userSession.clearReadyStory,
    requestLogin: userSession.requestLogin,
    recordRecentStory: userSession.recordRecentStory,
    showToast,
    adminPin: undefined,
  });
  const readerOverlays = useReaderOverlayController();
  const purchaseFlow = usePurchaseFlowController({
    onVipActivated: readerOverlays.openStoryMaker,
    showToast,
  });

  const openStoryMaker = useCallback((): void => {
    const user = userAuthStore.getUser();
    if (!user) {
      showToast('🔒 Silakan Masuk (Login) Akun Orang Tua terlebih dahulu untuk menggunakan fitur AI.');
      userSession.requestLogin();
      return;
    }
    if (!userAuthStore.isVip()) {
      purchaseFlow.offerVip();
      return;
    }
    if ((user.aiStoriesUsed || 0) >= 10) {
      showToast('Kuota buat cerita bulan ini sudah habis.');
      return;
    }
    readerOverlays.openStoryMaker();
  }, [purchaseFlow.offerVip, readerOverlays.openStoryMaker, showToast, userSession.requestLogin]);

  const openAdmin = useCallback(() => void navigate({ to: '/admin' }), [navigate]);
  const openSettings = useCallback(() => void navigate({ to: '/settings' }), [navigate]);
  const login = useCallback(() => userSession.requestLogin(), [userSession.requestLogin]);
  const logout = useCallback(() => void userSession.logout(), [userSession.logout]);
  const completeBook = useCallback(
    (story: Story) => readerSession.completeStory(story.id),
    [readerSession.completeStory],
  );
  const isReading = Boolean(readerSession.selectedStory);

  return (
    <div className={`min-h-screen flex flex-col ${isReading ? 'justify-start' : 'justify-between'} font-sans transition-colors duration-500`}>
      {!isReading && (
        <ApplicationHeader
          currentUser={userSession.currentUser}
          hasUnreadChangelog={changelog.hasUnreadChangelog}
          isNight={readerSettings.isNight}
          isWhatsNewOpen={changelog.isDropdownOpen}
          onAdmin={openAdmin}
          onChangelog={changelog.openModal}
          onCloseWhatsNew={changelog.closeDropdown}
          onHome={readerSession.backToLibrary}
          onLogin={login}
          onLogout={logout}
          onSettings={openSettings}
          onStats={readerOverlays.openStats}
          onToggleTheme={readerSettings.toggleTheme}
          onToggleWhatsNew={changelog.toggleDropdown}
        />
      )}

      <LibraryWorkspace
        bookmarks={readerSession.bookmarks}
        completedStories={readerSession.completedStories}
        currentPageIndex={readerSession.currentPageIndex}
        flipbookRef={readerSession.flipbookRef}
        isThumbnailsOpen={readerOverlays.isThumbnailsOpen}
        personalLibrary={userSession.personalLibrary}
        readingTimes={readerSession.readingTimes}
        readingViewRef={readerSession.readingViewRef}
        selectedStory={readerSession.selectedStory}
        settings={readerSettings.settings}
        stories={stories}
        onBackToLibrary={readerSession.backToLibrary}
        onCompleteBook={completeBook}
        onOpenOfflineDownload={purchaseFlow.requestOfflineDownload}
        onOpenPayment={purchaseFlow.requestBookPurchase}
        onOpenQuiz={readerOverlays.openQuiz}
        onOpenStats={readerOverlays.openStats}
        onOpenStoryMaker={openStoryMaker}
        onOpenVoiceRecorder={readerOverlays.openVoiceRecorder}
        onPageChange={readerSession.changePage}
        onSelectStory={readerSession.openStory}
        onTestRestReminder={readerSession.requestRestReminder}
        onToggleBookmark={readerSession.toggleCurrentBookmark}
        onToggleFavorite={userSession.toggleFavorite}
        onToggleThumbnails={readerOverlays.toggleThumbnails}
        onUpdateSettings={readerSettings.updateSettings}
      />

      {!isReading && <ApplicationFooter onOpenChangelog={changelog.openModal} />}
      <ReaderApplicationModals
        session={readerSession}
        overlays={readerOverlays}
        purchaseFlow={purchaseFlow}
        changelog={changelog}
        stories={stories}
        isNight={readerSettings.isNight}
        restMinutes={adminStore.getSettings().eyeRestIntervalMinutes || 20}
        loginStoryTarget={userSession.pendingStory}
        showLoginModal={userSession.showLoginModal}
        onCloseLogin={userSession.closeLogin}
        onLoginSuccess={userSession.handleLoginSuccess}
        showToast={showToast}
      />
    </div>
  );
}
