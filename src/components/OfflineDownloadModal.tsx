import React, { useState, useEffect } from 'react';
import { Story } from '../types';
import { paymentStore, PurchaseReceipt } from '../utils/paymentStore';
import { userAuthStore } from '../utils/userAuthStore';
import { generateStoryPDF, generateStoryEPUB } from '../utils/fileGenerators';
import {
  Download,
  FileText,
  BookOpen,
  X,
  ShieldCheck,
  Clock,
  Sparkles,
  CheckCircle2,
  Printer,
  Tablet,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface OfflineDownloadModalProps {
  story: Story;
  onClose: () => void;
  isNight?: boolean;
}

export const OfflineDownloadModal: React.FC<OfflineDownloadModalProps> = ({
  story,
  onClose,
  isNight = false,
}) => {
  const [purchase, setPurchase] = useState<PurchaseReceipt | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingEpub, setIsGeneratingEpub] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  useEffect(() => {
    const data = paymentStore.getStoryPurchase(story.id);
    if (data) {
      setPurchase(data);
      return;
    }

    const user = userAuthStore.getUser();
    if (userAuthStore.isVip() && user) {
      setPurchase({
        storyId: story.id,
        storyTitle: story.title,
        customerName: user.name,
        customerEmail: user.email,
        transactionId: `VIP-${user.id}`,
        paymentMethod: 'vip',
        amount: 0,
        purchasedAt: user.createdAt,
        downloadCount: 0,
        tokenExpiresAt: user.vipExpiresAt || new Date().toISOString(),
      });
      return;
    }

    setPurchase(null);
  }, [story.id]);

  const isTokenExpired = () => {
    if (!purchase) return true;
    const expires = new Date(purchase.tokenExpiresAt).getTime();
    return Date.now() > expires;
  };

  const handleRenewToken = async () => {
    const updated = await paymentStore.renewToken(story.id);
    setPurchase(updated);
    setDownloadNotice('✅ Masa berlaku link unduhan diperbarui untuk 24 jam ke depan!');
    setTimeout(() => setDownloadNotice(null), 3500);
  };

  const triggerFileSave = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    if (!purchase) return;
    if (purchase.paymentMethod !== 'vip' && purchase.downloadCount >= 3) {
      setDownloadNotice('❌ Batas 3 kali unduh sudah tercapai. Perbarui masa berlaku link untuk mengunduh lagi.');
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const pdfBlob = await generateStoryPDF(story, {
        name: purchase.customerName,
        email: purchase.customerEmail,
        transactionId: purchase.transactionId,
      });

      const cleanTitle = story.title.replace(/[^a-zA-Z0-9]/g, '_');
      triggerFileSave(pdfBlob, `${cleanTitle}_Cetak_Buku.pdf`);

      const newCount =
        purchase.paymentMethod === 'vip' ? purchase.downloadCount + 1 : paymentStore.incrementDownloadCount(story.id);
      setPurchase((prev) => (prev ? { ...prev, downloadCount: newCount } : null));

      setDownloadNotice('🎉 File PDF Siap Cetak berhasil diunduh dengan stempel Watermark!');
    } catch (err) {
      console.error('PDF generation error:', err);
      setDownloadNotice('❌ Gagal memproses file PDF. Mohon coba lagi.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadEpub = async () => {
    if (!purchase) return;
    if (purchase.paymentMethod !== 'vip' && purchase.downloadCount >= 3) {
      setDownloadNotice('❌ Batas 3 kali unduh sudah tercapai. Perbarui masa berlaku link untuk mengunduh lagi.');
      return;
    }

    setIsGeneratingEpub(true);
    try {
      const epubBlob = await generateStoryEPUB(story, {
        name: purchase.customerName,
        email: purchase.customerEmail,
        transactionId: purchase.transactionId,
      });

      const cleanTitle = story.title.replace(/[^a-zA-Z0-9]/g, '_');
      triggerFileSave(epubBlob, `${cleanTitle}_Tablet.epub`);

      const newCount =
        purchase.paymentMethod === 'vip' ? purchase.downloadCount + 1 : paymentStore.incrementDownloadCount(story.id);
      setPurchase((prev) => (prev ? { ...prev, downloadCount: newCount } : null));

      setDownloadNotice('🎉 File EPUB E-Book berhasil diunduh!');
    } catch (err) {
      console.error('EPUB generation error:', err);
      setDownloadNotice('❌ Gagal memproses file EPUB. Mohon coba lagi.');
    } finally {
      setIsGeneratingEpub(false);
    }
  };

  const expired = isTokenExpired();
  const downloadLimitReached = !!purchase && purchase.paymentMethod !== 'vip' && purchase.downloadCount >= 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-overlay)] backdrop-blur-sm animate-fade-in">
      <div className="app-modal w-full max-w-lg rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-default">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-brand-green text-white shadow-sm">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-success">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Lisensi unduhan aktif</span>
              </div>
              <h2 className="text-xl sm:text-2xl mb-0 tracking-normal">Unduh versi offline</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface text-secondary transition-colors"
            title="Tutup Modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Story Info Banner */}
        <div className="p-3.5 rounded-xl bg-surface border border-default shadow-sm flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${story.coverBg} flex items-center justify-center text-white shrink-0 shadow-md`}
          >
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-xs sm:text-sm truncate">{story.title}</h4>
            <span className="text-[11px] text-secondary">
              {story.pages.length} Halaman Cerita Bergambar
            </span>
          </div>
        </div>

        {/* Security & Expiration Info Box */}
        <div className="p-3.5 rounded-xl bg-surface/50 border border-default text-xs flex flex-col gap-2">
          <div className="flex items-center justify-between font-extrabold text-primary">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-brand-gold" /> Masa berlaku link:
            </span>
            <span className={expired ? 'text-error' : 'text-success'}>
              {expired ? 'Kedaluwarsa (24 Jam)' : 'Aktif'}
            </span>
          </div>

          {purchase && (
            <div className="grid grid-cols-2 gap-2 text-[11px] text-secondary">
              <div>
                Pembeli: <strong>{purchase.customerName}</strong>
              </div>
              <div>
                ID Order: <strong>#{purchase.transactionId}</strong>
              </div>
              <div>
                Sisa Unduhan: <strong>{Math.max(0, 3 - purchase.downloadCount)} / 3 kali</strong>
              </div>
              <div>
                Watermark: <strong className="text-success">Aktif Pada File</strong>
              </div>
            </div>
          )}

          {expired && (
            <button
              onClick={handleRenewToken}
              disabled={purchase?.paymentMethod === 'vip'}
              className="mt-1 py-2 px-3 rounded-xl bg-brand-gold text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-transform hover:scale-[1.02]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Perbarui masa berlaku link</span>
            </button>
          )}

          {downloadLimitReached && (
            <div className="text-[11px] font-bold text-error">
              Batas unduh 3 kali sudah tercapai untuk token ini.
            </div>
          )}
        </div>

        {/* Notice Message */}
        {downloadNotice && (
          <div className="p-3 rounded-xl bg-success/10 border border-success/30 text-success text-xs font-bold animate-fade-in flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-success" />
            <span>{downloadNotice}</span>
          </div>
        )}

        {/* Format Choices */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold text-secondary">
            Pilih format file
          </span>

          {/* Option 1: PDF Printable (Primary Recommendation) */}
          <div className="p-4 rounded-xl bg-surface border border-default shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-error/10 text-error font-bold shrink-0">
                <Printer className="w-6 h-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-gold/15 text-brand-gold text-[10px] font-bold">
                  Rekomendasi cetak
                </div>
                <h4 className="font-extrabold text-sm text-primary mt-0.5">
                  Format PDF (Printable Book)
                </h4>
                <p className="text-[11px] text-secondary leading-tight">
                  Cocok dicetak di kertas HVS/Karton agar anak bisa membaca buku fisik tanpa layar.
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf || expired || downloadLimitReached}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-brand-rose hover:bg-brand-rose/90 text-white font-bold text-xs shadow-sm transition-transform hover:scale-[1.02] flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyiapkan PDF...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Unduh PDF</span>
                </>
              )}
            </button>
          </div>

          {/* Option 2: EPUB (For Tablet / iPad / Apple Books) */}
          <div className="p-4 rounded-xl bg-surface border border-default shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-brand-blue/10 text-brand-blue font-bold shrink-0">
                <Tablet className="w-6 h-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-blue/15 text-brand-blue text-[10px] font-bold">
                  Untuk tablet
                </div>
                <h4 className="font-extrabold text-sm text-primary mt-0.5">
                  Format EPUB (E-Book)
                </h4>
                <p className="text-[11px] text-secondary leading-tight">
                  Disimpan di Apple Books / Google Play Books untuk dibaca saat bepergian tanpa internet.
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadEpub}
              disabled={isGeneratingEpub || expired || downloadLimitReached}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs shadow-sm transition-transform hover:scale-[1.02] flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              {isGeneratingEpub ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyiapkan EPUB...</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  <span>Unduh EPUB</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security Stamping Footer */}
        <div className="p-3 rounded-xl bg-surface border border-default text-secondary text-[11px] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-success shrink-0" />
          <span>
            <strong>Stempel Digital Watermark:</strong> Setiap halaman dicetak identitas pembeli ({purchase?.customerName}) untuk keamanan hak cipta.
          </span>
        </div>
      </div>
    </div>
  );
};
