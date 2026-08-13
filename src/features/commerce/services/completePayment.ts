import type { Story } from '@/types';
import type { PurchaseReceipt } from '@/utils/paymentStore';
import { paymentStore } from '@/utils/paymentStore';
import { userAuthStore } from '@/utils/userAuthStore';
import { verifyPaymentTransaction } from '@/features/commerce/api/paymentGatewayApi';
import type {
  CreateTransactionResponse,
  MidtransPaymentResult,
  PurchaseType,
} from '@/features/commerce/types/paymentGateway';

interface CompletePaymentOptions {
  transaction: CreateTransactionResponse;
  result: MidtransPaymentResult;
  story?: Story;
  purchaseType: PurchaseType;
  signal: AbortSignal;
}

export async function completeVerifiedPayment({
  transaction,
  result,
  story,
  purchaseType,
  signal,
}: CompletePaymentOptions): Promise<PurchaseReceipt> {
  const orderId = result.order_id || transaction.orderId;
  const verification = await verifyPaymentTransaction(orderId, signal);

  const isVipPurchase = purchaseType === 'vip';
  if (!isVipPurchase && !story) throw new Error('Buku untuk transaksi tidak ditemukan.');

  const receipt = verification.entitlement;
  if (!receipt) throw new Error('Pembayaran berhasil, tetapi entitlement belum diterbitkan.');

  if (isVipPurchase) await userAuthStore.refreshEntitlements();
  else paymentStore.saveVerifiedPurchase(receipt);
  return receipt;
}
