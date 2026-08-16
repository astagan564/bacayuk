import type { Express, Response } from 'express';
import { getSupabaseAdminClient } from '../clients/supabaseAdminClient';
import { isValidAdminPin } from '../middleware/adminAuth';

interface UserProfileRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  login_method: string | null;
  created_at: string;
}

interface ReadingActivityRow {
  user_id: string;
  user_name: string;
  user_email: string;
  story_id: string;
  story_title: string;
  last_page_read: number;
  total_pages: number;
  is_completed: boolean;
  updated_at: string;
}

const USER_PAGE_SIZE = 1000;

function normalizeLoginMethod(value: string | null): 'google' | 'facebook' | 'whatsapp' | 'email' {
  if (value === 'google' || value === 'facebook') return value;
  if (value === 'whatsapp' || value === 'phone') return 'whatsapp';
  return 'email';
}

async function listAllUserProfiles(supabase: ReturnType<typeof getSupabaseAdminClient>) {
  const users: UserProfileRow[] = [];

  for (let from = 0; ; from += USER_PAGE_SIZE) {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone, login_method, created_at')
      .order('created_at', { ascending: false })
      .range(from, from + USER_PAGE_SIZE - 1);

    if (error) throw new Error(error.message);
    const page = (data || []) as UserProfileRow[];
    users.push(...page);
    if (page.length < USER_PAGE_SIZE) return users;
  }
}

function sendAdminUsersError(res: Response, error: unknown) {
  console.error('Error listing registered users:', error);
  const message = error instanceof Error ? error.message : 'Data pengguna belum dapat dimuat.';
  return res.status(500).json({ error: message });
}

export function registerAdminUsersRoutes(app: Express) {
  app.get('/api/admin/users', async (req, res) => {
    if (!isValidAdminPin(req.headers['x-admin-pin'])) {
      return res.status(403).json({ error: 'PIN admin tidak valid.' });
    }

    try {
      const supabase = getSupabaseAdminClient();
      const [users, { data: readingLogs, error: readingLogsError }] = await Promise.all([
        listAllUserProfiles(supabase),
        supabase
          .from('user_reading_activities')
          .select('user_id, user_name, user_email, story_id, story_title, last_page_read, total_pages, is_completed, updated_at')
          .order('updated_at', { ascending: false })
          .limit(200),
      ]);

      if (readingLogsError) throw new Error(readingLogsError.message);

      res.json({
        users: users.map((user) => ({
          id: user.id,
          name: user.name || 'Orang Tua',
          email: user.email || '',
          phone: user.phone || undefined,
          loginMethod: normalizeLoginMethod(user.login_method),
          createdAt: user.created_at,
        })),
        readingLogs: ((readingLogs || []) as ReadingActivityRow[]).map((log) => ({
          userId: log.user_id,
          userName: log.user_name,
          userEmail: log.user_email,
          storyId: log.story_id,
          storyTitle: log.story_title,
          lastPageRead: log.last_page_read,
          totalPages: log.total_pages,
          isCompleted: log.is_completed,
          updatedAt: log.updated_at,
        })),
      });
    } catch (error) {
      sendAdminUsersError(res, error);
    }
  });
}
