import { fetchEntitlements, renewDownload } from '@/features/commerce/api/entitlementApi';

export interface PurchaseReceipt {
  storyId: string;
  storyTitle: string;
  customerName: string;
  customerEmail: string;
  transactionId: string;
  paymentMethod: 'qris' | 'gopay' | 'ovo' | 'va_bca' | 'va_mandiri' | 'midtrans' | 'vip' | string;
  amount: number;
  purchasedAt: string;
  downloadCount: number;
  downloadLimit?: number | null;
  tokenExpiresAt: string;
}

const STORAGE_KEY = 'buku_cerita_purchases_v2_cache';
let verifiedPurchases: Record<string, PurchaseReceipt> = {};

function persistDisplayCache(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(verifiedPurchases));
  } catch {
    // The cache is optional; server entitlements remain authoritative.
  }
}

export const paymentStore = {
  getPurchases(): Record<string, PurchaseReceipt> {
    return verifiedPurchases;
  },

  isStoryPurchased(storyId: string): boolean {
    return Boolean(verifiedPurchases[storyId]);
  },

  getStoryPurchase(storyId: string): PurchaseReceipt | null {
    return verifiedPurchases[storyId] || null;
  },

  saveVerifiedPurchase(receipt: PurchaseReceipt): void {
    if (receipt.storyId === 'vip_sub') return;
    verifiedPurchases = { ...verifiedPurchases, [receipt.storyId]: receipt };
    persistDisplayCache();
  },

  clearVerifiedPurchases(): void {
    verifiedPurchases = {};
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore unavailable storage.
    }
  },

  async syncPurchasesFromServer(): Promise<{ vipExpiresAt: string | null }> {
    const data = await fetchEntitlements();
    verifiedPurchases = Object.fromEntries(
      data.purchases.map((receipt) => [receipt.storyId, receipt]),
    );
    persistDisplayCache();
    return { vipExpiresAt: data.vipExpiresAt };
  },

  updateVerifiedPurchase(receipt: PurchaseReceipt): void {
    this.saveVerifiedPurchase(receipt);
  },

  async renewToken(storyId: string): Promise<PurchaseReceipt> {
    const receipt = await renewDownload(storyId);
    this.saveVerifiedPurchase(receipt);
    return receipt;
  },
};
