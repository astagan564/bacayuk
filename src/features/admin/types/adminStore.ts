export interface DiscountCoupon {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minPurchase?: number;
  usageCount: number;
  maxUsage?: number;
  expiresAt?: string;
  isActive: boolean;
}

export interface PromoBanner {
  text: string;
  isActive: boolean;
  linkText?: string;
}

export interface AdminSettings {
  eyeRestIntervalMinutes: number;
  downloadLinkExpireHours: number;
  defaultEbookPrice: number;
  enableGlobalWatermark: boolean;
  allowGuestFreeBookCount: number;
  enableCopyProtection: boolean;
  promoBannerText: string;
  promoBannerActive: boolean;
}

export interface TransactionRecord {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  storyId: string;
  storyTitle: string;
  paymentMethod: 'qris' | 'gopay' | 'ovo' | 'va_bca' | 'va_mandiri' | 'midtrans' | 'vip' | string;
  amount: number;
  discountAmount?: number;
  couponCode?: string;
  status: 'success' | 'pending' | 'expired';
  createdAt: string;
  paidAt?: string;
}

export interface UserReadingActivity {
  userId: string;
  userName: string;
  userEmail: string;
  storyId: string;
  storyTitle: string;
  lastPageRead: number;
  totalPages: number;
  isCompleted: boolean;
  updatedAt: string;
}

export interface StoryAnalyticsInput {
  id: string;
  title: string;
  pages: readonly unknown[];
}

export interface DropoffAnalytics {
  storyId: string;
  storyTitle: string;
  totalPages: number;
  totalReaders: number;
  completedCount: number;
  completionRate: number;
  biggestDropPage: number;
  pageCounts: number[];
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: DiscountCoupon;
  discountAmount: number;
  message?: string;
}

export interface CleanupResult {
  purgedCount: number;
  message: string;
  timestamp: string;
}
