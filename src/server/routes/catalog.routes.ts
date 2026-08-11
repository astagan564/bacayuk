import type { Express } from 'express';
import { INITIAL_STORIES, mergeBundledCatalogStories } from '../../data/stories';
import type { Story } from '../../types';
import { getSupabaseAdminClient } from '../clients/supabaseAdminClient';
import { isValidAdminPin } from '../middleware/adminAuth';
import { normalizeStory } from '../utils/storybookNormalization';

export function registerCatalogRoutes(app: Express) {
  app.get('/api/stories', async (_req, res) => {
    try {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from('admin_stories')
        .select('id, story, status, sort_order, updated_at')
        .order('sort_order', { ascending: true })
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      const remoteStories = (data || []).map((row) =>
        normalizeStory({ ...row.story, id: row.id, status: row.status }),
      );
      const stories = mergeBundledCatalogStories(remoteStories)
        .filter((story) => story.status === 'published')
        .map(normalizeStory);

      res.json({ stories });
    } catch (error) {
      console.warn('Falling back to bundled stories:', error);
      res.json({ stories: INITIAL_STORIES.map(normalizeStory), fallback: true });
    }
  });

  app.get('/api/admin/stories', async (req, res) => {
    if (!isValidAdminPin(req.headers['x-admin-pin'])) {
      return res.status(403).json({ error: 'PIN admin tidak valid.' });
    }

    try {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from('admin_stories')
        .select('id, story, status, sort_order, updated_at')
        .order('sort_order', { ascending: true })
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      const remoteStories = (data || []).map((row) =>
        normalizeStory({ ...row.story, id: row.id, status: row.status }),
      );
      const stories = mergeBundledCatalogStories(remoteStories).map(normalizeStory);

      res.json({ stories });
    } catch (error) {
      console.error('Failed to load admin stories:', error);
      res.status(500).json({ error: 'Gagal memuat buku dari Supabase.' });
    }
  });

  app.post('/api/admin/stories', async (req, res) => {
    if (!isValidAdminPin(req.headers['x-admin-pin'])) {
      return res.status(403).json({ error: 'PIN admin tidak valid.' });
    }

    const stories: Story[] = Array.isArray(req.body?.stories)
      ? (req.body.stories as Story[]).map((story) => normalizeStory(story))
      : [];
    if (!Array.isArray(req.body?.stories)) {
      return res.status(400).json({ error: 'Daftar buku tidak valid.' });
    }

    const storyIds = stories.map((story) => story.id?.trim());
    if (storyIds.some((id) => !id) || new Set(storyIds).size !== storyIds.length) {
      return res.status(400).json({ error: 'Setiap buku harus memiliki ID unik.' });
    }

    try {
      const supabase = getSupabaseAdminClient();
      const payload = stories.map((story, index) => ({
        id: story.id,
        title: story.title,
        category: story.category,
        status: story.status || 'published',
        story,
        sort_order: index,
        updated_at: new Date().toISOString(),
      }));

      const { data: existingRows, error: existingError } = await supabase
        .from('admin_stories')
        .select('id');
      if (existingError) throw existingError;

      if (payload.length > 0) {
        const { error: upsertError } = await supabase.from('admin_stories').upsert(payload, { onConflict: 'id' });
        if (upsertError) throw upsertError;
      }

      const deletedIds = (existingRows || [])
        .map((row) => row.id)
        .filter((id) => !storyIds.includes(id));
      if (deletedIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('admin_stories')
          .delete()
          .in('id', deletedIds);
        if (deleteError) throw deleteError;
      }

      res.json({ stories });
    } catch (error) {
      console.error('Failed to save admin stories:', error);
      res.status(500).json({ error: 'Gagal menyimpan buku ke Supabase.' });
    }
  });
}

