import type { Express, Response } from 'express';
import { getSupabaseAdminClient } from '../clients/supabaseAdminClient';
import { AuthenticationError, requireAuthenticatedUser } from '../middleware/userAuth';

const MAX_TITLE_LENGTH = 240;

function readNonNegativeInteger(value: unknown, fieldName: string): number {
  const numberValue = Number(value);
  if (!Number.isSafeInteger(numberValue) || numberValue < 0) {
    throw new Error(`${fieldName} tidak valid.`);
  }
  return numberValue;
}

function readTrimmedString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${fieldName} wajib diisi.`);
  return value.trim().slice(0, MAX_TITLE_LENGTH);
}

function sendReadingActivityError(res: Response, error: unknown) {
  if (error instanceof AuthenticationError) return res.status(401).json({ error: error.message });
  const message = error instanceof Error ? error.message : 'Aktivitas membaca tidak dapat disimpan.';
  return res.status(400).json({ error: message });
}

export function registerReadingActivityRoutes(app: Express) {
  app.post('/api/reading-activities', async (req, res) => {
    try {
      const user = await requireAuthenticatedUser(req);
      const storyId = readTrimmedString(req.body?.storyId, 'ID cerita');
      const storyTitle = readTrimmedString(req.body?.storyTitle, 'Judul cerita');
      const totalPages = readNonNegativeInteger(req.body?.totalPages, 'Jumlah halaman');
      const lastPageRead = readNonNegativeInteger(req.body?.lastPageRead, 'Halaman terakhir');
      const isCompleted = Boolean(req.body?.isCompleted) || (totalPages > 0 && lastPageRead >= totalPages);
      if (totalPages === 0 || lastPageRead > totalPages) throw new Error('Progres halaman tidak valid.');

      const supabase = getSupabaseAdminClient();
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', user.id)
        .maybeSingle();
      if (profileError) throw new Error(profileError.message);

      const userName = profile?.name || user.email?.split('@')[0] || 'Orang Tua';
      const userEmail = profile?.email || user.email || '';
      const now = new Date().toISOString();
      const { error: progressError } = await supabase.from('user_reading_activities').upsert({
        user_id: user.id,
        user_name: userName,
        user_email: userEmail,
        story_id: storyId,
        story_title: storyTitle,
        last_page_read: lastPageRead,
        total_pages: totalPages,
        is_completed: isCompleted,
        updated_at: now,
      }, { onConflict: 'user_id,story_id' });
      if (progressError) throw new Error(progressError.message);

      const { error: eventError } = await supabase.from('user_reading_activity_events').insert({
        user_id: user.id,
        story_id: storyId,
        last_page_read: lastPageRead,
        total_pages: totalPages,
        is_completed: isCompleted,
        event_type: isCompleted ? 'completed' : 'progress',
        occurred_at: now,
      });
      if (eventError) throw new Error(eventError.message);

      res.status(201).json({ saved: true });
    } catch (error) {
      sendReadingActivityError(res, error);
    }
  });
}
