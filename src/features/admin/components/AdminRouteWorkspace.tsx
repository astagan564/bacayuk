import { lazy, Suspense, useCallback } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import type { Story } from '@/types';
import { storyStore } from '@/utils/storyStore';
import type { AdminSection } from '@/features/admin/types';

const AdminDashboard = lazy(() =>
  import('@/features/admin/components/AdminDashboard').then((module) => ({
    default: module.AdminDashboard,
  }))
);

const ADMIN_SECTION_PATHS: Record<
  AdminSection,
  | '/admin/stories'
  | '/admin/users'
  | '/admin/finance'
  | '/admin/costs'
  | '/admin/settings'
  | '/admin/analytics'
> = {
  cms: '/admin/stories',
  users: '/admin/users',
  finance: '/admin/finance',
  costs: '/admin/costs',
  settings: '/admin/settings',
  analytics: '/admin/analytics',
};

interface AdminRouteWorkspaceProps {
  stories: Story[];
  adminPin: string;
  onStoriesChange: (stories: Story[]) => void;
}

function resolveAdminSection(pathname: string): AdminSection {
  if (pathname.startsWith('/admin/users')) return 'users';
  if (pathname.startsWith('/admin/finance')) return 'finance';
  if (pathname.startsWith('/admin/costs')) return 'costs';
  if (pathname.startsWith('/admin/settings')) return 'settings';
  if (pathname.startsWith('/admin/analytics')) return 'analytics';
  return 'cms';
}

export function AdminRouteWorkspace({
  stories,
  adminPin,
  onStoriesChange,
}: AdminRouteWorkspaceProps) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const storyRoute = pathname.match(/^\/admin\/stories\/([^/]+)\/(edit|canvas)$/);
  const routeAction = pathname === '/admin/stories/new'
    ? 'new'
    : storyRoute?.[2] as 'edit' | 'canvas' | undefined;
  const routeStoryId = storyRoute?.[1]
    ? decodeURIComponent(storyRoute[1])
    : undefined;

  const handleSectionChange = useCallback((section: AdminSection) => {
    void navigate({ to: ADMIN_SECTION_PATHS[section] });
  }, [navigate]);

  const handleUpdateStories = useCallback(async (updatedStories: Story[]) => {
    try {
      onStoriesChange(await storyStore.saveStories(updatedStories, adminPin));
    } catch (error) {
      onStoriesChange(storyStore.getLocalStories());
      throw error;
    }
  }, [adminPin, onStoriesChange]);

  const handleBackToHome = useCallback(async () => {
    onStoriesChange(await storyStore.loadStories());
    void navigate({ to: '/' });
  }, [navigate, onStoriesChange]);

  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <AdminDashboard
        stories={stories}
        adminPin={adminPin}
        activeSection={resolveAdminSection(pathname)}
        routeAction={routeAction}
        routeStoryId={routeStoryId}
        onSectionChange={handleSectionChange}
        onOpenQuickCreate={() => void navigate({ to: '/admin/stories/new' })}
        onOpenStoryEditor={(storyId, mode) => void navigate({
          to: mode === 'canvas'
            ? '/admin/stories/$storyId/canvas'
            : '/admin/stories/$storyId/edit',
          params: { storyId },
        })}
        onCloseRouteAction={() => void navigate({ to: '/admin/stories' })}
        onUpdateStories={handleUpdateStories}
        onBackToHome={handleBackToHome}
      />
    </Suspense>
  );
}
