import type { Express } from 'express';
import { getSupabaseAdminClient } from '../clients/supabaseAdminClient';
import { isValidAdminPin } from '../middleware/adminAuth';

const DEFAULT_SETTINGS = {
  eyeRestIntervalMinutes: 20,
  downloadLinkExpireHours: 24,
  defaultEbookPrice: 15000,
  enableGlobalWatermark: true,
  allowGuestFreeBookCount: 1,
  enableCopyProtection: true,
  promoBannerText: '',
  promoBannerActive: false,
};

function mapSettings(row: Record<string, unknown> | null) {
  if (!row) return DEFAULT_SETTINGS;
  return {
    eyeRestIntervalMinutes: Number(row.eye_rest_interval_minutes),
    downloadLinkExpireHours: Number(row.download_link_expire_hours),
    defaultEbookPrice: Number(row.default_ebook_price),
    enableGlobalWatermark: Boolean(row.enable_global_watermark),
    allowGuestFreeBookCount: Number(row.allow_guest_free_book_count),
    enableCopyProtection: Boolean(row.enable_copy_protection),
    promoBannerText: String(row.promo_banner_text || ''),
    promoBannerActive: Boolean(row.promo_banner_active),
  };
}

function integerInRange(value: unknown, min: number, max: number, field: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${field} tidak valid.`);
  }
  return parsed;
}

export function registerSettingsRoutes(app: Express) {
  app.get('/api/settings', async (_req, res) => {
    try {
      const { data, error } = await getSupabaseAdminClient()
        .from('admin_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      if (error) throw error;
      res.json({ settings: mapSettings(data) });
    } catch (error) {
      console.error('Failed to load public settings:', error);
      res.status(503).json({ error: 'Pengaturan global belum dapat dimuat.' });
    }
  });

  app.put('/api/admin/settings', async (req, res) => {
    if (!isValidAdminPin(req.headers['x-admin-pin'])) {
      return res.status(401).json({ error: 'PIN Admin tidak valid.' });
    }

    try {
      const settings = req.body?.settings || {};
      const row = {
        id: 1,
        eye_rest_interval_minutes: integerInRange(settings.eyeRestIntervalMinutes, 5, 60, 'Interval istirahat'),
        download_link_expire_hours: integerInRange(settings.downloadLinkExpireHours, 1, 168, 'Masa aktif unduhan'),
        default_ebook_price: integerInRange(settings.defaultEbookPrice, 1000, 10000000, 'Harga e-book'),
        enable_global_watermark: Boolean(settings.enableGlobalWatermark),
        allow_guest_free_book_count: integerInRange(settings.allowGuestFreeBookCount, 0, 10, 'Jumlah buku tamu'),
        enable_copy_protection: Boolean(settings.enableCopyProtection),
        promo_banner_text: typeof settings.promoBannerText === 'string'
          ? settings.promoBannerText.trim().slice(0, 280)
          : '',
        promo_banner_active: Boolean(settings.promoBannerActive),
      };
      if (row.promo_banner_active && !row.promo_banner_text) {
        return res.status(400).json({ error: 'Isi banner promo wajib diisi saat banner aktif.' });
      }

      const { data, error } = await getSupabaseAdminClient()
        .from('admin_settings')
        .upsert(row)
        .select('*')
        .single();
      if (error) throw error;
      res.json({ settings: mapSettings(data) });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : typeof error === 'object' && error && 'message' in error
          ? String(error.message)
          : 'Pengaturan tidak dapat disimpan.';
      res.status(400).json({ error: message });
    }
  });
}
