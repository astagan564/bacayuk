import type { MidtransCallbacks } from '@/features/commerce/types/paymentGateway';

const MIDTRANS_SCRIPT_ID = 'bacayuk-midtrans-snap';

export function mountMidtransSnapScript(): () => void {
  const existingScript = document.getElementById(MIDTRANS_SCRIPT_ID);
  if (existingScript) return () => undefined;

  const script = document.createElement('script');
  script.id = MIDTRANS_SCRIPT_ID;
  script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
  script.setAttribute(
    'data-client-key',
    import.meta.env.VITE_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-YOUR_CLIENT_KEY',
  );
  script.async = true;
  document.body.appendChild(script);

  return () => script.remove();
}

export function openMidtransPayment(token: string, callbacks: MidtransCallbacks): void {
  if (!window.snap) throw new Error('Layanan pembayaran belum siap. Coba lagi sebentar.');
  window.snap.pay(token, callbacks);
}
