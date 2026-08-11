import type { Story } from '@/types';
import type { UserAccount } from '@/utils/userAuthStore';
import { ChangelogModal } from '@/components/ChangelogModal';
import { ParentLoginModal } from '@/components/ParentLoginModal';
import { PurchaseFlowModals } from '@/features/commerce';
import type { PurchaseFlowController } from '@/features/commerce';
import { ReaderOverlayModals } from '@/features/reader';
import { StoryMakerModal } from '@/features/story-maker';
import type {
  ReaderOverlayController,
  ReaderSessionController,
} from '@/features/reader';
import type { ChangelogController } from '@/features/shell/hooks/useChangelogController';

interface ReaderApplicationModalsProps {
  session: ReaderSessionController;
  overlays: ReaderOverlayController;
  purchaseFlow: PurchaseFlowController;
  changelog: ChangelogController;
  stories: Story[];
  isNight: boolean;
  restMinutes: number;
  loginStoryTarget: Story | null;
  showLoginModal: boolean;
  onCloseLogin: () => void;
  onLoginSuccess: (user: UserAccount) => void;
  showToast: (message: string) => void;
}

export function ReaderApplicationModals({
  session,
  overlays,
  purchaseFlow,
  changelog,
  stories,
  isNight,
  restMinutes,
  loginStoryTarget,
  showLoginModal,
  onCloseLogin,
  onLoginSuccess,
  showToast,
}: ReaderApplicationModalsProps) {
  return (
    <>
      <ReaderOverlayModals
        session={session}
        overlays={overlays}
        stories={stories}
        isNight={isNight}
        restMinutes={restMinutes}
        onRequestDownload={purchaseFlow.requestBookPurchase}
        showToast={showToast}
      />
      {overlays.isStoryMakerOpen && (
        <StoryMakerModal
          onClose={overlays.closeStoryMaker}
          onStoryCreated={session.createStory}
        />
      )}
      <PurchaseFlowModals flow={purchaseFlow} isNight={isNight} />
      {(showLoginModal || loginStoryTarget) && (
        <ParentLoginModal
          attemptedStoryTitle={loginStoryTarget?.title}
          onClose={onCloseLogin}
          onLoginSuccess={onLoginSuccess}
          isNight={isNight}
        />
      )}
      {changelog.isModalOpen && (
        <ChangelogModal onClose={changelog.closeModal} isNight={isNight} />
      )}
    </>
  );
}
