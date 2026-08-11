import type { ReaderNavigationControlsProps } from '@/features/reader/types/readerNavigation';
import { useReaderNavigationController } from '@/features/reader/hooks/useReaderNavigationController';
import { DesktopReaderControls } from '@/features/reader/components/navigation/DesktopReaderControls';
import { MobileReaderControls } from '@/features/reader/components/navigation/MobileReaderControls';

export function ReaderNavigationControls(props: ReaderNavigationControlsProps) {
  const controller = useReaderNavigationController({
    currentPageIndex: props.currentPageIndex,
    totalPages: props.totalPages,
    settings: props.settings,
    onPageChange: props.onPageChange,
    onUpdateSettings: props.onUpdateSettings,
  });

  return (
    <>
      <DesktopReaderControls {...props} controller={controller} />
      <MobileReaderControls {...props} controller={controller} />
    </>
  );
}
