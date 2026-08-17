import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { adminStore } from '@/utils/adminStore';
import { userAuthStore } from '@/utils/userAuthStore';
import { VIP_MONTHLY_PRICE } from '@/features/commerce/constants/payment';
import {
  createManualPaymentOrder,
  fetchPaymentOrder,
  submitManualPaymentProof,
} from '@/features/commerce/api/manualPaymentApi';
import { usePaymentCheckoutForm } from '@/features/commerce/hooks/usePaymentCheckoutForm';
import type {
  ManualPaymentMethod,
  ManualPaymentModalProps,
  ManualPaymentOrder,
} from '@/features/commerce/types/manualPayment';
import type { PurchaseType } from '@/features/commerce/types/paymentGateway';
import {
  confirmWhatsAppContactVerification,
  createWhatsAppContact,
  fetchWhatsAppContacts,
  requestWhatsAppContactVerification,
} from '@/features/account/api/whatsappContactApi';
import type { WhatsAppContact } from '@/features/account/types/whatsappContact';

const MAX_PROOF_BYTES = 1_572_864;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Bukti pembayaran tidak dapat dibaca.'));
    reader.readAsDataURL(file);
  });
}

type Options = Pick<
  ManualPaymentModalProps,
  'story' | 'isVipOnly' | 'initialOrder' | 'onOrderSubmitted'
>;

