import { supabase } from './supabaseClient';

export async function getAuthenticatedHeaders(): Promise<Record<string, string>> {
  const { data, error } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (error || !accessToken) throw new Error('Silakan masuk untuk melanjutkan.');
  return { Authorization: `Bearer ${accessToken}` };
}
