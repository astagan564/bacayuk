import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SECRET_KEY must be configured in environment or .env file.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

async function main() {
  console.log('Connecting to Supabase at:', SUPABASE_URL);

  const storiesDir = path.join(process.cwd(), 'public', 'generate-story');
  if (!fs.existsSync(storiesDir)) {
    console.warn(`Directory not found: ${storiesDir}`);
    return;
  }

  const dirs = fs.readdirSync(storiesDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  // Fetch current maximum sort_order
  const { data: currentStories } = await supabase
    .from('admin_stories')
    .select('id, sort_order')
    .order('sort_order', { ascending: false });

  let nextSortOrder = (currentStories && currentStories.length > 0 && currentStories[0].sort_order !== null)
    ? currentStories[0].sort_order + 1
    : 0;

  const existingMap = new Map((currentStories || []).map((s) => [s.id, s.sort_order]));

  for (const dirName of dirs) {
    const filePath = path.join(storiesDir, dirName, 'story.json');
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    const pkg = JSON.parse(raw);
    const story = pkg.story;

    const assignedSortOrder = existingMap.has(story.id)
      ? existingMap.get(story.id)
      : nextSortOrder++;

    const row = {
      id: story.id,
      title: story.title,
      category: story.category,
      status: story.status || 'published',
      story: story,
      sort_order: assignedSortOrder,
      updated_at: new Date().toISOString()
    };

    console.log(`Upserting story: ${row.title} (${row.id}) [sort_order: ${row.sort_order}]...`);
    const { error } = await supabase
      .from('admin_stories')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.error(`Error inserting ${row.id}:`, error);
      process.exit(1);
    }
    console.log(`✓ Successfully synced ${row.id}`);
  }

  console.log('All stories synced to Supabase successfully!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
