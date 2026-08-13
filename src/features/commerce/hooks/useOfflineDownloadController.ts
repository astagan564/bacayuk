import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Story } from '@/types';
import { paymentStore } from '@/utils/paymentStore';
import type { PurchaseReceipt } from '@/utils/paymentStore';
import { userAuthStore } from '@/utils/userAuthStore';
import { consumeDownload } from '@/features/commerce/api/entitlementApi';
import { generateStoryEPUB } from '@/features/commerce/download/epubGenerator';
import { createDownloadFilename, saveBlobToDevice } from '@/features/commerce/download/fileSave';
import { generateStoryPDF } from '@/features/commerce/download/pdfGenerator';
import type { OfflineDownloadFormat } from '@/features/commerce/types/offlineDownload';

const DOWNLOAD_LIMIT = 3;
const NOTICE_DURATION_MS = 3500;

function getVipReceipt(story: Story): PurchaseReceipt | null {
  const user = userAuthStore.getUser();
  if (!userAuthStore.isVip() || !user) return null;
  return {
    storyId: story.id,
    storyTitle: story.title,
    customerName: user.name,
    customerEmail: user.email,
    transactionId: `VIP-${user.id}`,
    paymentMethod: 'vip',
    amount: 0,
    purchasedAt: user.createdAt,
    downloadCount: 0,
    downloadLimit: null,
    tokenExpiresAt: user.vipExpiresAt || new Date().toISOString(),
  };
}

export function useOfflineDownloadController(story: Story) {
  const [purchase, setPurchase] = useState<PurchaseReceipt | null>(null);
  const [activeFormat, setActiveFormat] = useState<OfflineDownloadFormat | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generationFormatRef = useRef<OfflineDownloadFormat | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setPurchase(paymentStore.getStoryPurchase(story.id) || getVipReceipt(story));
    setActiveFormat(null);
    setDownloadNotice(null);
  }, [story]);

  const showNotice = useCallback((message: string) => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    setDownloadNotice(message);
    noticeTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) setDownloadNotice(null);
    }, NOTICE_DURATION_MS);
  }, []);

  const expired = useMemo(() => {
    if (!purchase) return true;
    return Date.now() > new Date(purchase.tokenExpiresAt).getTime();
  }, [purchase]);

  const downloadLimitReached = Boolean(
    purchase
      && purchase.paymentMethod !== 'vip'
      && purchase.downloadCount >= (purchase.downloadLimit || DOWNLOAD_LIMIT),
  );

  const renewToken = useCallback(async (): Promise<void> => {
    try {
      const updatedPurchase = await paymentStore.renewToken(story.id);
      if (!isMountedRef.current) return;
      setPurchase(updatedPurchase);
      showNotice('Masa berlaku link unduhan diperbarui untuk 24 jam ke depan.');
    } catch (error) {
      if (!isMountedRef.current) return;
      showNotice(error instanceof Error ? error.message : 'Hak unduhan tidak dapat diperbarui.');
    }
  }, [showNotice, story.id]);

  const download = useCallback(async (format: OfflineDownloadFormat): Promise<void> => {
    if (!purchase || generationFormatRef.current) return;
    if (purchase.paymentMethod !== 'vip'
      && purchase.downloadCount >= (purchase.downloadLimit || DOWNLOAD_LIMIT)) {
      showNotice('Batas unduh sudah tercapai. Perbarui token setelah masa berlakunya selesai.');
      return;
    }

    generationFormatRef.current = format;
    setActiveFormat(format);
    try {
      const authorizedReceipt = await consumeDownload(story.id);
      const currentReceipt = authorizedReceipt.paymentMethod === 'vip'
        ? { ...authorizedReceipt, storyId: story.id, storyTitle: story.title }
        : authorizedReceipt;
      const customer = {
        name: currentReceipt.customerName,
        email: currentReceipt.customerEmail,
        transactionId: currentReceipt.transactionId,
      };
      const blob = format === 'pdf'
        ? await generateStoryPDF(story, customer)
        : await generateStoryEPUB(story, customer);
      const filename = format === 'pdf'
        ? createDownloadFilename(story.title, 'Cetak_Buku.pdf')
        : createDownloadFilename(story.title, 'Tablet.epub');
      saveBlobToDevice(blob, filename);

      if (currentReceipt.paymentMethod !== 'vip') paymentStore.updateVerifiedPurchase(currentReceipt);
      if (!isMountedRef.current) return;
      setPurchase(currentReceipt);
      showNotice(format === 'pdf'
        ? 'File PDF siap cetak berhasil diunduh dengan watermark.'
        : 'File EPUB berhasil diunduh.');
    } catch (error) {
      console.error(`${format.toUpperCase()} generation error:`, error);
      if (!isMountedRef.current) return;
      showNotice(error instanceof Error ? error.message : 'File gagal diproses. Mohon coba lagi.');
    } finally {
      generationFormatRef.current = null;
      if (isMountedRef.current) setActiveFormat(null);
    }
  }, [purchase, showNotice, story]);

  return {
    purchase,
    activeFormat,
    downloadNotice,
    expired,
    downloadLimitReached,
    renewToken,
    downloadPdf: useCallback(() => download('pdf'), [download]),
    downloadEpub: useCallback(() => download('epub'), [download]),
  };
}

export type OfflineDownloadController = ReturnType<typeof useOfflineDownloadController>;
