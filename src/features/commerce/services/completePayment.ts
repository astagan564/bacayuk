import type { Story } from '@/types';
import type { PurchaseReceipt } from '@/utils/paymentStore';
import { adminStore } from '@/utils/adminStore';
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
  customerName: string;
  customerEmail: string;
  story?: Story;
  purchaseType: PurchaseType;
  appliedCouponCode: string | null;
  downloadLinkExpireHours: number;
  signal: AbortSignal;
}

export async function completeVerifiedPayment({
  transaction,
  result,
  customerName,
  customerEmail,
  story,
  purchaseType,
  appliedCouponCode,
  downloadLinkExpireHours,
  signal,
}: CompletePaymentOptions): Promise<PurchaseReceipt> {
  const orderId = result.order_id || transaction.orderId;
  await verifyPaymentTransaction(orderId, signal);

  const isVipPurchase = purchaseType === 'vip';
  if (!isVipPurchase && !story) throw new Error('Buku untuk transaksi tidak ditemukan.');

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + downloadLinkExpireHours);
  const receipt: PurchaseReceipt = {
    storyId: isVipPurchase ? 'vip_sub' : story!.id,
    storyTitle: isVipPurchase ? 'Langganan keluarga 1 bulan' : story!.title,
    customerName,
    customerEmail,
    transactionId: orderId,
    paymentMethod: result.payment_type || 'midtrans',
    amount: transaction.amount,
    purchasedAt: new Date().toISOString(),
    downloadCount: 0,
    tokenExpiresAt: expiresAt.toISOString(),
  };

  if (isVipPurchase) await userAuthStore.activateVip();
  else paymentStore.savePurchase(receipt);
  if (appliedCouponCode) void adminStore.useCoupon(appliedCouponCode);

  const paidAt = new Date().toISOString();
  void adminStore.addTransaction({
    id: orderId,
    customerName,
    customerEmail,
    storyId: receipt.storyId,
    storyTitle: receipt.storyTitle,
    paymentMethod: receipt.paymentMethod,
    amount: transaction.amount,
    discountAmount: transaction.discountAmount,
    couponCode: transaction.couponCode || undefined,
    status: 'success',
    createdAt: paidAt,
    paidAt,
  });
  return receipt;
}
