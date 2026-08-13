import type { Request } from 'express';
import type { User } from '@supabase/supabase-js';
import { getSupabaseAdminClient } from '../clients/supabaseAdminClient';

export class AuthenticationError extends Error {}

export async function requireAuthenticatedUser(req: Request): Promise<User> {
  const authorization = req.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) throw new AuthenticationError('Silakan masuk untuk melanjutkan.');

  const { data, error } = await getSupabaseAdminClient().auth.getUser(match[1]);
  if (error || !data.user) throw new AuthenticationError('Sesi login tidak valid atau sudah berakhir.');
  return data.user;
}
