import { adminCouponStore } from '@/features/admin/stores/adminCouponStore';
import { adminMaintenanceStore } from '@/features/admin/stores/adminMaintenanceStore';
import { adminReadingAnalyticsStore } from '@/features/admin/stores/adminReadingAnalyticsStore';
import { adminSettingsStore } from '@/features/admin/stores/adminSettingsStore';
import { adminTransactionStore } from '@/features/admin/stores/adminTransactionStore';

export { LEGACY_DEMO_USER_IDS } from '@/features/admin/stores/adminStorageKeys';
export type {
  AdminSettings,
  DiscountCoupon,
  DropoffAnalytics,
  PromoBanner,
  TransactionRecord,
  UserReadingActivity,
} from '@/features/admin/types/adminStore';

/**
 * Compatibility facade for callers that have not migrated to focused Admin stores yet.
 */
export const adminStore = {
  ...adminSettingsStore,
  ...adminCouponStore,
  ...adminTransactionStore,
  ...adminReadingAnalyticsStore,
  ...adminMaintenanceStore,
};
