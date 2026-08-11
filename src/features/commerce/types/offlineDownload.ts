import type { Story } from '@/types';

export type OfflineDownloadFormat = 'pdf' | 'epub';

export interface OfflineDownloadModalProps {
  story: Story;
  onClose: () => void;
  isNight?: boolean;
}
