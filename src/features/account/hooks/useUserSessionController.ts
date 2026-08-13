import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { Story } from '@/types';
import { userAuthStore } from '@/utils/userAuthStore';
import type { UserAccount } from '@/utils/userAuthStore';
import {
  personalLibraryStore,
} from '@/features/account/stores/personalLibraryStore';

interface UserSessionControllerOptions {
  showToast: (message: string) => void;
}

export function useUserSessionController({
  showToast,
}: UserSessionControllerOptions) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => userAuthStore.getUser());
  const [personalLibrary, setPersonalLibrary] = useState(() =>
    personalLibraryStore.load(userAuthStore.getUser()?.id)
  );
  const [pendingStory, setPendingStory] = useState<Story | null>(null);
  const [readyStory, setReadyStory] = useState<Story | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    setPersonalLibrary(personalLibraryStore.load(currentUser?.id));
  }, [currentUser?.id]);

  useEffect(() => {
    let active = true;
    const applyAuthenticatedUser = (user: UserAccount | null) => {
      if (!active) return;
      setCurrentUser(user);
      if (user) {
        const pendingStoryId = userAuthStore.consumeStoryAfterLogin();
        if (pendingStoryId) {
          void navigate({ to: '/read/$storyId', params: { storyId: pendingStoryId } });
        }
      }
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
  }, [navigate]);

  const requestLogin = useCallback((story?: Story) => {
    userAuthStore.rememberStoryAfterLogin(story?.id);
    if (story) setPendingStory(story);
    else setShowLoginModal(true);
  }, []);

  const closeLogin = useCallback(() => {
    userAuthStore.rememberStoryAfterLogin();
    setShowLoginModal(false);
    setPendingStory(null);
  }, []);

  const handleLoginSuccess = useCallback(async (user: UserAccount) => {
    const refreshedUser = await userAuthStore.refreshEntitlements();
    setCurrentUser(refreshedUser || user);
    setShowLoginModal(false);
    showToast(`Selamat datang, ${user.name}! Seluruh koleksi cerita kini terbuka.`);

    if (!pendingStory) return;
    const nextLibrary = personalLibraryStore.recordRecent(
      personalLibraryStore.load(user.id),
      pendingStory.id,
    );
    personalLibraryStore.save(nextLibrary, user.id);
    setPersonalLibrary(nextLibrary);
    void userAuthStore.recordStoryRead(pendingStory.id, pendingStory.title);
    const storyToOpen = pendingStory;
    setPendingStory(null);
    setReadyStory(storyToOpen);
  }, [pendingStory, showToast]);

  const logout = useCallback(async () => {
    try {
      await userAuthStore.logout();
      setCurrentUser(null);
      showToast('👋 Berhasil keluar dari Akun Orang Tua');
    } catch (error) {
      console.error('Failed to sign out:', error);
      showToast('Keluar akun gagal. Coba lagi.');
    }
  }, [showToast]);

  const recordRecentStory = useCallback((storyId: string) => {
    setPersonalLibrary((currentLibrary) => {
      const nextLibrary = personalLibraryStore.recordRecent(currentLibrary, storyId);
      personalLibraryStore.save(nextLibrary, currentUser?.id);
      return nextLibrary;
    });
  }, [currentUser?.id]);

  const toggleFavorite = useCallback((storyId: string) => {
    setPersonalLibrary((currentLibrary) => {
      const nextLibrary = personalLibraryStore.toggleFavorite(currentLibrary, storyId);
      personalLibraryStore.save(nextLibrary, currentUser?.id);
      return nextLibrary;
    });
  }, [currentUser?.id]);

  const clearReadyStory = useCallback(() => setReadyStory(null), []);

  return {
    currentUser,
    personalLibrary,
    pendingStory,
    readyStory,
    showLoginModal,
    requestLogin,
    closeLogin,
    handleLoginSuccess,
    logout,
    recordRecentStory,
    toggleFavorite,
    clearReadyStory,
  };
}
