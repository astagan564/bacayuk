import React, { useEffect, useState } from 'react';
import { Story } from '../types';
import { paymentStore, PurchaseReceipt } from '../utils/paymentStore';
import { adminStore } from '../utils/adminStore';
import { userAuthStore } from '../utils/userAuthStore';
import {
  BookOpen,
  CheckCircle2,
  Download,
  Lock,
  ShieldCheck,
  Sparkles,
  Tag,
  X,
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
  const [couponInput, setCouponInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<PurchaseReceipt | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const priceBeforeDiscount = purchaseType === 'book' ? basePrice : vipPrice;
  const finalPrice = Math.max(0, priceBeforeDiscount - appliedDiscount);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-YOUR_CLIENT_KEY');
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
      setCouponMessage(`Kupon terpasang. Hemat Rp ${result.discountAmount.toLocaleString('id-ID')}.`);
    } else {
      setCouponMessage(result.message || 'Kupon tidak dapat digunakan.');
      setAppliedDiscount(0);
      setAppliedCouponCode(null);
    }
  };

  const handleMidtransPayment = async () => {
    if (!customerName.trim() || !customerEmail.trim()) {
      setErrorMessage('Isi nama dan email pembeli terlebih dahulu.');
      return;
    }

    if (!customerEmail.includes('@') || !customerEmail.includes('.')) {
      setErrorMessage('Gunakan alamat email yang valid.');
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
        }),
      });

      const data: CreateTransactionResponse & { error?: string } = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Transaksi belum dapat dibuat.');
      }

      if (!window.snap) {
        throw new Error('Layanan pembayaran belum siap. Coba lagi sebentar.');
      }

      window.snap.pay(data.token, {
        onSuccess: async (result) => {
          const orderId = result.order_id || data.orderId;
          const verifyResponse = await fetch('/api/verify-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId }),
          });
          const verification = await verifyResponse.json();

          if (!verifyResponse.ok || !verification.isPaid) {
            setIsProcessing(false);
            setErrorMessage('Pembayaran belum terverifikasi. Tunggu beberapa saat lalu coba lagi.');
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
          } else {
            await userAuthStore.activateVip();
            receipt = {
              storyId: 'vip_sub',
              storyTitle: 'Langganan keluarga 1 bulan',
              customerName: customerName.trim(),
              customerEmail: customerEmail.trim().toLowerCase(),
              transactionId: orderId,
              paymentMethod: result.payment_type || 'midtrans',
              amount: data.amount,
              purchasedAt: new Date().toISOString(),
              downloadCount: 0,
              tokenExpiresAt: expires.toISOString(),
            };
          }

          if (appliedCouponCode) {
            adminStore.useCoupon(appliedCouponCode);
          }

          adminStore.addTransaction({
            id: orderId,
            customerName: customerName.trim(),
            customerEmail: customerEmail.trim().toLowerCase(),
            storyId: purchaseType === 'vip' ? 'vip_sub' : story?.id || 'unknown',
            storyTitle: purchaseType === 'vip' ? 'Langganan keluarga 1 bulan' : story?.title || 'Unknown',
            paymentMethod: result.payment_type || 'midtrans',
            amount: data.amount,
            discountAmount: data.discountAmount,
            couponCode: data.couponCode || undefined,
            status: 'success',
            createdAt: new Date().toISOString(),
            paidAt: new Date().toISOString(),
          });

          setCurrentReceipt(receipt);
          setIsProcessing(false);
          setIsSuccess(true);
        },
        onPending: () => {
          setIsProcessing(false);
          setErrorMessage('Pembayaran masih menunggu konfirmasi.');
        },
        onError: () => {
          setIsProcessing(false);
          setErrorMessage('Pembayaran gagal diproses.');
        },
        onClose: () => {
          setIsProcessing(false);
        },
      });
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
      setErrorMessage(error instanceof Error ? error.message : 'Koneksi pembayaran gagal.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1f140e]/70 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-2xl rounded-2xl border p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto ${
          isNight ? 'bg-[#111b29] text-slate-100 border-blue-900/70' : 'bg-[#fffaf0] text-[var(--ink)] border-[#eadbc1]'
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#eadbc1]/70 pb-4 dark:border-blue-900/60">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-[var(--story-green)] p-2.5 text-white">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-[var(--muted-ink)] dark:text-blue-200">Pembayaran aman</p>
              <h2 className="mb-0 text-2xl leading-tight text-balance">
                {isVipOnly ? 'Aktifkan langganan keluarga' : 'Buka unduhan offline'}
              </h2>
            </div>
          </div>

          <button onClick={onClose} className="rounded-xl p-2 text-[var(--muted-ink)] transition-colors hover:bg-black/5 dark:text-blue-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isSuccess ? (
          <div className="grid gap-5 pt-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {!isVipOnly && (
                <button
                  type="button"
                  onClick={() => setPurchaseType('book')}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    purchaseType === 'book'
                      ? 'border-[var(--story-green)] bg-[var(--story-green)]/10'
                      : 'border-[#eadbc1] bg-white/65 hover:bg-white dark:border-blue-900 dark:bg-blue-950/30'
                  }`}
                >
                  <BookOpen className="mb-3 w-5 h-5 text-[var(--story-green)]" />
                  <p className="text-sm font-extrabold">Beli satu buku</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted-ink)] dark:text-blue-100/75">{story?.title}</p>
                  <p className="mt-3 text-lg font-extrabold tabular-nums">Rp {basePrice.toLocaleString('id-ID')}</p>
                </button>
              )}

              <button
                type="button"
                onClick={() => setPurchaseType('vip')}
                className={`rounded-xl border p-4 text-left transition-all ${
                  purchaseType === 'vip'
                    ? 'border-[var(--magic-blue)] bg-[var(--magic-blue)]/10'
                    : 'border-[#eadbc1] bg-white/65 hover:bg-white dark:border-blue-900 dark:bg-blue-950/30'
                }`}
              >
                <Sparkles className="mb-3 w-5 h-5 text-[var(--magic-blue)]" />
                <p className="text-sm font-extrabold">Langganan keluarga</p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted-ink)] dark:text-blue-100/75">Unduh semua buku dan buat 10 cerita AI per bulan.</p>
                <p className="mt-3 text-lg font-extrabold tabular-nums">Rp {vipPrice.toLocaleString('id-ID')}</p>
              </button>
            </div>

            <div className="rounded-xl border border-[#eadbc1] bg-white/70 p-4 dark:border-blue-900 dark:bg-blue-950/25">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-[var(--muted-ink)] dark:text-blue-200">Ringkasan</p>
                  <h3 className="mb-1 mt-1 text-base font-extrabold font-sans">
                    {purchaseType === 'vip' ? 'Langganan keluarga 1 bulan' : story?.title}
                  </h3>
                  <p className="text-xs text-[var(--muted-ink)] dark:text-blue-100/75">
                    File akan diberi stempel nama dan email pembeli.
                  </p>
                </div>
                <div className="text-right">
                  {appliedDiscount > 0 && (
                    <p className="text-xs text-[var(--muted-ink)] line-through">Rp {priceBeforeDiscount.toLocaleString('id-ID')}</p>
                  )}
                  <p className="text-2xl font-extrabold tabular-nums">Rp {finalPrice.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-bold text-[var(--muted-ink)] dark:text-blue-200">
                Nama pembeli
                <input
                  type="text"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Budi Santoso"
                  className="rounded-xl border border-[#eadbc1] bg-white px-3 py-2.5 text-sm font-semibold text-[var(--ink)] dark:border-blue-900 dark:bg-blue-950 dark:text-white"
                />
              </label>
              <label className="grid gap-1.5 text-xs font-bold text-[var(--muted-ink)] dark:text-blue-200">
                Email bukti pembayaran
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(event) => setCustomerEmail(event.target.value)}
                  placeholder="orangtua@email.com"
                  className="rounded-xl border border-[#eadbc1] bg-white px-3 py-2.5 text-sm font-semibold text-[var(--ink)] dark:border-blue-900 dark:bg-blue-950 dark:text-white"
                />
              </label>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[var(--warm-gold)]" />
                <input
                  type="text"
                  value={couponInput}
                  onChange={(event) => setCouponInput(event.target.value)}
                  placeholder="Kode kupon"
                  className="min-w-0 flex-1 rounded-xl border border-[#eadbc1] bg-white px-3 py-2.5 text-xs font-bold uppercase text-[var(--ink)] dark:border-blue-900 dark:bg-blue-950 dark:text-white"
                />
                <button type="button" onClick={handleApplyCoupon} className="btn-secondary px-3 py-2.5 text-xs">
                  Pasang
                </button>
              </div>
              {couponMessage && <p className="text-xs font-semibold text-[var(--muted-ink)] dark:text-blue-200">{couponMessage}</p>}
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-[var(--rose)]/40 bg-[var(--rose)]/10 px-4 py-3 text-xs font-semibold text-[var(--rose)]">
                {errorMessage}
              </div>
            )}

            <div className="rounded-xl border border-[var(--story-green)]/25 bg-[rgba(47,143,107,0.08)] p-4 text-xs leading-6 text-[var(--muted-ink)] dark:text-blue-100/80">
              <div className="mb-1 flex items-center gap-2 font-extrabold text-[var(--story-green)]">
                <ShieldCheck className="w-4 h-4" />
                <span>Pembayaran diverifikasi di server</span>
              </div>
              Setelah pembayaran selesai, BacaYuk mengecek status transaksi sebelum membuka akses unduhan.
            </div>

            <button
              type="button"
              onClick={handleMidtransPayment}
              disabled={isProcessing}
              className="btn-primary flex w-full items-center justify-center gap-2 px-5 py-3.5 text-sm disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  <span>Memeriksa pembayaran</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Bayar Rp {finalPrice.toLocaleString('id-ID')}</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="grid gap-5 pt-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--story-green)] text-white">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--story-green)]">Pembayaran terverifikasi</p>
              <h3 className="mb-0 mt-1 text-3xl text-balance">Akses sudah aktif.</h3>
            </div>

            <div className="rounded-xl border border-[#eadbc1] bg-white/70 p-4 text-left text-xs dark:border-blue-900 dark:bg-blue-950/25">
              <div className="grid gap-2">
                <div className="flex justify-between gap-3 border-b border-[#eadbc1]/70 pb-2 dark:border-blue-900/50">
                  <span className="text-[var(--muted-ink)] dark:text-blue-200">ID transaksi</span>
                  <span className="font-mono font-bold">#{currentReceipt?.transactionId}</span>
                </div>
                <div className="flex justify-between gap-3 border-b border-[#eadbc1]/70 pb-2 dark:border-blue-900/50">
                  <span className="text-[var(--muted-ink)] dark:text-blue-200">Nama</span>
                  <span className="font-bold">{currentReceipt?.customerName}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-[var(--muted-ink)] dark:text-blue-200">Email</span>
                  <span className="font-bold">{currentReceipt?.customerEmail}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (currentReceipt) onPaymentSuccess(currentReceipt);
              }}
              className="btn-primary flex w-full items-center justify-center gap-2 px-5 py-3.5 text-sm"
            >
              {currentReceipt?.storyId === 'vip_sub' ? <Sparkles className="w-5 h-5" /> : <Download className="w-5 h-5" />}
              <span>{currentReceipt?.storyId === 'vip_sub' ? 'Mulai gunakan langganan' : 'Buka menu unduh'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
