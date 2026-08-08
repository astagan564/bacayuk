import React, { useState, useEffect } from 'react';
import { Story } from '../types';
import { paymentStore, PurchaseReceipt } from '../utils/paymentStore';
import { adminStore } from '../utils/adminStore';
import { userAuthStore } from '../utils/userAuthStore';
import {
  CreditCard,
  QrCode,
  Smartphone,
  Building2,
  CheckCircle2,
  Lock,
  X,
  Sparkles,
  ShieldCheck,
  Clock,
  Copy,
  Check,
  Download,
  BookOpen,
  Tag,
} from 'lucide-react';

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks: {
          onSuccess: (result: MidtransPaymentResult) => void | Promise<void>;
          onPending: (result: MidtransPaymentResult) => void;
          onError: (result: MidtransPaymentResult) => void;
          onClose: () => void;
        }
      ) => void;
    };
  }
}

interface MidtransPaymentResult {
  order_id?: string;
  payment_type?: string;
}

interface CreateTransactionResponse {
  token: string;
  orderId: string;
  amount: number;
  discountAmount: number;
  couponCode: string | null;
  storyId: string;
  storyTitle: string;
  purchaseType: 'book' | 'vip';
}

interface PaymentGatewayModalProps {
  story?: Story;
  onClose: () => void;
  onPaymentSuccess: (receipt: PurchaseReceipt) => void;
  isNight?: boolean;
  isVipOnly?: boolean;
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  story,
  onClose,
  onPaymentSuccess,
  isNight = false,
  isVipOnly = false,
}) => {
  const adminSettings = adminStore.getSettings();
  const basePrice = story?.ebookPrice || adminSettings.defaultEbookPrice;
  const vipPrice = 100000;

  const [purchaseType, setPurchaseType] = useState<'book' | 'vip'>(isVipOnly ? 'vip' : 'book');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'gopay' | 'ovo' | 'va_bca' | 'va_mandiri'>('qris');
  const [couponInput, setCouponInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<PurchaseReceipt | null>(null);
  const [copiedVa, setCopiedVa] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const priceBeforeDiscount = purchaseType === 'book' ? basePrice : vipPrice;
  const finalPrice = Math.max(0, priceBeforeDiscount - appliedDiscount);

  // Load Snap.js
  useEffect(() => {
    const snapScript = 'https://app.sandbox.midtrans.com/snap/snap.js';
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-YOUR_CLIENT_KEY';

    const script = document.createElement('script');
    script.src = snapScript;
    script.setAttribute('data-client-key', clientKey);
    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    const result = adminStore.validateCoupon(couponInput, priceBeforeDiscount);
    if (result.valid) {
      setAppliedDiscount(result.discountAmount);
      setAppliedCouponCode(result.coupon?.code || couponInput.toUpperCase());
      setCouponMessage(`🎉 Kupon hemat Rp ${result.discountAmount.toLocaleString('id-ID')} berhasil dipasang!`);
    } else {
      setCouponMessage(`⚠️ ${result.message}`);
      setAppliedDiscount(0);
      setAppliedCouponCode(null);
    }
  };

  const handleMidtransPayment = async () => {
    if (!customerName.trim() || !customerEmail.trim()) {
      setErrorMessage('Mohon lengkapi nama dan alamat email orang tua/pembeli!');
      return;
    }

    if (!customerEmail.includes('@') || !customerEmail.includes('.')) {
      setErrorMessage('Mohon masukkan alamat email yang valid!');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const response = await fetch('/api/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseType,
          storyId: story?.id,
          storyTitle: story?.title,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim().toLowerCase(),
          couponCode: appliedCouponCode,
        })
      });

      const data: CreateTransactionResponse & { error?: string } = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Gagal memuat token transaksi');
      }

      if (!window.snap) {
        throw new Error('Midtrans Snap belum siap. Mohon coba lagi.');
      }

      window.snap.pay(data.token, {
        onSuccess: async function (result) {
          const orderId = result.order_id || data.orderId;
          const verifyResponse = await fetch('/api/verify-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId }),
          });
          const verification = await verifyResponse.json();

          if (!verifyResponse.ok || !verification.isPaid) {
            setIsProcessing(false);
            setErrorMessage('Pembayaran belum terverifikasi oleh server. Harap tunggu atau coba cek kembali.');
            return;
          }

          const expires = new Date();
          expires.setHours(expires.getHours() + adminSettings.downloadLinkExpireHours);
          
          let receipt: PurchaseReceipt | null = null;
          
          if (purchaseType === 'book' && story) {
            receipt = {
              storyId: story.id,
              storyTitle: story.title,
              customerName: customerName.trim(),
              customerEmail: customerEmail.trim().toLowerCase(),
              transactionId: orderId,
              paymentMethod: result.payment_type || 'midtrans',
              amount: data.amount,
              purchasedAt: new Date().toISOString(),
              downloadCount: 0,
              tokenExpiresAt: expires.toISOString(),
            };
            paymentStore.savePurchase(receipt);
            setCurrentReceipt(receipt);
          } else {
            // VIP Subscription
            await userAuthStore.activateVip();
            // Create a fake receipt for UI success state
            receipt = {
              storyId: 'vip_sub',
              storyTitle: 'Langganan VIP 1 Bulan',
              customerName: customerName.trim(),
              customerEmail: customerEmail.trim().toLowerCase(),
              transactionId: orderId,
              paymentMethod: result.payment_type || 'midtrans',
              amount: data.amount,
              purchasedAt: new Date().toISOString(),
              downloadCount: 0,
              tokenExpiresAt: expires.toISOString(),
            };
            setCurrentReceipt(receipt);
          }

          if (appliedCouponCode) {
            adminStore.useCoupon(appliedCouponCode);
          }

          // Log transaction to admin store
          adminStore.addTransaction({
            id: orderId,
            customerName: customerName.trim(),
            customerEmail: customerEmail.trim().toLowerCase(),
            storyId: purchaseType === 'vip' ? 'vip_sub' : (story?.id || 'unknown'),
            storyTitle: purchaseType === 'vip' ? 'Langganan VIP 1 Bulan' : (story?.title || 'Unknown'),
            paymentMethod: result.payment_type || 'midtrans',
            amount: data.amount,
            discountAmount: data.discountAmount,
            couponCode: data.couponCode || undefined,
            status: 'success',
            createdAt: new Date().toISOString(),
            paidAt: new Date().toISOString(),
          });

          setIsProcessing(false);
          setIsSuccess(true);
        },
        onPending: function () {
          setIsProcessing(false);
          setErrorMessage('Pembayaran tertunda. Harap selesaikan pembayaran Anda.');
        },
        onError: function () {
          setIsProcessing(false);
          setErrorMessage('Terjadi kesalahan saat memproses pembayaran.');
        },
        onClose: function () {
          setIsProcessing(false);
        }
      });
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
      setErrorMessage('Koneksi ke Midtrans gagal.');
    }
  };

  const handleCopyVa = (num: string) => {
    navigator.clipboard.writeText(num.replace(/\s+/g, ''));
    setCopiedVa(true);
    setTimeout(() => setCopiedVa(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl border-4 relative overflow-hidden flex flex-col gap-6 max-h-[90vh] overflow-y-auto ${
          isNight
            ? 'bg-slate-900 text-slate-100 border-indigo-500/80'
            : 'bg-amber-50 text-amber-950 border-amber-300'
        }`}
      >
        {/* Glow Background */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-200/50">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-amber-950 font-black shadow-md">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-indigo-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pembayaran Resmi Terproteksi (Midtrans Gateway)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">{isVipOnly ? 'Aktivasi VIP Member' : 'Unduh Versi Offline (PDF & EPUB)'}</h2>
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

        {!isSuccess ? (
          <>
            {/* Order Summary Item */}
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-amber-200 dark:border-indigo-800/80 shadow-sm flex flex-col gap-4">
              
              {/* Plan Selection */}
              <div className="flex flex-col sm:flex-row gap-3">
                {!isVipOnly && (
                  <button
                    type="button"
                    onClick={() => setPurchaseType('book')}
                    className={`flex-1 p-3 rounded-xl border-2 flex flex-col items-start gap-1 text-left transition-all ${
                      purchaseType === 'book' 
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10' 
                        : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <span className="text-xs font-black text-amber-800 dark:text-amber-200">Beli Satuan</span>
                    <span className="text-[10px] font-medium leading-tight">1 Buku "{story?.title}" selamanya</span>
                    <span className="font-bold text-amber-600 mt-1">Rp {basePrice.toLocaleString('id-ID')}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setPurchaseType('vip')}
                  className={`flex-1 p-3 rounded-xl border-2 flex flex-col items-start gap-1 text-left transition-all ${
                    purchaseType === 'vip' 
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10' 
                      : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span className="text-xs font-black text-purple-800 dark:text-purple-200">Langganan VIP</span>
                  </div>
                  <span className="text-[10px] font-medium leading-tight">Unduh Semua Buku & 10 Cerita AI/bln</span>
                  <span className="font-bold text-purple-600 mt-1">Rp {vipPrice.toLocaleString('id-ID')}</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 pt-3 border-t border-amber-100 dark:border-slate-700">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${purchaseType === 'vip' ? 'from-purple-500 to-indigo-600' : (story?.coverBg || 'from-slate-200 to-slate-300')} flex items-center justify-center text-white shrink-0 shadow-md`}
                  >
                    {purchaseType === 'vip' ? <Sparkles className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-sm sm:text-base truncate">
                      {purchaseType === 'vip' ? 'Langganan VIP (1 Bulan)' : story?.title}
                    </h4>
                    <span className="text-xs font-medium text-amber-800/80 dark:text-indigo-200">
                      {purchaseType === 'vip' ? 'Akses Penuh Semua Fitur Premium' : 'Lisensi Unduh Permanen (PDF Siap Cetak + EPUB)'}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {appliedDiscount > 0 && (
                    <div className="text-xs text-slate-500 line-through">
                      Rp {priceBeforeDiscount.toLocaleString('id-ID')}
                    </div>
                  )}
                  <div className="text-lg font-black text-amber-600 dark:text-amber-400">
                    Rp {finalPrice.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              {/* Coupon Code Input */}
              <div className="pt-2 border-t border-amber-100 dark:border-slate-700 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-600 shrink-0" />
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Punya kode kupon? (misal: BUKUANAK20)"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-xs font-bold uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shrink-0 shadow-sm"
                  >
                    Pasang
                  </button>
                </div>

                {couponMessage && (
                  <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                    {couponMessage}
                  </div>
                )}
              </div>
            </div>

            {/* Form Input Parent/Buyer Details */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-black uppercase text-amber-900 dark:text-indigo-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Informasi Pembeli (Untuk Stempel Digital Watermark)</span>
              </label>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold">
                  ⚠️ {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Nama Orang Tua / Pembeli
                  </span>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Alamat Email (Penerima Bukti)
                  </span>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Contoh: orangtua@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Midtrans Info */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-100/70 to-orange-100/70 dark:from-slate-800/80 dark:to-slate-900/80 border border-amber-300/80 dark:border-indigo-700/80 flex flex-col items-center text-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="w-10 h-10 text-emerald-600 mb-1" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Pembayaran Aman dengan Midtrans
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Pilih metode pembayaran (QRIS, GoPay, OVO, VA BCA/Mandiri, dll) di layar selanjutnya.
                </p>
              </div>
            </div>

            {/* Watermarking Protection Notice */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-900 dark:text-indigo-200 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Proteksi Stempel Digital Watermark:</strong> Setiap halaman file PDF/EPUB yang diunduh akan otomatis dicetak nama & email Anda di bagian pojok bawah untuk keamanan lisensi.
              </span>
            </div>

            {/* Action Pay Button */}
            <button
              type="button"
              onClick={handleMidtransPayment}
              disabled={isProcessing}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 hover:from-amber-500 hover:to-orange-400 text-white font-black text-sm shadow-xl transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memproses Pembayaran Midtrans...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Bayar Rp {finalPrice.toLocaleString('id-ID')} & Buka Akses Unduhan</span>
                </>
              )}
            </button>
          </>
        ) : (
          /* Success Screen */
          <div className="flex flex-col items-center text-center gap-4 py-4 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xl animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div>
              <span className="text-xs font-extrabold uppercase text-emerald-600 tracking-wider">
                🎉 Pembayaran Berhasil Disetujui!
              </span>
              <h3 className="text-2xl font-black text-amber-950 dark:text-indigo-100 mt-1">
                Akses Unduhan Offline Aktif
              </h3>
            </div>

            <div className="w-full p-4 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-amber-200 dark:border-indigo-800/80 text-left text-xs flex flex-col gap-2 shadow-sm">
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">ID Transaksi:</span>
                <span className="font-mono font-bold text-amber-900 dark:text-indigo-200">
                  #{currentReceipt?.transactionId}
                </span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Pemilik Lisensi:</span>
                <span className="font-bold">{currentReceipt?.customerName}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500">Email Terdaftar:</span>
                <span className="font-bold">{currentReceipt?.customerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status Token:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Masa Berlaku 24 Jam
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (currentReceipt) {
                  onPaymentSuccess(currentReceipt);
                }
              }}
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              {currentReceipt?.storyId === 'vip_sub' ? <Sparkles className="w-5 h-5" /> : <Download className="w-5 h-5" />}
              <span>{currentReceipt?.storyId === 'vip_sub' ? 'Mulai Gunakan Fitur VIP' : 'Buka Menu Unduh PDF / EPUB Sekarang'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
