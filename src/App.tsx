import { useRouterState } from '@tanstack/react-router';
import { AdminApplicationRoute } from '@/features/admin/components/AdminApplicationRoute';
import { useReaderSettingsController } from '@/features/reader';
import {
  ApplicationToast,
  ReaderApplication,
  SettingsApplicationRoute,
  useApplicationToast,
  useCopyProtection,
  useStoryCollection,
} from '@/features/shell';

export default function App() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const storyCollection = useStoryCollection();
  const toast = useApplicationToast();
  const readerSettings = useReaderSettingsController();
  useCopyProtection(toast.showToast);

  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const isSettingsRoute = pathname === '/settings';

  return (
    <>
      {isAdminRoute ? (
        <AdminApplicationRoute
          stories={storyCollection.stories}
          onStoriesChange={storyCollection.setStories}
          showToast={toast.showToast}
        />
      ) : isSettingsRoute ? (
        <SettingsApplicationRoute isNight={readerSettings.isNight} />
      ) : (
        <ReaderApplication
          stories={storyCollection.stories}
          onStoriesChange={storyCollection.setStories}
          readerSettings={readerSettings}
          showToast={toast.showToast}
        />
      )}
      <ApplicationToast message={toast.message} />
    </>
  );
}
