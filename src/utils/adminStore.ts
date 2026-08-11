export interface DiscountCoupon {
  code: string;
  type: 'percent' | 'fixed';
  value: number; // e.g. 20 for 20% or 5000 for Rp 5,000 off
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
  eyeRestIntervalMinutes: number; // Default 20
  downloadLinkExpireHours: number; // Default 24
  defaultEbookPrice: number; // Default 15000
  enableGlobalWatermark: boolean; // Default true
  allowGuestFreeBookCount: number; // Default 1
  enableCopyProtection: boolean; // Default true
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

interface StoryAnalyticsInput {
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

import { supabase } from './supabaseClient';

const ADMIN_SETTINGS_KEY = 'buku_cerita_admin_settings_v1';
const COUPONS_KEY = 'buku_cerita_coupons_v1';
const TRANSACTIONS_KEY = 'buku_cerita_transactions_v1';
const READING_LOGS_KEY = 'buku_cerita_reading_logs_v1';
const LEGACY_DEMO_TRANSACTION_IDS = new Set(['TRX-88291', 'TRX-88292', 'TRX-88293', 'TRX-88294']);
export const LEGACY_DEMO_USER_IDS = new Set(['usr_g_8812', 'usr_wa_9941', 'usr_em_1204']);

const DEFAULT_SETTINGS: AdminSettings = {
  eyeRestIntervalMinutes: 20,
  downloadLinkExpireHours: 24,
  defaultEbookPrice: 15000,
  enableGlobalWatermark: true,
  allowGuestFreeBookCount: 1,
  enableCopyProtection: true,
  promoBannerText: '🎉 Promo Hari Anak Nasional: Gunakan kode kupon BUKUANAK20 untuk diskon 20% unduhan e-book!',
  promoBannerActive: true,
};

const DEFAULT_COUPONS: DiscountCoupon[] = [
  {
    code: 'BUKUANAK20',
    type: 'percent',
    value: 20,
    usageCount: 14,
    maxUsage: 100,
    isActive: true,
  },
  {
    code: 'MERDEKA5K',
    type: 'fixed',
    value: 5000,
    usageCount: 8,
    maxUsage: 50,
    isActive: true,
  },
  {
    code: 'PARENTSPROMO',
    type: 'percent',
    value: 30,
    usageCount: 29,
    maxUsage: 200,
    isActive: true,
  },
];

export const adminStore = {
  getSettings(): AdminSettings {
    try {
      const data = localStorage.getItem(ADMIN_SETTINGS_KEY);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: AdminSettings): Promise<void> {
    localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settings));
    try {
      await supabase.from('admin_settings').upsert({
        id: 1,
        eye_rest_interval_minutes: settings.eyeRestIntervalMinutes,
        download_link_expire_hours: settings.downloadLinkExpireHours,
        default_ebook_price: settings.defaultEbookPrice,
        enable_global_watermark: settings.enableGlobalWatermark,
        allow_guest_free_book_count: settings.allowGuestFreeBookCount,
        enable_copy_protection: settings.enableCopyProtection,
        promo_banner_text: settings.promoBannerText,
        promo_banner_active: settings.promoBannerActive
      });
    } catch (e) {
      console.error('Failed to sync admin settings', e);
    }
  },

  getCoupons(): DiscountCoupon[] {
    try {
      const data = localStorage.getItem(COUPONS_KEY);
      return data ? JSON.parse(data) : DEFAULT_COUPONS;
    } catch {
      return DEFAULT_COUPONS;
    }
  },

  async saveCoupons(coupons: DiscountCoupon[]): Promise<void> {
    localStorage.setItem(COUPONS_KEY, JSON.stringify(coupons));
    try {
      // Sync all coupons to Supabase
      const payload = coupons.map(c => ({
        code: c.code,
        type: c.type,
        value: c.value,
        min_purchase: c.minPurchase || null,
        usage_count: c.usageCount,
        max_usage: c.maxUsage || null,
        expires_at: c.expiresAt || null,
        is_active: c.isActive
      }));
      await supabase.from('discount_coupons').upsert(payload);
    } catch (e) {
      console.error('Failed to sync coupons', e);
    }
  },

  validateCoupon(code: string, originalAmount: number): { valid: boolean; coupon?: DiscountCoupon; discountAmount: number; message?: string } {
    const coupons = this.getCoupons();
    const cleanCode = code.trim().toUpperCase();
    const match = coupons.find((coupon: DiscountCoupon) => coupon.code.toUpperCase() === cleanCode && coupon.isActive);

    if (!match) {
      return { valid: false, discountAmount: 0, message: 'Kode kupon tidak ditemukan atau tidak aktif!' };
    }

    if (match.maxUsage && match.usageCount >= match.maxUsage) {
      return { valid: false, discountAmount: 0, message: 'Kuota penggunaan kupon ini telah habis!' };
    }

    let discount = 0;
    if (match.type === 'percent') {
      discount = Math.round((originalAmount * match.value) / 100);
    } else {
      discount = match.value;
    }

    if (discount > originalAmount) {
      discount = originalAmount;
    }

    return { valid: true, coupon: match, discountAmount: discount };
  },

  async useCoupon(code: string): Promise<void> {
    const coupons = this.getCoupons();
    const cleanCode = code.trim().toUpperCase();
    const idx = coupons.findIndex((coupon: DiscountCoupon) => coupon.code.toUpperCase() === cleanCode);
    if (idx !== -1) {
      coupons[idx].usageCount += 1;
      await this.saveCoupons(coupons);
    }
  },

  getTransactions(): TransactionRecord[] {
    try {
      const data = localStorage.getItem(TRANSACTIONS_KEY);
      const transactions: TransactionRecord[] = data ? JSON.parse(data) : [];
      const cleaned = transactions.filter((transaction) => !LEGACY_DEMO_TRANSACTION_IDS.has(transaction.id));
      if (cleaned.length !== transactions.length) {
        localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(cleaned));
      }
      return cleaned;
    } catch {
      return [];
    }
  },

  async addTransaction(trx: TransactionRecord): Promise<void> {
    const list = this.getTransactions();
    list.unshift(trx);
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(list));
    try {
      await supabase.from('transaction_records').insert({
        id: trx.id,
        customer_name: trx.customerName,
        customer_email: trx.customerEmail,
        customer_phone: trx.customerPhone || null,
        story_id: trx.storyId,
        story_title: trx.storyTitle,
        payment_method: trx.paymentMethod,
        amount: trx.amount,
        discount_amount: trx.discountAmount || null,
        coupon_code: trx.couponCode || null,
        status: trx.status,
        created_at: trx.createdAt,
        paid_at: trx.paidAt || null
      });
    } catch (e) {
      console.error('Failed to add transaction to Supabase', e);
    }
  },

  async updateTransactionStatus(id: string, newStatus: 'success' | 'pending' | 'expired'): Promise<void> {
    const list = this.getTransactions();
    const item = list.find((transaction: TransactionRecord) => transaction.id === id);
    if (item) {
      item.status = newStatus;
      if (newStatus === 'success') {
        item.paidAt = new Date().toISOString();
      }
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(list));
      try {
        await supabase.from('transaction_records').update({
          status: item.status,
          paid_at: item.paidAt || null
        }).eq('id', id);
      } catch (e) {
        console.error('Failed to update transaction status in Supabase', e);
      }
    }
  },

  getReadingLogs(): UserReadingActivity[] {
    try {
      const data = localStorage.getItem(READING_LOGS_KEY);
      const logs: UserReadingActivity[] = data ? JSON.parse(data) : [];
      const cleaned = logs.filter((log) => !LEGACY_DEMO_USER_IDS.has(log.userId));
      if (cleaned.length !== logs.length) {
        localStorage.setItem(READING_LOGS_KEY, JSON.stringify(cleaned));
      }
      return cleaned;
    } catch {
      return [];
    }
  },

  async logUserReading(activity: UserReadingActivity): Promise<void> {
    const logs = this.getReadingLogs();
    const idx = logs.findIndex((log: UserReadingActivity) => log.userId === activity.userId && log.storyId === activity.storyId);
    if (idx !== -1) {
      logs[idx] = { ...logs[idx], ...activity, updatedAt: new Date().toISOString() };
    } else {
      logs.unshift({ ...activity, updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(READING_LOGS_KEY, JSON.stringify(logs));
    
    try {
      await supabase.from('user_reading_activities').upsert({
        user_id: activity.userId,
        user_name: activity.userName,
        user_email: activity.userEmail,
        story_id: activity.storyId,
        story_title: activity.storyTitle,
        last_page_read: activity.lastPageRead,
        total_pages: activity.totalPages,
        is_completed: activity.isCompleted,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,story_id' });
    } catch (e) {
      console.error('Failed to log user reading', e);
    }
  },

  // Cron Job Simulation: Scans transactions and cleans up expired download links & temp files
  runCronJobCleanup(): { purgedCount: number; message: string; timestamp: string } {
    const list = this.getTransactions();
    const settings = this.getSettings();
    const now = Date.now();
    const expireMs = settings.downloadLinkExpireHours * 3600 * 1000;
    let purgedCount = 0;

    list.forEach((transaction: TransactionRecord) => {
      const createdTime = new Date(transaction.createdAt).getTime();
      if (transaction.status === 'pending' && now - createdTime > expireMs) {
        transaction.status = 'expired';
        purgedCount++;
      }
    });

    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(list));

    // Clean up expired receipts in paymentStore
    try {
      const receiptsStr = localStorage.getItem('buku_cerita_purchases_v1');
      if (receiptsStr) {
        const receipts = JSON.parse(receiptsStr) as Record<string, { tokenExpiresAt?: string }>;
        const validReceipts = Object.fromEntries(
          Object.entries(receipts).filter(([, receipt]) => {
            if (!receipt.tokenExpiresAt) return true;
            return new Date(receipt.tokenExpiresAt).getTime() > now;
          })
        );
        localStorage.setItem('buku_cerita_purchases_v1', JSON.stringify(validReceipts));
      }
    } catch (e) {
      console.warn('Cron cleanup error:', e);
    }

    return {
      purgedCount,
      message: `Cron job berhasil membersihkan ${purgedCount} link unduhan kedaluwarsa & cache watermark sementara.`,
      timestamp: new Date().toLocaleTimeString('id-ID'),
    };
  },

  // Drop-off analytics calculation per story
  getDropoffAnalytics(stories: StoryAnalyticsInput[]): DropoffAnalytics[] {
    const logs = this.getReadingLogs();

    return stories.map((story) => {
      const storyLogs = logs.filter((log: UserReadingActivity) => log.storyId === story.id);
      const totalReaders = storyLogs.length || 1; // avoid divide by zero

      // Calculate how many readers reached each page
      const pageCounts: number[] = new Array(story.pages.length).fill(0);
      let completedCount = 0;

      storyLogs.forEach((log: UserReadingActivity) => {
        const lastPage = Math.min(log.lastPageRead, story.pages.length);
        for (let i = 0; i < lastPage; i++) {
          pageCounts[i] += 1;
        }
        if (log.isCompleted || lastPage >= story.pages.length) {
          completedCount += 1;
        }
      });

      // Find drop-off hotspots (page with highest drop-off rate)
      let biggestDropPage = 1;
      let maxDropCount = 0;

      for (let i = 0; i < story.pages.length - 1; i++) {
        const dropped = pageCounts[i] - pageCounts[i + 1];
        if (dropped > maxDropCount) {
          maxDropCount = dropped;
          biggestDropPage = i + 1; // page number where reader stopped
        }
      }

      const completionRate = Math.round((completedCount / totalReaders) * 100);

      return {
        storyId: story.id,
        storyTitle: story.title,
        totalPages: story.pages.length,
        totalReaders: storyLogs.length,
        completedCount,
        completionRate,
        biggestDropPage,
        pageCounts,
      };
    });
  }
};
