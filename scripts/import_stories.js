import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://sibwrdbmoasrpcpjgrst.supabase.co';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpYndyZGJtb2FzcnBjcGpncnN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjE0MDQyNSwiZXhwIjoyMTAxNzE2NDI1fQ.9sirWkR1aKiPOVQyxAvHUqVulME7ePFDEcV3BEDVjLM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

async function main() {
  console.log('Connecting to Supabase at:', SUPABASE_URL);

  const raw1 = fs.readFileSync('public/generate-story/bimo-dan-lentera-bintang/story.json', 'utf8');
  const raw2 = fs.readFileSync('public/generate-story/samudra-dan-rahasia-terumbu-karang/story.json', 'utf8');

  const pkg1 = JSON.parse(raw1);
  const pkg2 = JSON.parse(raw2);

  const stories = [
    {
      id: pkg1.story.id,
      title: pkg1.story.title,
      category: pkg1.story.category,
      status: 'published',
      story: pkg1.story,
      sort_order: 12,
      updated_at: new Date().toISOString()
    },
    {
      id: pkg2.story.id,
      title: pkg2.story.title,
      category: pkg2.story.category,
      status: 'published',
      story: pkg2.story,
      sort_order: 13,
      updated_at: new Date().toISOString()
    }
  ];

  for (const storyRow of stories) {
    console.log(`Upserting story: ${storyRow.title} (${storyRow.id})...`);
    const { data, error } = await supabase
      .from('admin_stories')
      .upsert(storyRow, { onConflict: 'id' })
      .select();

    if (error) {
      console.error(`Error inserting ${storyRow.id}:`, error);
      process.exit(1);
    }
    console.log(`Successfully upserted ${storyRow.id}:`, data);
  }

  console.log('All stories integrated into Supabase successfully!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