export function useManualPaymentController({
  story,
  isVipOnly = false,
  initialOrder,
  onOrderSubmitted,
}: Options) {
  const adminSettings = adminStore.getSettings();
  const basePrice = story?.ebookPrice || adminSettings.defaultEbookPrice;
  const checkout = usePaymentCheckoutForm({ story, isVipOnly, basePrice });
  const [order, setOrder] = useState<ManualPaymentOrder | null>(initialOrder || null);
  const [paymentMethod, setPaymentMethod] = useState<ManualPaymentMethod>(
    initialOrder?.paymentMethod || 'manual_qris',
  );
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [payerNote, setPayerNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [whatsappContacts, setWhatsAppContacts] = useState<WhatsAppContact[]>([]);
  const [selectedWhatsAppContactId, setSelectedWhatsAppContactId] = useState<number | null>(null);
  const [newWhatsAppNumber, setNewWhatsAppNumber] = useState('');
  const [whatsappConsent, setWhatsAppConsent] = useState(false);
  const [isLoadingWhatsAppContacts, setIsLoadingWhatsAppContacts] = useState(!initialOrder);
  const [pendingWhatsAppVerificationId, setPendingWhatsAppVerificationId] = useState<number | null>(null);
  const [whatsappVerificationCode, setWhatsAppVerificationCode] = useState('');
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (initialOrder) return undefined;
    const abortController = new AbortController();
    void fetchWhatsAppContacts(abortController.signal).then((contacts) => {
      setWhatsAppContacts(contacts);
      const preferred = contacts.find((contact) => contact.isDefault && contact.orderNotificationsEnabled && contact.verifiedAt)
        || contacts.find((contact) => contact.orderNotificationsEnabled && contact.verifiedAt);
      setSelectedWhatsAppContactId(preferred?.id || null);
    }).catch((error) => {
      if (!abortController.signal.aborted) setErrorMessage(error instanceof Error ? error.message : 'Nomor WhatsApp belum dapat dimuat.');
    }).finally(() => {
      if (!abortController.signal.aborted) setIsLoadingWhatsAppContacts(false);
    });
    return () => abortController.abort();
  }, [initialOrder]);

  const instructions = order?.instructions;
  const availableMethods = useMemo(() => ({
    bank: Boolean(instructions?.bankTransfer),
    qris: Boolean(instructions?.qrisImageUrl),
  }), [instructions]);

  const goToStep1 = useCallback(() => setCheckoutStep(1), []);
  const goToStep2 = useCallback(() => setCheckoutStep(2), []);
  const goToStep3 = useCallback(() => setCheckoutStep(3), []);

  const selectPurchaseType = useCallback((nextPurchaseType: PurchaseType) => {
    checkout.selectPurchaseType(nextPurchaseType);
    setOrder(null);
    setErrorMessage(null);
  }, [checkout.selectPurchaseType]);

  const startOrder = useCallback(async () => {
    const customer = checkout.validateCustomer();
    if (typeof customer === 'string') {
      setErrorMessage(customer);
      return;
    }
    setIsProcessing(true);
    setErrorMessage(null);
    const abortController = new AbortController();
    abortRef.current = abortController;
    try {
      let whatsappContactId = selectedWhatsAppContactId;
      if (!whatsappContactId) {
        if (!newWhatsAppNumber.trim()) throw new Error('Isi atau pilih nomor WhatsApp untuk menerima status pesanan.');
        if (!whatsappConsent) throw new Error('Konfirmasi persetujuan notifikasi WhatsApp terlebih dahulu.');
        const contact = await createWhatsAppContact({
          phone: newWhatsAppNumber,
          label: whatsappContacts.length === 0 ? 'Utama' : 'Nomor pembayaran',
          consentConfirmed: true,
          orderNotificationsEnabled: true,
          isDefault: whatsappContacts.length === 0,
        }, abortController.signal);
        whatsappContactId = contact.id;
        setWhatsAppContacts((current) => [...current, contact]);
        setSelectedWhatsAppContactId(contact.id);
      }
      const selectedContact = whatsappContacts.find((contact) => contact.id === whatsappContactId);
      const currentContact = selectedContact || (whatsappContactId
        ? (await fetchWhatsAppContacts(abortController.signal)).find((contact) => contact.id === whatsappContactId)
        : undefined);
      if (!currentContact?.verifiedAt) {
        await requestWhatsAppContactVerification(whatsappContactId);
        setPendingWhatsAppVerificationId(whatsappContactId);
        setWhatsAppVerificationCode('');
        throw new Error('Kode verifikasi telah dikirim ke WhatsApp. Masukkan kode 6 digit untuk melanjutkan.');
      }
      const nextOrder = await createManualPaymentOrder({
        purchaseType: checkout.purchaseType,
        storyId: story?.id,
        storyTitle: story?.title,
        couponCode: checkout.appliedCouponCode,
        paymentMethod,
        whatsappContactId,
      }, abortController.signal);
      if (nextOrder.amount !== checkout.finalPrice) {
        throw new Error('Harga atau kupon berubah. Tutup lalu buka kembali pembayaran.');
      }
      setOrder(nextOrder);
      setPaymentMethod(nextOrder.paymentMethod || (nextOrder.instructions?.qrisImageUrl
        ? 'manual_qris'
        : 'manual_bank_transfer'));
    } catch (error) {
      if (!abortController.signal.aborted) {
        setErrorMessage(error instanceof Error ? error.message : 'Pesanan belum dapat dibuat.');
      }
    } finally {
      if (abortRef.current === abortController) abortRef.current = null;
      setIsProcessing(false);
    }
  }, [checkout, newWhatsAppNumber, paymentMethod, selectedWhatsAppContactId, story, whatsappConsent, whatsappContacts]);

  const confirmWhatsAppVerification = useCallback(async () => {
    if (!pendingWhatsAppVerificationId) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const verified = await confirmWhatsAppContactVerification(pendingWhatsAppVerificationId, whatsappVerificationCode);
      setWhatsAppContacts((current) => current.map((contact) => contact.id === verified.id ? verified : contact));
      setSelectedWhatsAppContactId(verified.id);
      setPendingWhatsAppVerificationId(null);
      setWhatsAppVerificationCode('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Kode verifikasi belum dapat diperiksa.');
    } finally {
      setIsProcessing(false);
    }
  }, [pendingWhatsAppVerificationId, whatsappVerificationCode]);

  const resendWhatsAppVerification = useCallback(async () => {
    if (!pendingWhatsAppVerificationId) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      await requestWhatsAppContactVerification(pendingWhatsAppVerificationId);
      setErrorMessage('Kode verifikasi baru telah dikirim.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Kode verifikasi belum dapat dikirim ulang.');
    } finally {
      setIsProcessing(false);
    }
  }, [pendingWhatsAppVerificationId]);

  const refreshOrder = useCallback(async (silent = false) => {
    if (!order) return;
    if (!silent) {
      setIsProcessing(true);
      setErrorMessage(null);
    }
    try {
      const updatedOrder = await fetchPaymentOrder(order.orderId);
      setOrder(updatedOrder);
      if (updatedOrder.status === 'paid') await userAuthStore.refreshEntitlements();
    } catch (error) {
      if (!silent) {
        setErrorMessage(error instanceof Error ? error.message : 'Status pembayaran belum dapat diperiksa.');
      }
    } finally {
      if (!silent) setIsProcessing(false);
    }
  }, [order]);

  useEffect(() => {
    const shouldPollDana = order?.provider === 'dana' && order.status === 'pending_payment';
    const shouldPollManualReview = order?.provider === 'manual' && order.status === 'pending_review';
    if (!shouldPollDana && !shouldPollManualReview) return undefined;
    const intervalId = window.setInterval(
      () => void refreshOrder(true),
      shouldPollDana ? 5_000 : 10_000,
    );
    return () => window.clearInterval(intervalId);
  }, [order?.provider, order?.status, refreshOrder]);

  const submitProof = useCallback(async () => {
    if (!order) return;
    if (!proofFile) {
      setErrorMessage('Pilih gambar bukti pembayaran terlebih dahulu.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(proofFile.type)) {
      setErrorMessage('Gunakan bukti berformat JPG, PNG, atau WebP.');
      return;
    }
    if (proofFile.size > MAX_PROOF_BYTES) {
      setErrorMessage('Ukuran bukti pembayaran maksimal 1,5 MB.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    const abortController = new AbortController();
    abortRef.current = abortController;
    try {
      const dataUrl = await readFileAsDataUrl(proofFile);
      const updatedOrder = await submitManualPaymentProof({
        orderId: order.orderId,
        dataUrl,
        paymentMethod,
        payerNote,
        signal: abortController.signal,
      });
      setOrder({ ...updatedOrder, instructions: order.instructions });
    } catch (error) {
      if (!abortController.signal.aborted) {
        setErrorMessage(error instanceof Error ? error.message : 'Bukti belum dapat dikirim.');
      }
    } finally {
      if (abortRef.current === abortController) abortRef.current = null;
      setIsProcessing(false);
    }
  }, [order, payerNote, paymentMethod, proofFile]);

  const complete = useCallback(() => {
    if (order) onOrderSubmitted(order);
  }, [onOrderSubmitted, order]);

  return {
    story,
    isVipOnly,
    basePrice,
    vipPrice: VIP_MONTHLY_PRICE,
    checkoutStep,
    goToStep1,
    goToStep2,
    goToStep3,
    purchaseType: checkout.purchaseType,
    customerName: checkout.customerName,
    customerEmail: checkout.customerEmail,
    couponInput: checkout.couponInput,
    appliedDiscount: checkout.appliedDiscount,
    couponMessage: checkout.couponMessage,
    isApplyingCoupon: checkout.isApplyingCoupon,
    priceBeforeDiscount: checkout.priceBeforeDiscount,
    finalPrice: checkout.finalPrice,
    order,
    instructions,
    availableMethods,
    paymentMethod,
    proofFile,
    payerNote,
    whatsappContacts,
    selectedWhatsAppContactId,
    newWhatsAppNumber,
    whatsappConsent,
    pendingWhatsAppVerificationId,
    whatsappVerificationCode,
    isLoadingWhatsAppContacts,
    isProcessing,
    errorMessage,
    setCouponInput: checkout.setCouponInput,
    selectPurchaseType,
    applyCoupon: checkout.applyCoupon,
    setPaymentMethod,
    setProofFile,
    setPayerNote,
    setSelectedWhatsAppContactId,
    setNewWhatsAppNumber,
    setWhatsappConsent: setWhatsAppConsent,
    setWhatsappVerificationCode: setWhatsAppVerificationCode,
    confirmWhatsAppVerification,
    resendWhatsAppVerification,
    startOrder,
    refreshOrder,
    submitProof,
    complete,
  };
}

export type ManualPaymentController = ReturnType<typeof useManualPaymentController>;
