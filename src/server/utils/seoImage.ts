import type { Story } from '../../types';
import { SITE_URL } from '../config/siteConfig';

/**
 * Resolve a story's cover image to an absolute URL suitable for OG/Twitter meta.
 *
 * - If `coverImage` is already an absolute URL (Supabase storage, CDN, etc.), use it.
 * - Otherwise fall back to the generic BacaYuk OG image.
 */
export function getStorySeoImage(story: Story): string {
  if (isAbsoluteUrl(story.coverImage)) {
    return story.coverImage;
  }

  return `${SITE_URL}/bacayuk-og.png`;
}

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}
