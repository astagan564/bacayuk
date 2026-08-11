import React, { lazy, Suspense, useCallback, useState, useEffect } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import type { Story } from './types';
import { ParentLoginModal } from './components/ParentLoginModal';
import { UserSettingsView } from './components/UserSettings';
import { ChangelogModal } from './components/ChangelogModal';
import { AdminPinDialog } from './features/admin/components/AdminPinDialog';
import { useAdminAccessController } from './features/admin/hooks/useAdminAccessController';
import { useUserSessionController } from './features/account';
import { PurchaseFlowModals, usePurchaseFlowController } from './features/commerce';
import { ApplicationHeader } from './features/shell/components/ApplicationHeader';
import {
  LibraryWorkspace,
  ReaderOverlayModals,
  useReaderOverlayController,
  useReaderSessionController,
  useReaderSettingsController,
} from './features/reader';
import { userAuthStore } from './utils/userAuthStore';
import { adminStore } from './utils/adminStore';
import { storyStore } from './utils/storyStore';
import packageJson from '../package.json';

const AdminRouteWorkspace = lazy(() =>
  import('./features/admin/components/AdminRouteWorkspace').then((module) => ({
    default: module.AdminRouteWorkspace,
  }))
);

export default function App() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const isSettingsRoute = pathname === '/settings';
  const [stories, setStories] = useState<Story[]>(() => storyStore.getLocalStories());

  const [showChangelogModal, setShowChangelogModal] = useState<boolean>(false);
  const [showWhatsNewDropdown, setShowWhatsNewDropdown] = useState(false);
  const [hasUnreadChangelog, setHasUnreadChangelog] = useState(() => {
    return localStorage.getItem('bacayuk_last_seen_version') !== packageJson.version;
  });

  useEffect(() => {
    let isMounted = true;

    storyStore.loadStories().then((loadedStories) => {
      if (isMounted) {
        setStories(loadedStories);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleWhatsNew = () => {
    setShowWhatsNewDropdown(!showWhatsNewDropdown);
    if (hasUnreadChangelog) {
      localStorage.setItem('bacayuk_last_seen_version', packageJson.version);
      setHasUnreadChangelog(false);
    }
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  }, []);

  const {
    currentUser,
    personalLibrary,
    pendingStory: loginStoryTarget,
    readyStory,
    showLoginModal,
    requestLogin,
    closeLogin,
    handleLoginSuccess,
    logout,
    recordRecentStory,
    toggleFavorite: handleToggleStoryFavorite,
    clearReadyStory,
  } = useUserSessionController({
    showToast,
  });

  const handleAdminAccessGranted = useCallback(() => {
    if (!isAdminRoute) void navigate({ to: '/admin' });
  }, [isAdminRoute, navigate]);

  const handleAdminAccessCancelled = useCallback(() => {
    if (isAdminRoute) void navigate({ to: '/' });
  }, [isAdminRoute, navigate]);

  const {
    adminPin,
    showPrompt: showAdminPinPrompt,
    isVerifying: isVerifyingAdminPin,
    verifyPin: verifyAdminPinAndOpen,
    cancelAccess: cancelAdminAccess,
  } = useAdminAccessController({
    isAdminRoute,
    onStoriesLoaded: setStories,
    onAccessGranted: handleAdminAccessGranted,
    onAccessCancelled: handleAdminAccessCancelled,
    showToast,
  });

  const {
    settings,
    isNight,
    updateSettings: handleUpdateSettings,
    toggleTheme: handleToggleTheme,
  } = useReaderSettingsController();

  const readerSession = useReaderSessionController({
    stories,
    onStoriesChange: setStories,
    currentUser,
    readyStory,
    clearReadyStory,
    requestLogin,
    recordRecentStory,
    showToast,
    adminPin: adminPin || undefined,
  });
  const readerOverlays = useReaderOverlayController();
  const purchaseFlow = usePurchaseFlowController({
    onVipActivated: readerOverlays.openStoryMaker,
    showToast,
  });

  const handleOpenStoryMaker = useCallback(() => {
    const user = userAuthStore.getUser();
    if (!user) {
      showToast('🔒 Silakan Masuk (Login) Akun Orang Tua terlebih dahulu untuk menggunakan fitur AI.');
      requestLogin();
    } else if (userAuthStore.isVip()) {
      if ((user.aiStoriesUsed || 0) >= 10) showToast('Kuota buat cerita bulan ini sudah habis.');
      else readerOverlays.openStoryMaker();
    } else {
      purchaseFlow.offerVip();
    }
  }, [purchaseFlow.offerVip, readerOverlays.openStoryMaker, requestLogin, showToast]);

  // Anti-Right Click & Copy Protection Handlers
  useEffect(() => {
    const settings = adminStore.getSettings();
    if (!settings.enableCopyProtection) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      showToast('🔒 Hak Cipta Dilindungi: Klik kanan dinonaktifkan.');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && (e.key === 's' || e.key === 'S' || e.key === 'u' || e.key === 'U' || e.key === 'p' || e.key === 'P')) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'C' || e.key === 'c'))
      ) {
        e.preventDefault();
        showToast('🔒 Tombol shortcut dinonaktifkan untuk melindungi e-book.');
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showToast]);

  if (isAdminRoute && adminPin) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-surface" />}>
        <AdminRouteWorkspace
          stories={stories}
          adminPin={adminPin}
          onStoriesChange={setStories}
        />
      </Suspense>
    );
  }

  if (isSettingsRoute) {
    return (
      <UserSettingsView
        onBack={() => void navigate({ to: '/' })}
        isNight={isNight}
      />
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col ${readerSession.selectedStory ? 'justify-start' : 'justify-between'} font-sans transition-colors duration-500`}
    >
      {!readerSession.selectedStory && (
        <ApplicationHeader
          currentUser={currentUser}
          hasUnreadChangelog={hasUnreadChangelog}
          isNight={isNight}
          isWhatsNewOpen={showWhatsNewDropdown}
          onAdmin={() => void navigate({ to: '/admin' })}
          onChangelog={() => {
            setShowWhatsNewDropdown(false);
            setShowChangelogModal(true);
          }}
          onCloseWhatsNew={() => setShowWhatsNewDropdown(false)}
          onHome={readerSession.backToLibrary}
          onLogin={() => requestLogin()}
          onLogout={() => void logout()}
          onSettings={() => void navigate({ to: '/settings' })}
          onStats={readerOverlays.openStats}
          onToggleTheme={handleToggleTheme}
          onToggleWhatsNew={toggleWhatsNew}
        />
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 app-modal px-5 py-2.5 rounded-xl shadow-xl flex items-center gap-2 font-semibold text-xs sm:text-sm animate-fade-in">
          <span>{toastMessage}</span>
        </div>
      )}

      <LibraryWorkspace
        bookmarks={readerSession.bookmarks}
        completedStories={readerSession.completedStories}
        currentPageIndex={readerSession.currentPageIndex}
        flipbookRef={readerSession.flipbookRef}
        isThumbnailsOpen={readerOverlays.isThumbnailsOpen}
        personalLibrary={personalLibrary}
        readingTimes={readerSession.readingTimes}
        readingViewRef={readerSession.readingViewRef}
        selectedStory={readerSession.selectedStory}
        settings={settings}
        stories={stories}
        onBackToLibrary={readerSession.backToLibrary}
        onCompleteBook={(story) => readerSession.completeStory(story.id)}
        onOpenOfflineDownload={purchaseFlow.requestOfflineDownload}
        onOpenPayment={purchaseFlow.requestBookPurchase}
        onOpenQuiz={readerOverlays.openQuiz}
        onOpenStats={readerOverlays.openStats}
        onOpenStoryMaker={handleOpenStoryMaker}
        onOpenVoiceRecorder={readerOverlays.openVoiceRecorder}
        onPageChange={readerSession.changePage}
        onSelectStory={readerSession.openStory}
        onTestRestReminder={readerSession.requestRestReminder}
        onToggleBookmark={readerSession.toggleCurrentBookmark}
        onToggleFavorite={handleToggleStoryFavorite}
        onToggleThumbnails={readerOverlays.toggleThumbnails}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Footer */}
      {!readerSession.selectedStory && (
        <footer
          className="w-full text-xs py-3 px-4 text-center border-t z-30 transition-colors duration-500 flex flex-col items-center gap-1 bg-surface border-default text-secondary"
        >
          <p>Buku Cerita Anak Interaktif • Dilengkapi Efek Flipbook 3D, Narasi Suara & Mode Siang/Malam</p>
          <div className="flex items-center justify-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity text-[10px]">
            <span>v{packageJson.version}</span>
            <span>•</span>
            <button onClick={() => setShowChangelogModal(true)} className="underline hover:text-action-secondary transition-colors">Changelog</button>
          </div>
        </footer>
      )}

      <ReaderOverlayModals
        session={readerSession}
        overlays={readerOverlays}
        stories={stories}
        isNight={isNight}
        restMinutes={adminStore.getSettings().eyeRestIntervalMinutes || 20}
        onRequestDownload={purchaseFlow.requestBookPurchase}
        showToast={showToast}
      />

      {/* Admin PIN Prompt Modal */}
      {showAdminPinPrompt && (
        <AdminPinDialog
          isVerifying={isVerifyingAdminPin}
          onVerify={verifyAdminPinAndOpen}
          onCancel={cancelAdminAccess}
        />
      )}

      <PurchaseFlowModals flow={purchaseFlow} isNight={isNight} />

      {/* Parent Login Modal (1 Free Story Limit Enforcer) */}
      {(showLoginModal || loginStoryTarget) && (
        <ParentLoginModal
          attemptedStoryTitle={loginStoryTarget?.title}
          onClose={closeLogin}
          onLoginSuccess={handleLoginSuccess}
          isNight={isNight}
        />
      )}

      {/* Changelog Modal */}
      {showChangelogModal && (
        <ChangelogModal
          onClose={() => setShowChangelogModal(false)}
          isNight={isNight}
        />
      )}
    </div>
  );
}
