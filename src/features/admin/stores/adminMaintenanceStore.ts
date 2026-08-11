import {
  PURCHASES_KEY,
  TRANSACTIONS_KEY,
} from '@/features/admin/stores/adminStorageKeys';
import { adminSettingsStore } from '@/features/admin/stores/adminSettingsStore';
import { adminTransactionStore } from '@/features/admin/stores/adminTransactionStore';
import type {
  CleanupResult,
  TransactionRecord,
} from '@/features/admin/types/adminStore';

export const adminMaintenanceStore = {
  runCronJobCleanup(): CleanupResult {
    const transactions = adminTransactionStore.getTransactions();
    const settings = adminSettingsStore.getSettings();
    const now = Date.now();
    const expireMs = settings.downloadLinkExpireHours * 3600 * 1000;
    let purgedCount = 0;

    transactions.forEach((transaction: TransactionRecord) => {
      const createdTime = new Date(transaction.createdAt).getTime();
      if (transaction.status === 'pending' && now - createdTime > expireMs) {
        transaction.status = 'expired';
        purgedCount += 1;
      }
    });
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));

    try {
      const receiptsData = localStorage.getItem(PURCHASES_KEY);
      if (receiptsData) {
        const receipts = JSON.parse(receiptsData) as Record<string, { tokenExpiresAt?: string }>;
        const validReceipts = Object.fromEntries(
          Object.entries(receipts).filter(([, receipt]) => {
            if (!receipt.tokenExpiresAt) return true;
            return new Date(receipt.tokenExpiresAt).getTime() > now;
          }),
        );
        localStorage.setItem(PURCHASES_KEY, JSON.stringify(validReceipts));
      }
    } catch (error) {
      console.warn('Cron cleanup error:', error);
    }

    return {
      purgedCount,
      message: `Cron job berhasil membersihkan ${purgedCount} link unduhan kedaluwarsa & cache watermark sementara.`,
      timestamp: new Date().toLocaleTimeString('id-ID'),
    };
  },
};
