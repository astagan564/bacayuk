import { useCallback, useEffect, useState } from 'react';
import type { Story } from '@/types';
import { storyStore } from '@/utils/storyStore';
import { adminAuthApi } from '@/features/admin/api/adminAuthApi';

interface AdminAccessControllerOptions {
  isAdminRoute: boolean;
  onStoriesLoaded: (stories: Story[]) => void;
  onAccessGranted: () => void;
  onAccessCancelled: () => void;
  showToast: (message: string) => void;
}

export function useAdminAccessController({
  isAdminRoute,
  onStoriesLoaded,
  onAccessGranted,
  onAccessCancelled,
  showToast,
}: AdminAccessControllerOptions) {
  const [adminPin, setAdminPin] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (isAdminRoute && !adminPin) setShowPrompt(true);
  }, [adminPin, isAdminRoute]);

  const verifyPin = useCallback(async (pin: string) => {
    setIsVerifying(true);
    try {
      await adminAuthApi.verifyPin(pin);
      onStoriesLoaded(await storyStore.loadAdminStories(pin));
      setAdminPin(pin);
      setShowPrompt(false);
      onAccessGranted();
    } catch (error) {
      showToast(error instanceof Error ? `❌ ${error.message}` : '❌ Tidak dapat memverifikasi PIN Admin.');
    } finally {
      setIsVerifying(false);
    }
  }, [onAccessGranted, onStoriesLoaded, showToast]);

  const cancelAccess = useCallback(() => {
    setShowPrompt(false);
    onAccessCancelled();
  }, [onAccessCancelled]);

  return {
    adminPin,
    showPrompt,
    isVerifying,
    verifyPin,
    cancelAccess,
  };
}
