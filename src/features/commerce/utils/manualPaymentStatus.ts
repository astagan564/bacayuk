import type { ManualPaymentStatus } from '@/features/commerce/types/manualPayment';

export function isResumableManualPaymentStatus(status: ManualPaymentStatus): boolean {
  return status === 'pending_payment' || status === 'pending_review' || status === 'rejected';
}

export function getManualPaymentResumeLabel(status: ManualPaymentStatus): string {
  if (status === 'pending_review') return 'Periksa status';
  if (status === 'rejected') return 'Kirim ulang bukti';
  return 'Lanjutkan pembayaran';
}
