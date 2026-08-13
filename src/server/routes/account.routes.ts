import type { Express, Request, Response } from 'express';
import { getSupabaseAdminClient } from '../clients/supabaseAdminClient';
import { AuthenticationError, requireAuthenticatedUser } from '../middleware/userAuth';

function sendAccountError(res: Response, error: unknown) {
  if (error instanceof AuthenticationError) {
    return res.status(401).json({ error: error.message });
  }
  const message = error instanceof Error ? error.message : 'Permintaan akun tidak dapat diproses.';
  return res.status(400).json({ error: message });
}

function getBearerToken(req: Request): string {
  const match = (req.get('authorization') || '').match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) throw new AuthenticationError('Silakan masuk untuk melanjutkan.');
  return match[1];
}

async function selectRows<T>(
  promise: PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return data || [];
}

export function registerAccountRoutes(app: Express) {
  app.get('/api/account/export', async (req, res) => {
    try {
      const user = await requireAuthenticatedUser(req);
      const supabase = getSupabaseAdminClient();
      const email = user.email || '';

      const [profiles, readingActivity, paymentOrders, entitlements, legacyTransactions, legacyReceipts] = await Promise.all([
        selectRows(supabase.from('users').select('id, name, email, phone, login_method, created_at').eq('id', user.id)),
        selectRows(supabase.from('user_reading_activities').select('story_id, story_title, last_page_read, total_pages, is_completed, updated_at').eq('user_id', user.id)),
        selectRows(supabase.from('payment_orders').select('order_id, purchase_type, story_id, story_title, amount, discount_amount, coupon_code, status, payment_method, paid_at, created_at').eq('user_id', user.id)),
        selectRows(supabase.from('user_entitlements').select('entitlement_type, story_id, story_title, source_order_id, payment_method, amount, starts_at, expires_at, token_expires_at, download_count, download_limit, created_at').eq('user_id', user.id)),
        email ? selectRows(supabase.from('transaction_records').select('id, story_id, story_title, payment_method, amount, discount_amount, coupon_code, status, created_at, paid_at').ilike('customer_email', email)) : Promise.resolve([]),
        email ? selectRows(supabase.from('purchase_receipts').select('id, story_id, story_title, transaction_id, payment_method, amount, purchased_at, download_count, token_expires_at').ilike('customer_email', email)) : Promise.resolve([]),
      ]);

      res.json({
        exportedAt: new Date().toISOString(),
        account: {
          id: user.id,
          email: user.email || null,
          phone: user.phone || null,
          provider: user.app_metadata?.provider || null,
          createdAt: user.created_at,
          profile: profiles[0] || null,
        },
        readingActivity,
        commerce: { paymentOrders, entitlements, legacyTransactions, legacyReceipts },
      });
    } catch (error) {
      sendAccountError(res, error);
    }
  });

  app.delete('/api/account', async (req, res) => {
    try {
      const user = await requireAuthenticatedUser(req);
      const confirmation = typeof req.body?.confirmation === 'string' ? req.body.confirmation.trim() : '';
      const submittedEmail = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      const accountEmail = (user.email || '').trim().toLowerCase();

      if (confirmation !== 'HAPUS AKUN' || !accountEmail || submittedEmail !== accountEmail) {
        return res.status(400).json({ error: 'Konfirmasi penghapusan akun tidak sesuai.' });
      }

      const supabase = getSupabaseAdminClient();
      const token = getBearerToken(req);
      const { error: signOutError } = await supabase.auth.admin.signOut(token, 'global');
      if (signOutError) throw new Error('Gagal mencabut sesi akun. Silakan coba lagi.');

      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id, false);
      if (deleteError) throw new Error(deleteError.message);

      res.json({ deleted: true });
    } catch (error) {
      sendAccountError(res, error);
    }
  });
}
