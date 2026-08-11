import { lazy, Suspense, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { Dispatch, SetStateAction } from 'react';
import type { Story } from '@/types';
import { AdminPinDialog } from '@/features/admin/components/AdminPinDialog';
import { useAdminAccessController } from '@/features/admin/hooks/useAdminAccessController';

const AdminRouteWorkspace = lazy(() =>
  import('@/features/admin/components/AdminRouteWorkspace').then((module) => ({
    default: module.AdminRouteWorkspace,
  })),
);

interface AdminApplicationRouteProps {
  stories: Story[];
  onStoriesChange: Dispatch<SetStateAction<Story[]>>;
  showToast: (message: string) => void;
}

export function AdminApplicationRoute({
  stories,
  onStoriesChange,
  showToast,
}: AdminApplicationRouteProps) {
  const navigate = useNavigate();
  const returnHome = useCallback(() => {
    void navigate({ to: '/' });
  }, [navigate]);
  const grantAccess = useCallback(() => undefined, []);
  const access = useAdminAccessController({
    isAdminRoute: true,
    onStoriesLoaded: onStoriesChange,
    onAccessGranted: grantAccess,
    onAccessCancelled: returnHome,
    showToast,
  });

  return (
    <div className="min-h-screen bg-surface">
      {access.adminPin && (
        <Suspense fallback={<div className="min-h-screen bg-surface" />}>
          <AdminRouteWorkspace
            stories={stories}
            adminPin={access.adminPin}
            onStoriesChange={onStoriesChange}
          />
        </Suspense>
      )}
      {access.showPrompt && (
        <AdminPinDialog
          isVerifying={access.isVerifying}
          onVerify={access.verifyPin}
          onCancel={access.cancelAccess}
        />
      )}
    </div>
  );
}
