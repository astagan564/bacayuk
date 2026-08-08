import React, { useState, useEffect } from 'react';
import { Story } from '../types';
import { paymentStore, PurchaseReceipt } from '../utils/paymentStore';
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
    setPurchase(data);
  }, [story.id]);

  const isTokenExpired = () => {
    if (!purchase) return true;
    const expires = new Date(purchase.tokenExpiresAt).getTime();
    return Date.now() > expires;
  };

  const handleRenewToken = () => {
    const updated = paymentStore.renewToken(story.id);
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

    setIsGeneratingPdf(true);
    try {
      const pdfBlob = await generateStoryPDF(story, {
        name: purchase.customerName,
        email: purchase.customerEmail,
        transactionId: purchase.transactionId,
      });

      const cleanTitle = story.title.replace(/[^a-zA-Z0-9]/g, '_');
      triggerFileSave(pdfBlob, `${cleanTitle}_Cetak_Buku.pdf`);

      const newCount = paymentStore.incrementDownloadCount(story.id);
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

    setIsGeneratingEpub(true);
    try {
      const epubBlob = await generateStoryEPUB(story, {
        name: purchase.customerName,
        email: purchase.customerEmail,
        transactionId: purchase.transactionId,
      });

      const cleanTitle = story.title.replace(/[^a-zA-Z0-9]/g, '_');
      triggerFileSave(epubBlob, `${cleanTitle}_Tablet.epub`);

      const newCount = paymentStore.incrementDownloadCount(story.id);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border-4 relative overflow-hidden flex flex-col gap-5 ${
          isNight
            ? 'bg-slate-900 text-slate-100 border-indigo-500/80'
            : 'bg-amber-50 text-amber-950 border-amber-300'
        }`}
      >
        {/* Glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-200/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white font-black shadow-md">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Lisensi Unduhan Offline Aktif</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Unduh Versi Offline</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/10 transition-colors"
            title="Tutup Modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Story Info Banner */}
        <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-amber-200 dark:border-indigo-800/80 shadow-sm flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${story.coverBg} flex items-center justify-center text-white shrink-0 shadow-md`}
          >
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-xs sm:text-sm truncate">{story.title}</h4>
            <span className="text-[11px] text-amber-800/80 dark:text-indigo-200">
              {story.pages.length} Halaman Cerita Bergambar
            </span>
          </div>
        </div>

        {/* Dynamic Security & Expiration Info Box */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-100/80 to-orange-100/80 dark:from-slate-800 dark:to-slate-850 border border-amber-300 dark:border-indigo-700/80 text-xs flex flex-col gap-2">
          <div className="flex items-center justify-between font-extrabold text-amber-900 dark:text-indigo-200">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Masa Berlaku Link Dynamic:
            </span>
            <span className={expired ? 'text-rose-600' : 'text-emerald-600'}>
              {expired ? 'Kedaluwarsa (24 Jam)' : 'Aktif'}
            </span>
          </div>

          {purchase && (
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-300">
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
                Watermark: <strong className="text-emerald-600">Aktif Pada File</strong>
              </div>
            </div>
          )}

          {expired && (
            <button
              onClick={handleRenewToken}
              className="mt-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-transform hover:scale-[1.02]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Perbarui Masa Berlaku Dynamic Link (Gratis)</span>
            </button>
          )}
        </div>

        {/* Notice Message */}
        {downloadNotice && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold animate-fade-in flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{downloadNotice}</span>
          </div>
        )}

        {/* Format Choices */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-black uppercase text-amber-900 dark:text-indigo-200">
            Pilih Format Berkas Offline
          </span>

          {/* Option 1: PDF Printable (Primary Recommendation) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-amber-300 dark:border-indigo-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-red-100 text-red-600 font-bold shrink-0">
                <Printer className="w-6 h-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                  ⭐ Rekomendasi Cetak Di Rumah
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                  Format PDF (Printable Book)
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Cocok dicetak di kertas HVS/Karton agar anak bisa membaca buku fisik tanpa layar.
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf || expired}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-md transition-transform hover:scale-105 flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
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
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-amber-300 dark:border-indigo-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 font-bold shrink-0">
                <Tablet className="w-6 h-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-extrabold">
                  📱 Untuk Tablet & iPad
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                  Format EPUB (E-Book)
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Disimpan di Apple Books / Google Play Books untuk dibaca saat bepergian tanpa internet.
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadEpub}
              disabled={isGeneratingEpub || expired}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md transition-transform hover:scale-105 flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
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
        <div className="p-3 rounded-xl bg-slate-900 text-slate-200 text-[11px] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Stempel Digital Watermark:</strong> Setiap halaman dicetak identitas pembeli ({purchase?.customerName}) untuk keamanan hak cipta.
          </span>
        </div>
      </div>
    </div>
  );
};
