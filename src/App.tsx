import React, { lazy, Suspense, useCallback, useState, useEffect, useRef } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { Story, StoryPage, ReadingSettings } from './types';
import { FlipbookHandle } from './components/Flipbook3D';
import { ThumbnailGrid } from './components/ThumbnailGrid';
import { StoryMakerModal } from './components/StoryMakerModal';
import { InteractiveQuizModal } from './components/InteractiveQuizModal';
import { RestReminderModal } from './components/RestReminderModal';
import { StatsModal } from './components/StatsModal';
import { VoiceRecorderModal } from './components/VoiceRecorderModal';
import { PaymentGatewayModal } from './components/PaymentGatewayModal';
import { OfflineDownloadModal } from './components/OfflineDownloadModal';
import { ParentLoginModal } from './components/ParentLoginModal';
import { BookCompletionModal } from './components/BookCompletionModal';
import { UserSettingsView } from './components/UserSettings';
import { ParentalGateModal } from './components/ParentalGateModal';
import { ChangelogModal } from './components/ChangelogModal';
import { VipOfferModal } from './components/VipOfferModal';
import { AdminPinDialog } from './features/admin/components/AdminPinDialog';
import { useAdminAccessController } from './features/admin/hooks/useAdminAccessController';
import { useUserSessionController } from './features/account';
import { ApplicationHeader } from './features/shell/components/ApplicationHeader';
import { LibraryWorkspace, useReadingProgressController } from './features/reader';
import { userAuthStore } from './utils/userAuthStore';
import { paymentStore } from './utils/paymentStore';
import { adminStore } from './utils/adminStore';
import { storyStore } from './utils/storyStore';
import { speechEngine } from './utils/speechEngine';
import packageJson from '../package.json';
import confetti from 'canvas-confetti';

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
  const readerStoryId = pathname.match(/^\/read\/([^/]+)$/)?.[1];
  const flipbookRef = useRef<FlipbookHandle>(null);
  const readingViewRef = useRef<HTMLDivElement>(null);
  const [stories, setStories] = useState<Story[]>(() => storyStore.getLocalStories());
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);
  
  const [showVipOfferModal, setShowVipOfferModal] = useState<boolean>(false);
  const [vipSubscriptionGate, setVipSubscriptionGate] = useState<boolean>(false);
  const [vipSubscriptionPayment, setVipSubscriptionPayment] = useState<boolean>(false);

  const [voiceRecorderTarget, setVoiceRecorderTarget] = useState<{
    pageNum: number;
    pageText: string;
  } | null>(null);

  const [paymentStoryTarget, setPaymentStoryTarget] = useState<Story | null>(null);
  const [downloadStoryTarget, setDownloadStoryTarget] = useState<Story | null>(null);
  const [parentalGateTarget, setParentalGateTarget] = useState<Story | null>(null);

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

  const handlePendingStoryReady = useCallback((story: Story) => {
    setSelectedStory(story);
    setCurrentPageIndex(0);
    speechEngine.stop();
    void navigate({ to: '/read/$storyId', params: { storyId: story.id } });
  }, [navigate]);

  const {
    currentUser,
    personalLibrary,
    pendingStory: loginStoryTarget,
    showLoginModal,
    requestLogin,
    closeLogin,
    handleLoginSuccess,
    logout,
    recordRecentStory,
    toggleFavorite: handleToggleStoryFavorite,
  } = useUserSessionController({
    onPendingStoryReady: handlePendingStoryReady,
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
    bookmarks,
    readingTimes,
    completedStories,
    showRestReminder,
    showRestParentalGate,
    showCompletionModal,
    saveBookmark: handleSaveBookmark,
    toggleCurrentBookmark: handleToggleBookmark,
    completeStory: handleCompleteStory,
    resetStats: handleResetStats,
    requestRestReminder,
    requestRestContinuation,
    cancelRestContinuation,
    continueAfterRest,
    dismissRestReminder,
    closeCompletionModal,
  } = useReadingProgressController({
    selectedStory,
    currentPageIndex,
    currentUser,
    isReaderOpen: Boolean(readerStoryId),
    showToast,
  });

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
  }, []);

  const [settings, setSettings] = useState<ReadingSettings>({
    autoPlay: false,
    autoPlayDelay: 4,
    soundFx: true,
    pageAudioFx: true,
    bgMusic: false,
    speechRate: 0.9,
    speechPitch: 1.0,
    fontSize: 'base',
    displayView: 'double',
    themeMode: 'day',
    languageMode: 'id',
  });

  const isNight = settings.themeMode === 'night';

  useEffect(() => {
    if (isNight) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isNight]);
  const [isThumbnailsOpen, setIsThumbnailsOpen] = useState(false);
  const [isStoryMakerOpen, setIsStoryMakerOpen] = useState(false);
  const [activeQuizPage, setActiveQuizPage] = useState<StoryPage | null>(null);

  const handleSelectStory = (story: Story, targetPage?: number) => {
    // Check if online reading is permitted (1 free book for guest, unlimited for logged-in parents)
    if (!userAuthStore.canReadStoryOnline(story.id)) {
      requestLogin(story);
      return;
    }

    // Record read history
    userAuthStore.recordStoryRead(story.id, story.title);

    setSelectedStory(story);
    recordRecentStory(story.id);
    speechEngine.stop();

    const savedPage = targetPage !== undefined ? targetPage : bookmarks[story.id];
    const initialPage = savedPage && savedPage < story.pages.length ? savedPage : 0;
    setCurrentPageIndex(initialPage);

    if (initialPage > 0) {
      showToast(`📖 Melanjutkan dari Halaman ${initialPage + 1}`);
    }

    if (readerStoryId !== story.id) {
      void navigate({ to: '/read/$storyId', params: { storyId: story.id } });
    }
  };

  useEffect(() => {
    if (!readerStoryId) {
      if (pathname === '/' && selectedStory) setSelectedStory(null);
      return;
    }

    const decodedStoryId = decodeURIComponent(readerStoryId);
    if (selectedStory?.id === decodedStoryId) return;
    const routeStory = stories.find((story) => story.id === decodedStoryId);
    if (routeStory) handleSelectStory(routeStory);
  }, [pathname, readerStoryId, selectedStory?.id, stories]);

  const handleBackToLibrary = () => {
    setSelectedStory(null);
    speechEngine.stop();
    void navigate({ to: '/' });
  };

  const handlePageChange = (newIndex: number) => {
    speechEngine.stop();
    setCurrentPageIndex(newIndex);

    // On phones a story page is taller than the viewport. Begin every newly
    // selected page at its illustration rather than retaining the old scroll.
    if (window.matchMedia('(max-width: 1023px)').matches) {
      window.requestAnimationFrame(() => {
        readingViewRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
      });
    }

    if (selectedStory) {
      const totalPages = selectedStory.pages.length;
      // Completion is explicit on the back cover so children can take the
      // vocabulary quiz before the book is marked as finished.
      if (newIndex < totalPages) {
        handleSaveBookmark(selectedStory.id, newIndex);
      }
    }
  };

  const handleUpdateSettings = (newSettings: Partial<ReadingSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleToggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      themeMode: prev.themeMode === 'night' ? 'day' : 'night',
    }));
  };

  const handleStoryCreated = (newStory: Story) => {
    setStories((prev) => {
      const updated = [newStory, ...prev];
      storyStore.saveStories(updated, adminPin || undefined);
      return updated;
    });
    setSelectedStory(newStory);
    setCurrentPageIndex(0);
    void navigate({ to: '/read/$storyId', params: { storyId: newStory.id } });
  };

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
      className={`min-h-screen flex flex-col ${selectedStory ? 'justify-start' : 'justify-between'} font-sans transition-colors duration-500`}
      >
      {!selectedStory && (
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
          onHome={handleBackToLibrary}
          onLogin={() => requestLogin()}
          onLogout={() => void logout()}
          onSettings={() => void navigate({ to: '/settings' })}
          onStats={() => setShowStatsModal(true)}
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
        bookmarks={bookmarks}
        completedStories={completedStories}
        currentPageIndex={currentPageIndex}
        flipbookRef={flipbookRef}
        isNight={isNight}
        isThumbnailsOpen={isThumbnailsOpen}
        personalLibrary={personalLibrary}
        readingTimes={readingTimes}
        readingViewRef={readingViewRef}
        selectedStory={selectedStory}
        settings={settings}
        stories={stories}
        onBackToLibrary={handleBackToLibrary}
        onCompleteBook={(story) => {
          handleCompleteStory(story.id);
        }}
        onOpenOfflineDownload={(story) => {
          if (userAuthStore.isVip() || paymentStore.isStoryPurchased(story.id)) {
            setDownloadStoryTarget(story);
          } else {
            setPaymentStoryTarget(story);
          }
        }}
        onOpenPayment={(story) => {
          if (userAuthStore.isVip()) setDownloadStoryTarget(story);
          else setParentalGateTarget(story);
        }}
        onOpenQuiz={(story, pageIndex) => {
          const page = story.pages[pageIndex];
          if (page) setActiveQuizPage(page);
        }}
        onOpenStats={() => setShowStatsModal(true)}
        onOpenStoryMaker={() => {
          const user = userAuthStore.getUser();
          if (!user) {
            showToast('🔒 Silakan Masuk (Login) Akun Orang Tua terlebih dahulu untuk menggunakan fitur AI.');
            requestLogin();
          } else if (userAuthStore.isVip()) {
            if ((user.aiStoriesUsed || 0) >= 10) showToast('Kuota buat cerita bulan ini sudah habis.');
            else setIsStoryMakerOpen(true);
          } else {
            setShowVipOfferModal(true);
          }
        }}
        onOpenVoiceRecorder={(story, pageIndex) => {
          const page = story.pages[pageIndex];
          if (page) setVoiceRecorderTarget({ pageNum: page.pageNumber, pageText: page.text });
        }}
        onPageChange={handlePageChange}
        onSelectStory={handleSelectStory}
        onTestRestReminder={requestRestReminder}
        onToggleBookmark={handleToggleBookmark}
        onToggleFavorite={handleToggleStoryFavorite}
        onToggleThumbnails={() => setIsThumbnailsOpen(!isThumbnailsOpen)}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Footer */}
      {!selectedStory && (
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

      {/* Thumbnail Drawer Modal */}
      {isThumbnailsOpen && selectedStory && (
        <ThumbnailGrid
          story={selectedStory}
          currentPageIndex={currentPageIndex}
          onSelectPage={handlePageChange}
          onClose={() => setIsThumbnailsOpen(false)}
          isNight={isNight}
        />
      )}

      {/* AI Story Maker Modal */}
      {isStoryMakerOpen && (
        <StoryMakerModal
          onClose={() => setIsStoryMakerOpen(false)}
          onStoryCreated={handleStoryCreated}
        />
      )}

      {/* Interactive Quiz Modal */}
      {activeQuizPage && activeQuizPage.quizQuestion && (
        <InteractiveQuizModal
          quiz={activeQuizPage.quizQuestion}
          onClose={() => setActiveQuizPage(null)}
        />
      )}

      {/* 20-Minute Rest Reminder Modal */}
      {showRestReminder && (
        <RestReminderModal
          restMinutes={adminStore.getSettings().eyeRestIntervalMinutes || 20}
          onCloseAndContinue={requestRestContinuation}
          onCloseAndGoLibrary={() => {
            dismissRestReminder();
            handleBackToLibrary();
          }}
          isNight={isNight}
        />
      )}

      {/* Parental Gate for Rest Reminder */}
      {showRestParentalGate && (
        <ParentalGateModal
          onSuccess={continueAfterRest}
          onCancel={cancelRestContinuation}
          isNight={isNight}
        />
      )}

      {/* Admin PIN Prompt Modal */}
      {showAdminPinPrompt && (
        <AdminPinDialog
          isVerifying={isVerifyingAdminPin}
          onVerify={verifyAdminPinAndOpen}
          onCancel={cancelAdminAccess}
        />
      )}

      {/* 14. Modals */}
      {showVipOfferModal && (
        <VipOfferModal
          onClose={() => setShowVipOfferModal(false)}
          onSubscribe={() => {
            setShowVipOfferModal(false);
            setVipSubscriptionGate(true); // Open parental gate before payment
          }}
        />
      )}

      {vipSubscriptionGate && (
        <ParentalGateModal
          onCancel={() => setVipSubscriptionGate(false)}
          onSuccess={() => {
            setVipSubscriptionGate(false);
            setVipSubscriptionPayment(true);
          }}
        />
      )}

      {vipSubscriptionPayment && (
        <PaymentGatewayModal
          isVipOnly={true}
          onClose={() => setVipSubscriptionPayment(false)}
          onPaymentSuccess={(receipt) => {
            setVipSubscriptionPayment(false);
            setToastMessage('🎉 Pembayaran VIP Berhasil! Fitur AI telah terbuka.');
            setTimeout(() => setToastMessage(null), 5000);
            
            // Activate VIP in store
            userAuthStore.activateVip();
            setIsStoryMakerOpen(true);
          }}
        />
      )}

      {/* Reading Statistics Modal */}
      {showStatsModal && (
        <StatsModal
          stories={stories}
          readingTimes={readingTimes}
          bookmarks={bookmarks}
          onClose={() => setShowStatsModal(false)}
          onResetStats={handleResetStats}
          isNight={isNight}
        />
      )}

      {/* Voice Recorder Modal */}
      {voiceRecorderTarget && selectedStory && (
        <VoiceRecorderModal
          storyId={selectedStory.id}
          storyTitle={selectedStory.title}
          pageNumber={voiceRecorderTarget.pageNum}
          pageText={voiceRecorderTarget.pageText}
          onClose={() => setVoiceRecorderTarget(null)}
          onSaved={() => {
            showToast('🎙️ Rekaman suara narasi halaman tersimpan!');
          }}
          isNight={isNight}
        />
      )}

      {/* Parental Gate Modal (Math Challenge for Parents before Payment) */}
      {parentalGateTarget && (
        <ParentalGateModal
          onSuccess={() => {
            const target = parentalGateTarget;
            setParentalGateTarget(null);
            setPaymentStoryTarget(target);
          }}
          onCancel={() => setParentalGateTarget(null)}
          isNight={isNight}
        />
      )}

      {/* Payment Gateway Modal (Midtrans Simulation) */}
      {paymentStoryTarget && (
        <PaymentGatewayModal
          story={paymentStoryTarget}
          onClose={() => setPaymentStoryTarget(null)}
          onPaymentSuccess={(receipt) => {
            const target = paymentStoryTarget;
            setPaymentStoryTarget(null);
            setDownloadStoryTarget(target);
            showToast(`🎉 Pembayaran berhasil! Akses unduhan offline untuk ${receipt.storyTitle} telah aktif.`);
          }}
          isNight={isNight}
        />
      )}

      {/* Offline Download Modal (PDF & EPUB with Social Watermark) */}
      {downloadStoryTarget && (
        <OfflineDownloadModal
          story={downloadStoryTarget}
          onClose={() => setDownloadStoryTarget(null)}
          isNight={isNight}
        />
      )}

      {/* Book Completion Appreciation Celebration Modal */}
      {showCompletionModal && selectedStory && (
        <BookCompletionModal
          story={selectedStory}
          onClose={closeCompletionModal}
          onReadAgain={() => {
            closeCompletionModal();
            setCurrentPageIndex(0);
          }}
          onBackToCatalog={() => {
            closeCompletionModal();
            handleBackToLibrary();
          }}
          onOpenQuiz={() => {
            closeCompletionModal();
            const lastPage = selectedStory.pages[selectedStory.pages.length - 1];
            if (lastPage) {
              setActiveQuizPage(lastPage);
            }
          }}
          onOpenOfflineDownload={() => {
            closeCompletionModal();
            if (userAuthStore.isVip() || paymentStore.isStoryPurchased(selectedStory.id)) {
              setDownloadStoryTarget(selectedStory);
            } else {
              setParentalGateTarget(selectedStory);
            }
          }}
          isNight={isNight}
        />
      )}



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
