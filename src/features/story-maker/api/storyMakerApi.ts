import type { Story } from '@/types';
import type { StoryMakerFormState } from '@/features/story-maker/types';

function isGeneratedStory(value: unknown): value is Story {
  if (!value || typeof value !== 'object') return false;
  const story = value as Partial<Story>;
  return typeof story.id === 'string'
    && typeof story.title === 'string'
    && Array.isArray(story.pages);
}

export async function generateStory(
  form: StoryMakerFormState,
  signal?: AbortSignal,
): Promise<Story> {
  const response = await fetch('/api/generate-story', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
    signal,
  });
  if (!response.ok) throw new Error('Gagal menghubungi server Gemini AI');

  const data = await response.json() as { story?: unknown };
  if (!isGeneratedStory(data.story)) throw new Error('Format cerita dari AI tidak valid');
  return data.story;
}
