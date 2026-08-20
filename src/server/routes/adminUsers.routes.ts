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

interface ActivityMetrics {
  total: number;
  activeReaders7d: number;
  completed: number;
}

const USER_PAGE_SIZE = 1000;
const ACTIVITY_PAGE_SIZE = 30;

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

function readActivityPage(value: unknown): number {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function readActivityPeriod(value: unknown): Date | null {
  const now = new Date();
  if (value === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (value === '7d') return new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
  if (value === '30d') return new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  return null;
}

export function registerAdminUsersRoutes(app: Express) {
  app.get('/api/admin/users', async (req, res) => {
    if (!isValidAdminPin(req.headers['x-admin-pin'])) {
      return res.status(403).json({ error: 'PIN admin tidak valid.' });
    }

    try {
      const supabase = getSupabaseAdminClient();
      const activityPage = readActivityPage(req.query.activityPage);
      const activitySearch = typeof req.query.activitySearch === 'string' ? req.query.activitySearch.trim().slice(0, 100) : '';
      const activityStatus = req.query.activityStatus === 'completed' || req.query.activityStatus === 'reading'
        ? req.query.activityStatus
        : 'all';
      const activitySince = readActivityPeriod(req.query.activityPeriod);
      let activityQuery = supabase
        .from('user_reading_activities')
        .select('user_id, user_name, user_email, story_id, story_title, last_page_read, total_pages, is_completed, updated_at', { count: 'exact' })
        .order('updated_at', { ascending: false });
      if (activityStatus === 'completed') activityQuery = activityQuery.eq('is_completed', true);
      if (activityStatus === 'reading') activityQuery = activityQuery.eq('is_completed', false);
      if (activitySince) activityQuery = activityQuery.gte('updated_at', activitySince.toISOString());
      if (activitySearch) {
        const escapedSearch = activitySearch.replace(/[%_,()]/g, ' ');
        activityQuery = activityQuery.or(`user_name.ilike.%${escapedSearch}%,user_email.ilike.%${escapedSearch}%,story_title.ilike.%${escapedSearch}%`);
      }
      const weekAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString();
      const [users, activityResult, activeReadersResult, completedResult] = await Promise.all([
        listAllUserProfiles(supabase),
        activityQuery.range((activityPage - 1) * ACTIVITY_PAGE_SIZE, (activityPage * ACTIVITY_PAGE_SIZE) - 1),
        supabase
          .from('user_reading_activities')
          .select('user_id', { count: 'exact', head: true })
          .gte('updated_at', weekAgo),
        supabase
          .from('user_reading_activities')
          .select('user_id', { count: 'exact', head: true })
          .eq('is_completed', true),
      ]);

      if (activityResult.error) throw new Error(activityResult.error.message);
      if (activeReadersResult.error) throw new Error(activeReadersResult.error.message);
      if (completedResult.error) throw new Error(completedResult.error.message);
      const metrics: ActivityMetrics = {
        total: activityResult.count || 0,
        activeReaders7d: activeReadersResult.count || 0,
        completed: completedResult.count || 0,
      };

      res.json({
        users: users.map((user) => ({
          id: user.id,
          name: user.name || 'Orang Tua',
          email: user.email || '',
          phone: user.phone || undefined,
          loginMethod: normalizeLoginMethod(user.login_method),
          createdAt: user.created_at,
        })),
        readingLogs: ((activityResult.data || []) as ReadingActivityRow[]).map((log) => ({
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
        readingActivity: {
          metrics,
          page: activityPage,
          pageSize: ACTIVITY_PAGE_SIZE,
          total: activityResult.count || 0,
        },
      });
    } catch (error) {
      sendAdminUsersError(res, error);
    }
  });
}
