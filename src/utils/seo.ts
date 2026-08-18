import type { Story } from '../types';

export interface SeoMetaTags {
  title: string;
  description: string;
  url: string;
  image: string;
  siteName: string;
}

export function buildStorySeoMeta(story: Story, siteUrl: string, coverUrl: string): SeoMetaTags {
  return {
    title: `${story.title} | BacaYuk`,
    description: story.description,
    url: `${siteUrl}/read/${encodeURIComponent(story.id)}`,
    image: coverUrl,
    siteName: 'BacaYuk',
  };
}
