import {
  persistTransaction,
  persistTransactionStatus,
} from '@/features/admin/api/adminPersistence';
import {
  LEGACY_DEMO_TRANSACTION_IDS,
  TRANSACTIONS_KEY,
} from '@/features/admin/stores/adminStorageKeys';
import type { TransactionRecord } from '@/features/admin/types/adminStore';

export const adminTransactionStore = {
  getTransactions(): TransactionRecord[] {
    try {
      const data = localStorage.getItem(TRANSACTIONS_KEY);
      const transactions = data ? JSON.parse(data) as TransactionRecord[] : [];
      const cleanedTransactions = transactions.filter(
        (transaction) => !LEGACY_DEMO_TRANSACTION_IDS.has(transaction.id),
      );
      if (cleanedTransactions.length !== transactions.length) {
        localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(cleanedTransactions));
      }
      return cleanedTransactions;
    } catch {
      return [];
    }
  },

  async addTransaction(transaction: TransactionRecord): Promise<void> {
    const transactions = adminTransactionStore.getTransactions();
    transactions.unshift(transaction);
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    try {
      await persistTransaction(transaction);
    } catch (error) {
      console.error('Failed to add transaction to Supabase', error);
    }
  },

  async updateTransactionStatus(
    id: string,
    newStatus: TransactionRecord['status'],
  ): Promise<void> {
    const transactions = adminTransactionStore.getTransactions();
    const transaction = transactions.find((item) => item.id === id);
    if (!transaction) return;

    transaction.status = newStatus;
    if (newStatus === 'success') transaction.paidAt = new Date().toISOString();
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    try {
      await persistTransactionStatus(transaction);
    } catch (error) {
      console.error('Failed to update transaction status in Supabase', error);
    }
  },
};
