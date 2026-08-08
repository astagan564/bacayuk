export interface PurchaseReceipt {
  storyId: string;
  storyTitle: string;
  customerName: string;
  customerEmail: string;
  transactionId: string;
  paymentMethod: 'qris' | 'gopay' | 'ovo' | 'va_bca' | 'va_mandiri';
  amount: number; // in IDR, e.g. 15000
  purchasedAt: string; // ISO date
  downloadCount: number; // starts at 0, max 3
  tokenExpiresAt: string; // ISO date (24h after purchase or creation)
}

import { supabase } from './supabaseClient';

const STORAGE_KEY = 'buku_cerita_purchases_v1';

export const paymentStore = {
  getPurchases(): Record<string, PurchaseReceipt> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  isStoryPurchased(storyId: string): boolean {
    const purchases = this.getPurchases();
    return !!purchases[storyId];
  },

  getStoryPurchase(storyId: string): PurchaseReceipt | null {
    const purchases = this.getPurchases();
    return purchases[storyId] || null;
  },

  async savePurchase(receipt: PurchaseReceipt): Promise<void> {
    const purchases = this.getPurchases();
    purchases[receipt.storyId] = receipt;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(purchases));
    
    try {
      await supabase.from('purchase_receipts').upsert({
        id: receipt.transactionId, // fallback ID
        story_id: receipt.storyId,
        story_title: receipt.storyTitle,
        customer_name: receipt.customerName,
        customer_email: receipt.customerEmail,
        transaction_id: receipt.transactionId,
        payment_method: receipt.paymentMethod,
        amount: receipt.amount,
        purchased_at: receipt.purchasedAt,
        download_count: receipt.downloadCount || 0,
        token_expires_at: receipt.tokenExpiresAt
      });
    } catch (e) {
      console.error('Failed to sync purchase to Supabase', e);
    }
  },

  incrementDownloadCount(storyId: string): number {
    const purchases = this.getPurchases();
    const item = purchases[storyId];
    if (item) {
      item.downloadCount = (item.downloadCount || 0) + 1;
      this.savePurchase(item);
      return item.downloadCount;
    }
    return 1;
  },

  async renewToken(storyId: string): Promise<PurchaseReceipt | null> {
    const purchases = this.getPurchases();
    const item = purchases[storyId];
    if (item) {
      const expires = new Date();
      expires.setHours(expires.getHours() + 24);
      item.tokenExpiresAt = expires.toISOString();
      item.downloadCount = 0;
      await this.savePurchase(item);
      return item;
    }
    return null;
  },
  
  async syncPurchasesFromSupabase(email: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('purchase_receipts')
        .select('*')
        .eq('customer_email', email);
        
      if (!error && data) {
        const purchases = this.getPurchases();
        let changed = false;
        for (const row of data) {
          if (!purchases[row.story_id] || new Date(row.purchased_at) > new Date(purchases[row.story_id].purchasedAt)) {
            purchases[row.story_id] = {
              storyId: row.story_id,
              storyTitle: row.story_title,
              customerName: row.customer_name,
              customerEmail: row.customer_email,
              transactionId: row.transaction_id,
              paymentMethod: row.payment_method,
              amount: row.amount,
              purchasedAt: row.purchased_at,
              downloadCount: row.download_count,
              tokenExpiresAt: row.token_expires_at
            };
            changed = true;
          }
        }
        if (changed) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(purchases));
        }
      }
    } catch (e) {
      console.error('Failed to sync purchases from Supabase', e);
    }
  }
};
