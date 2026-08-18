import { INITIAL_STORIES, mergeBundledCatalogStories } from '../../data/stories';
import type { Story } from '../../types';
import { getSupabaseAdminClient } from '../clients/supabaseAdminClient';
import { normalizeStory } from '../utils/storybookNormalization';

/**
 * Fetch a single published story by ID.
 *
 * 1. Query Supabase `admin_stories` for the row.
 * 2. If the row exists but is not `published`, return `null`.
 * 3. If the row does not exist (PGRST116), fall back to bundled stories.
 * 4. Any other Supabase error is re-thrown so callers can handle it
 *    (e.g. log + graceful fallback) rather than silently hiding outages.
 */
export async function getPublishedStoryById(id: string): Promise<Story | null> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('admin_stories')
      .select('id, story, status')
      .eq('id', id)
      .single();

    // Row not found — fall through to bundled lookup
    if (error?.code === 'PGRST116') {
      return findBundledStory(id);
    }

    // Any other Supabase error — propagate so callers can decide
    if (error) {
      throw error;
    }

    const story = normalizeStory({ ...data.story, id: data.id, status: data.status });
    return story.status === 'published' ? story : null;
  } catch (err) {
    // Re-throw non-PGRST errors (network, permission, config)
    // so they surface in logs instead of being swallowed.
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'PGRST116') {
      return findBundledStory(id);
    }
    throw err;
  }
}

function findBundledStory(id: string): Story | null {
  const all = mergeBundledCatalogStories(INITIAL_STORIES);
  return all.find((s) => s.id === id && s.status === 'published') ?? null;
}
