import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { Story, StoryPage, ReadingSettings } from './types';
import { Flipbook3D, FlipbookHandle } from './components/Flipbook3D';
import { NavigationControls } from './components/NavigationControls';
import { StorySelector } from './components/StorySelector';
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
import { userAuthStore, UserAccount } from './utils/userAuthStore';
import { paymentStore } from './utils/paymentStore';
import { adminStore } from './utils/adminStore';
import { storyStore } from './utils/storyStore';
import { userSettingsStore } from './utils/userSettingsStore';
import { speechEngine } from './utils/speechEngine';
import { PersonalLibrary, personalLibraryStore } from './utils/personalLibraryStore';
import packageJson from '../package.json';
import bacaYukLogo from './assets/bacayuk-logo.svg';
import bacaYukMark from './assets/bacayuk-mark.svg';
import confetti from 'canvas-confetti';
import { Sparkles, BookOpen, Award, Sun, Moon, Bookmark, BarChart3, Clock, User, LogOut, ShieldCheck, Settings, Bell } from 'lucide-react';

const AdminDashboard = lazy(() =>
  import('./components/AdminDashboard').then((module) => ({ default: module.AdminDashboard }))
);

export default function App() {
  const flipbookRef = useRef<FlipbookHandle>(null);
  const readingViewRef = useRef<HTMLDivElement>(null);
  const [stories, setStories] = useState<Story[]>(() => storyStore.getLocalStories());
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  // Bookmarks stored in localStorage as { [storyId: string]: number }
  const [bookmarks, setBookmarks] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('buku_cerita_bookmarks');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Reading time tracking in seconds per story { [storyId: string]: number }
  const [readingTimes, setReadingTimes] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('buku_cerita_reading_times');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Completed stories tracking { [storyId: string]: boolean }
  const [completedStories, setCompletedStories] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('buku_cerita_completed_stories');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);

  const markStoryCompleted = (storyId: string) => {
    setCompletedStories((prev) => {
      const updated = { ...prev, [storyId]: true };
      try {
        localStorage.setItem('buku_cerita_completed_stories', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save completed stories:', e);
      }
      return updated;
    });

    // Reset bookmark for this story so it doesn't get stuck on "Lanjutkan Halaman X"
    setBookmarks((prev) => {
      const updated = { ...prev };
      delete updated[storyId];
      try {
        localStorage.setItem('buku_cerita_bookmarks', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to reset bookmark:', e);
      }
      return updated;
    });
  };

  const [continuousReadingSeconds, setContinuousReadingSeconds] = useState<number>(0);
  const [showRestReminder, setShowRestReminder] = useState<boolean>(false);
  const [showRestParentalGate, setShowRestParentalGate] = useState<boolean>(false);
  const [showAdminPinPrompt, setShowAdminPinPrompt] = useState<boolean>(false);
  const [adminPin, setAdminPin] = useState<string>('');
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

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => userAuthStore.getUser());
  const [personalLibrary, setPersonalLibrary] = useState<PersonalLibrary>(() => personalLibraryStore.load(userAuthStore.getUser()?.id));
  const [loginStoryTarget, setLoginStoryTarget] = useState<Story | null>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'main' | 'admin' | 'userSettings'>('main');
  const [showChangelogModal, setShowChangelogModal] = useState<boolean>(false);
  const [showWhatsNewDropdown, setShowWhatsNewDropdown] = useState(false);
  const [hasUnreadChangelog, setHasUnreadChangelog] = useState(() => {
    return localStorage.getItem('bacayuk_last_seen_version') !== packageJson.version;
  });

  useEffect(() => {
    setPersonalLibrary(personalLibraryStore.load(currentUser?.id));
  }, [currentUser?.id]);

  useEffect(() => {
    let active = true;
    const applyAuthenticatedUser = (user: UserAccount | null) => {
      if (!active) return;
      setCurrentUser(user);
      if (user?.email) void paymentStore.syncPurchasesFromSupabase(user.email);
    };
    const subscription = userAuthStore.onAuthStateChange(applyAuthenticatedUser);
    void userAuthStore.initialize().then(applyAuthenticatedUser).catch((error) => {
      console.error('Failed to initialize Supabase Auth session:', error);
      applyAuthenticatedUser(null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const verifyAdminPinAndOpen = async (pin: string) => {
    try {
      const response = await fetch('/api/verify-admin-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const result = await response.json();

      if (response.ok && result.ok) {
        setAdminPin(pin);
        const adminStories = await storyStore.loadAdminStories(pin);
        setStories(adminStories);
        setShowAdminPinPrompt(false);
        setCurrentView('admin');
        return;
      }

      showToast(result.error || '❌ PIN Admin salah!');
    } catch {
      showToast('❌ Tidak dapat memverifikasi PIN Admin.');
    }

    setShowAdminPinPrompt(false);
  };

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

  // Interval timer tracking active reading duration
  useEffect(() => {
    if (!selectedStory || showRestReminder || currentView !== 'main') return;

    const interval = setInterval(() => {
      const userSettings = userSettingsStore.getSettings();
      const eyeRestMinutes = userSettings.restIntervalMinutes || adminStore.getSettings().eyeRestIntervalMinutes || 20;
      const targetSeconds = eyeRestMinutes * 60;

      if (document.visibilityState === 'visible') {
        setReadingTimes((prev) => {
          const newTime = (prev[selectedStory.id] || 0) + 1;
          const updated = { ...prev, [selectedStory.id]: newTime };
          try {
            localStorage.setItem('buku_cerita_reading_times', JSON.stringify(updated));
          } catch (e) {
            console.warn('Failed to save reading time:', e);
          }
          return updated;
        });

        setContinuousReadingSeconds((prev) => {
          const updated = prev + 1;
          if (updated >= targetSeconds) {
            setShowRestReminder(true);
          }
          return updated;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedStory, showRestReminder]);

  // Log active reading activity for Admin Dashboard reading logs
  useEffect(() => {
    if (selectedStory) {
      adminStore.logUserReading({
        userId: currentUser ? currentUser.id : 'guest_session',
        userName: currentUser ? currentUser.name : 'Pengunjung Tamu',
        userEmail: currentUser ? currentUser.email : 'guest@bukucerita.id',
        storyId: selectedStory.id,
        storyTitle: selectedStory.title,
        lastPageRead: currentPageIndex + 1,
        totalPages: selectedStory.pages.length,
        isCompleted: completedStories[selectedStory.id] || false,
        updatedAt: new Date().toISOString(),
      });
    }
  }, [selectedStory, currentPageIndex, currentUser, completedStories]);

  const handleResetStats = () => {
    setReadingTimes({});
    try {
      localStorage.removeItem('buku_cerita_reading_times');
    } catch (e) {
      console.warn('Failed to reset reading times:', e);
    }
    showToast('📊 Catatan statistik membaca telah direset');
  };

  const handleSaveBookmark = (storyId: string, pageIndex: number) => {
    const updated = { ...bookmarks, [storyId]: pageIndex };
    setBookmarks(updated);
    try {
      localStorage.setItem('buku_cerita_bookmarks', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save bookmark:', e);
    }
  };

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
      setLoginStoryTarget(story);
      return;
    }

    // Record read history
    userAuthStore.recordStoryRead(story.id, story.title);

    setSelectedStory(story);
    setPersonalLibrary((previous) => {
      const next = personalLibraryStore.recordRecent(previous, story.id);
      personalLibraryStore.save(next, currentUser?.id);
      return next;
    });
    speechEngine.stop();

    const savedPage = targetPage !== undefined ? targetPage : bookmarks[story.id];
    const initialPage = savedPage && savedPage < story.pages.length ? savedPage : 0;
    setCurrentPageIndex(initialPage);

    if (initialPage > 0) {
      showToast(`📖 Melanjutkan dari Halaman ${initialPage + 1}`);
    }
  };

  const handleToggleStoryFavorite = (storyId: string) => {
    setPersonalLibrary((previous) => {
      const next = personalLibraryStore.toggleFavorite(previous, storyId);
      personalLibraryStore.save(next, currentUser?.id);
      return next;
    });
  };

  const handleBackToLibrary = () => {
    setSelectedStory(null);
    speechEngine.stop();
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

  const handleToggleBookmark = () => {
    if (!selectedStory) return;
    const currentSaved = bookmarks[selectedStory.id];
    if (currentSaved === currentPageIndex) {
      // Remove bookmark
      const updated = { ...bookmarks };
      delete updated[selectedStory.id];
      setBookmarks(updated);
      try {
        localStorage.setItem('buku_cerita_bookmarks', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to delete bookmark:', e);
      }
      showToast('🔖 Penanda halaman dihapus');
    } else {
      handleSaveBookmark(selectedStory.id, currentPageIndex);
      showToast(`🔖 Halaman ${currentPageIndex + 1} ditandai!`);
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
  };

  if (currentView === 'admin') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-surface" />}>
        <AdminDashboard
          stories={stories}
          adminPin={adminPin}
          onUpdateStories={async (updatedStories) => {
          try {
            const savedStories = await storyStore.saveStories(updatedStories, adminPin || undefined);
            setStories(savedStories);
          } catch (error) {
            setStories(storyStore.getLocalStories());
            throw error;
          }
        }}
        onBackToHome={async () => {
          const publicStories = await storyStore.loadStories();
          setStories(publicStories);
          setCurrentView('main');
        }}
        isNight={isNight}
        />
      </Suspense>
    );
  }

  if (currentView === 'userSettings') {
    return (
      <UserSettingsView 
        onBack={() => setCurrentView('main')}
        isNight={isNight}
      />
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col ${selectedStory ? 'justify-start' : 'justify-between'} font-sans transition-colors duration-500`}
      >
      {/* Top Main Navigation Bar */}
      {!selectedStory && (
      <header
        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-b flex items-center justify-between gap-2 z-40 transition-colors duration-500 backdrop-blur-xl header-surface"
      >
        <div
          onClick={handleBackToLibrary}
            className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5 cursor-pointer transition-opacity hover:opacity-85"
        >
          <img src={bacaYukMark} alt="BacaYuk" className="h-10 w-10 shrink-0 sm:hidden" />
          <div className="hidden min-w-0 flex-col justify-center sm:flex">
            <img src={bacaYukLogo} alt="BacaYuk" className="h-10 w-auto max-w-[150px]" />
            <p
              className="ml-[48px] -mt-2 text-[11px] font-semibold text-secondary"
            >
              Perpustakaan cerita keluarga
            </p>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-1 sm:gap-2">
          {/* Parent Auth Profile Status */}
          {currentUser ? (
            <div className={`${selectedStory ? 'hidden sm:flex' : 'flex'} items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold auth-chip`}>
              <User className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline truncate max-w-[120px]">{currentUser.name}</span>
              <button
                onClick={async () => {
                  try {
                    await userAuthStore.logout();
                    setCurrentUser(null);
                    showToast('👋 Berhasil keluar dari Akun Orang Tua');
                  } catch (error) {
                    console.error('Failed to sign out:', error);
                    showToast('Keluar akun gagal. Coba lagi.');
                  }
                }}
                className="p-1 hover:bg-black/10 rounded-lg text-inherit transition-colors ml-0.5"
                title="Keluar Akun Orang Tua"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className={`btn-primary ${selectedStory ? 'hidden sm:flex' : 'flex'} items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs shrink-0`}
              title="Daftar/Masuk Akun Gratis Orang Tua"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Masuk orang tua</span>
            </button>
          )}

          {/* What's New Button */}
          <div className={`${selectedStory ? 'hidden sm:block' : 'block'} relative`}>
            <button
              onClick={toggleWhatsNew}
              className="relative flex items-center justify-center p-2 rounded-xl transition-colors icon-btn-surface"
              title="Apa yang Baru?"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {hasUnreadChangelog && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border border-default animate-pulse"></span>
              )}
            </button>
            
            {showWhatsNewDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowWhatsNewDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-64 sm:w-72 rounded-2xl shadow-xl overflow-hidden z-50 app-modal">
                  <div className="p-3 sm:p-4 border-b border-default bg-surface/50">
                    <h3 className="text-sm sm:text-base font-bold flex items-center gap-2 text-primary">
                      <Sparkles className="w-4 h-4 text-warning" />
                      Update Terbaru v{packageJson.version}
                    </h3>
                  </div>
                  <div className="p-3 sm:p-4 text-xs sm:text-sm space-y-2 text-secondary">
                    <ul className="list-disc pl-4 space-y-1">
                      <li><strong>Buat buku lebih cepat</strong> dari ide atau naskah singkat.</li>
                      <li><strong>Mode baca baru</strong> menampilkan gambar kiri dan teks kanan.</li>
                      <li><strong>Terjemahan, suara, kuis, dan ilustrasi</strong> kini lebih akurat.</li>
                    </ul>
                  </div>
                  <div className="p-3 border-t border-default bg-surface/50">
                    <button
                      onClick={() => {
                        setShowWhatsNewDropdown(false);
                        setShowChangelogModal(true);
                      }}
                      className="w-full py-2 px-4 btn-secondary text-xs sm:text-sm"
                    >
                      Lihat detail
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Settings Button */}
          <button
            onClick={() => setCurrentView('userSettings')}
            className={`${selectedStory ? 'hidden md:flex' : 'flex'} items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-transform hover:scale-[1.02] shrink-0 auth-chip hover:bg-surface`}
            title="Pengaturan Orang Tua"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Pengaturan</span>
          </button>

          {/* Admin Dashboard Button */}
          <button
            onClick={() => setShowAdminPinPrompt(true)}
            className={`${selectedStory ? 'hidden md:flex' : 'hidden sm:flex'} items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-transform hover:scale-[1.02] shrink-0 auth-chip hover:bg-surface text-secondary`}
            title="Buka Panel Kontrol Admin Internal"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Admin</span>
          </button>

          {/* Stats Modal Toggle Button */}
          <button
            onClick={() => setShowStatsModal(true)}
            className={`${selectedStory ? 'hidden md:flex' : 'hidden sm:flex'} items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 hover:scale-[1.02] auth-chip hover:bg-surface`}
            title="Lihat Statistik Membaca Anak"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Statistik</span>
          </button>

          {/* Day / Night Theme Toggle Button */}
          <button
            onClick={handleToggleTheme}
            className="flex items-center justify-center gap-2 w-10 sm:w-auto px-0 sm:px-3 py-2 sm:py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 hover:scale-[1.02] shrink-0 auth-chip hover:bg-surface"
            title={isNight ? 'Beralih ke Mode Siang' : 'Beralih ke Mode Malam'}
          >
            {isNight ? (
              <>
                <Moon className="w-4 h-4 fill-current" />
                <span className="hidden sm:inline">Malam</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4" />
                <span className="hidden sm:inline">Siang</span>
              </>
            )}
          </button>

          {selectedStory && (
            <button
              onClick={handleBackToLibrary}
              className="hidden sm:inline-flex px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-colors shadow-sm auth-chip hover:bg-surface"
            >
              Pilih Cerita
            </button>
          )}
        </div>
      </header>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 app-modal px-5 py-2.5 rounded-xl shadow-xl flex items-center gap-2 font-semibold text-xs sm:text-sm animate-fade-in">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 w-full flex flex-col items-center ${selectedStory ? 'justify-start py-2 sm:py-3 lg:h-[100dvh] lg:min-h-0' : 'justify-center py-4'}`}>
        {!selectedStory ? (
          /* Shelf / Story Selector View */
          <StorySelector
            stories={stories}
            bookmarks={bookmarks}
            completedStories={completedStories}
            readingTimes={readingTimes}
            favoriteStoryIds={personalLibrary.favoriteStoryIds}
            recentStoryIds={personalLibrary.recentStoryIds}
            onSelectStory={handleSelectStory}
            onToggleFavorite={handleToggleStoryFavorite}
            onOpenStoryMaker={() => {
              const user = userAuthStore.getUser();

              if (!user) {
                setToastMessage('🔒 Silakan Masuk (Login) Akun Orang Tua terlebih dahulu untuk menggunakan fitur AI.');
                setTimeout(() => setToastMessage(null), 4000);
                setShowLoginModal(true);
                return;
              }

              const isVipUser = userAuthStore.isVip();
              if (isVipUser) {
                if ((user.aiStoriesUsed || 0) >= 10) {
                  setToastMessage('Kuota buat cerita bulan ini sudah habis.');
                  setTimeout(() => setToastMessage(null), 5000);
                  return;
                }
                setIsStoryMakerOpen(true);
              } else {
                setShowVipOfferModal(true);
              }
            }}
            onOpenStatsModal={() => setShowStatsModal(true)}
            onOpenPaymentModal={(story) => {
              if (userAuthStore.isVip()) {
                setDownloadStoryTarget(story);
              } else {
                setParentalGateTarget(story);
              }
            }}
            onOpenOfflineDownloadModal={(story) => {
              if (userAuthStore.isVip()) {
                setDownloadStoryTarget(story);
              } else {
                setDownloadStoryTarget(story); // OfflineDownloadModal will handle purchase check inside, wait actually StorySelector handles it
              }
            }}
            onTestRestReminder={() => setShowRestReminder(true)}
            isNight={isNight}
          />
        ) : (
          /* Interactive Flipbook Reading View */
          <div ref={readingViewRef} className="w-full reader-fade-in flex flex-col lg:h-full lg:min-h-0 lg:flex-row lg:items-stretch lg:gap-3 lg:px-4 lg:py-2">
            {/* Flipbook column */}
            <div className="flex-1 min-w-0 flex flex-col items-center lg:h-full lg:min-h-0">
              <Flipbook3D
                ref={flipbookRef}
                story={selectedStory}
                currentPageIndex={currentPageIndex}
                onPageChange={handlePageChange}
                settings={settings}
                onCompleteBook={() => {
                  markStoryCompleted(selectedStory.id);
                  setShowCompletionModal(true);
                }}
              />
              {/* Mobile bottom spacer — prevents content hiding behind the fixed bar */}
              <div className="lg:hidden h-36 max-[380px]:h-48 w-full shrink-0" />
            </div>

            {/* Sidebar (desktop) + Bottom bar (mobile) */}
            <NavigationControls
              title={selectedStory.title}
              currentPageIndex={currentPageIndex}
              totalPages={selectedStory.pages.length}
              onPageChange={handlePageChange}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onToggleThumbnails={() => setIsThumbnailsOpen(!isThumbnailsOpen)}
              onBackToLibrary={handleBackToLibrary}
              isBookmarked={bookmarks[selectedStory.id] === currentPageIndex}
              savedBookmarkPage={bookmarks[selectedStory.id]}
              onToggleBookmark={handleToggleBookmark}
              onOpenVoiceRecorder={() => {
                const currentPage = selectedStory.pages[currentPageIndex];
                if (currentPage) {
                  setVoiceRecorderTarget({
                    pageNum: currentPage.pageNumber,
                    pageText: currentPage.text,
                  });
                }
              }}
              onOpenOfflineDownload={() => {
                if (userAuthStore.isVip() || paymentStore.isStoryPurchased(selectedStory.id)) {
                  setDownloadStoryTarget(selectedStory);
                } else {
                  setPaymentStoryTarget(selectedStory);
                }
              }}
              isBackCover={currentPageIndex >= selectedStory.pages.length}
              onReadPage={selectedStory.pages[currentPageIndex] ? () => flipbookRef.current?.readCurrentPage() : undefined}
              onOpenQuiz={selectedStory.pages[currentPageIndex]?.quizQuestion ? () => setActiveQuizPage(selectedStory.pages[currentPageIndex]) : undefined}
            />
          </div>
        )}
      </main>

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
          onCloseAndContinue={() => {
            setShowRestParentalGate(true);
          }}
          onCloseAndGoLibrary={() => {
            setShowRestReminder(false);
            setContinuousReadingSeconds(0);
            handleBackToLibrary();
          }}
          isNight={isNight}
        />
      )}

      {/* Parental Gate for Rest Reminder */}
      {showRestParentalGate && (
        <ParentalGateModal
          onSuccess={() => {
            setShowRestParentalGate(false);
            setShowRestReminder(false);
            setContinuousReadingSeconds(0);
            showToast('✅ Berhasil diverifikasi. Silakan lanjutkan membaca!');
          }}
          onCancel={() => setShowRestParentalGate(false)}
          isNight={isNight}
        />
      )}

      {/* Admin PIN Prompt Modal */}
      {showAdminPinPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl p-6 shadow-2xl overflow-hidden z-50 flex flex-col gap-4 app-modal">
            <h3 className="text-lg font-extrabold font-sans mb-0 text-center flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-blue" />
              Otentikasi Admin
            </h3>
            <p className="text-xs text-center opacity-80">Area Admin</p>
            <input 
              type="password" 
              autoFocus
              className="w-full px-4 py-3 rounded-xl border-default text-center font-extrabold tracking-[0.5em] text-lg focus:outline-none reader-field"
              placeholder="••••"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  verifyAdminPinAndOpen(e.currentTarget.value);
                }
              }}
            />
            <div className="flex gap-2 mt-2">
              <button 
                onClick={() => {
                  const input = document.querySelector('input[type="password"]') as HTMLInputElement;
                  verifyAdminPinAndOpen(input?.value || '');
                }} 
                className="btn-primary flex-1 py-3 text-xs"
              >
                Masuk
              </button>
              <button 
                onClick={() => setShowAdminPinPrompt(false)} 
                className="flex-1 py-3 rounded-xl font-bold text-xs btn-secondary"
              >
                Batal
              </button>
            </div>
            <p className="text-[10px] text-center opacity-50 mt-1">Masukkan PIN anda</p>
          </div>
        </div>
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

      {isStoryMakerOpen && (
        <StoryMakerModal
          onClose={() => setIsStoryMakerOpen(false)}
          onStoryCreated={handleStoryCreated}
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
          onClose={() => setShowCompletionModal(false)}
          onReadAgain={() => {
            setShowCompletionModal(false);
            setCurrentPageIndex(0);
          }}
          onBackToCatalog={() => {
            setShowCompletionModal(false);
            setSelectedStory(null);
          }}
          onOpenQuiz={() => {
            setShowCompletionModal(false);
            const lastPage = selectedStory.pages[selectedStory.pages.length - 1];
            if (lastPage) {
              setActiveQuizPage(lastPage);
            }
          }}
          onOpenOfflineDownload={() => {
            setShowCompletionModal(false);
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
          onClose={() => {
            setShowLoginModal(false);
            setLoginStoryTarget(null);
          }}
          onLoginSuccess={async (user) => {
            await paymentStore.syncPurchasesFromSupabase(user.email);
            setCurrentUser(user);
            setShowLoginModal(false);
            showToast(`Selamat datang, ${user.name}! Seluruh koleksi cerita kini terbuka.`);
            if (loginStoryTarget) {
              const pendingStory = loginStoryTarget;
              setLoginStoryTarget(null);
              // Open story after login
              userAuthStore.recordStoryRead(pendingStory.id, pendingStory.title);
              setSelectedStory(pendingStory);
              setCurrentPageIndex(0);
            }
          }}
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
