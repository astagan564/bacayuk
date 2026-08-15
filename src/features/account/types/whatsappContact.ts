export interface WhatsAppContact {
  id: number;
  phoneE164: string;
  label: string;
  isDefault: boolean;
  orderNotificationsEnabled: boolean;
  consentedAt: string | null;
  optedOutAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaveWhatsAppContactInput {
  phone: string;
  label: string;
  isDefault?: boolean;
  orderNotificationsEnabled?: boolean;
  consentConfirmed?: boolean;
}
