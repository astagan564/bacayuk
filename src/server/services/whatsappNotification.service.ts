interface PaymentReviewNotificationOrder {
  order_id: string;
  customer_name: string;
  story_title: string;
  purchase_type: 'book' | 'vip';
  amount: number;
  payment_method: string | null;
}

interface WhatsAppMessagesResponse {
  messages?: Array<{ id?: unknown }>;
  error?: {
    message?: unknown;
    code?: unknown;
  };
}

interface WhatsAppTemplateRequest {
  recipient: string;
  templateName: string;
  languageCode: string;
  components: Array<Record<string, unknown>>;
}

export interface WhatsAppNotificationResult {
  messageId: string;
}

function cleanEnv(name: string) {
  return process.env[name]?.trim() || '';
}

function normalizeRecipient(value: string) {
  const digits = value.replace(/\D/g, '');
  const normalized = digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
  return /^\d{8,15}$/.test(normalized) ? normalized : '';
}

function getWhatsAppConfig() {
  return {
    accessToken: cleanEnv('WHATSAPP_CLOUD_API_ACCESS_TOKEN'),
    phoneNumberId: cleanEnv('WHATSAPP_CLOUD_API_PHONE_NUMBER_ID'),
    recipient: normalizeRecipient(cleanEnv('WHATSAPP_ADMIN_RECIPIENT')),
    graphApiVersion: cleanEnv('WHATSAPP_CLOUD_API_VERSION'),
    templateName: cleanEnv('WHATSAPP_PAYMENT_REVIEW_TEMPLATE'),
    languageCode: cleanEnv('WHATSAPP_PAYMENT_REVIEW_TEMPLATE_LANGUAGE') || 'id',
    adminReviewUrl: cleanEnv('WHATSAPP_ADMIN_REVIEW_URL') || 'https://bacayuk.web.id/admin/finance',
    verificationTemplateName: cleanEnv('WHATSAPP_CONTACT_VERIFICATION_TEMPLATE'),
    verificationTemplateLanguage: cleanEnv('WHATSAPP_CONTACT_VERIFICATION_TEMPLATE_LANGUAGE') || 'id',
  };
}

export function isWhatsAppContactVerificationConfigured() {
  const config = getWhatsAppConfig();
  return Boolean(
    config.accessToken
    && /^\d+$/.test(config.phoneNumberId)
    && /^v\d+\.\d+$/.test(config.graphApiVersion)
    && /^[a-z0-9_]+$/.test(config.verificationTemplateName)
    && cleanEnv('WHATSAPP_CONTACT_VERIFICATION_SECRET').length >= 32,
  );
}

async function sendWhatsAppTemplate(request: WhatsAppTemplateRequest): Promise<WhatsAppNotificationResult> {
  const config = getWhatsAppConfig();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`https://graph.facebook.com/${config.graphApiVersion}/${config.phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp', recipient_type: 'individual', to: request.recipient, type: 'template',
        template: {
          name: request.templateName,
          language: { code: request.languageCode },
          components: request.components,
        },
      }),
      signal: controller.signal,
    });
    const result = await response.json().catch(() => ({})) as WhatsAppMessagesResponse;
    const messageId = typeof result.messages?.[0]?.id === 'string' ? result.messages[0].id : '';
    if (!response.ok || !messageId) {
      const detail = typeof result.error?.message === 'string' ? result.error.message.slice(0, 300) : `HTTP ${response.status}`;
      throw new Error(`WhatsApp menolak notifikasi: ${detail}`);
    }
    return { messageId };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('WhatsApp tidak merespons dalam 8 detik.');
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function sendWhatsAppContactVerificationCode(recipient: string, code: string) {
  const config = getWhatsAppConfig();
  if (!isWhatsAppContactVerificationConfigured()) throw new Error('Verifikasi nomor WhatsApp belum dikonfigurasi lengkap.');
  return sendWhatsAppTemplate({
    recipient: normalizeRecipient(recipient),
    templateName: config.verificationTemplateName,
    languageCode: config.verificationTemplateLanguage,
    components: [
      { type: 'body', parameters: [{ type: 'text', text: code }] },
      { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: code }] },
    ],
  });
}

export function isWhatsAppPaymentNotificationConfigured() {
  const config = getWhatsAppConfig();
  return Boolean(
    config.accessToken
    && /^\d+$/.test(config.phoneNumberId)
    && config.recipient
    && /^v\d+\.\d+$/.test(config.graphApiVersion)
    && /^[a-z0-9_]+$/.test(config.templateName),
  );
}

function paymentMethodLabel(value: string | null) {
  return value === 'manual_bank_transfer' ? 'Transfer bank' : 'QRIS';
}

function productLabel(order: PaymentReviewNotificationOrder) {
  return order.purchase_type === 'vip' ? 'VIP BacaYuk 1 bulan' : order.story_title;
}

export async function sendPaymentReviewWhatsAppTemplate(
  order: PaymentReviewNotificationOrder,
): Promise<WhatsAppNotificationResult> {
  const config = getWhatsAppConfig();
  if (!isWhatsAppPaymentNotificationConfigured()) {
    throw new Error('Notifikasi WhatsApp belum dikonfigurasi lengkap.');
  }

  return sendWhatsAppTemplate({
    recipient: config.recipient,
    templateName: config.templateName,
    languageCode: config.languageCode,
    components: [{ type: 'body', parameters: [
      { type: 'text', text: order.order_id },
      { type: 'text', text: productLabel(order) },
      { type: 'text', text: `Rp ${order.amount.toLocaleString('id-ID')}` },
      { type: 'text', text: paymentMethodLabel(order.payment_method) },
    ] }],
  });
}
