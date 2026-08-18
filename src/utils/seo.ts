import type { Story } from '../types';

export interface SeoMetaTags {
  title: string;
  description: string;
  url: string;
  image: string;
  imageAlt: string;
  imageType: string;
  siteName: string;
}

export function buildStorySeoMeta(story: Story, siteUrl: string, coverUrl: string): SeoMetaTags {
  // Infer image type from extension, default to png
  const isWebp = coverUrl.split('?')[0].endsWith('.webp');
  const isJpg = coverUrl.split('?')[0].match(/\.(jpg|jpeg)$/i);
  const imageType = isWebp ? 'image/webp' : (isJpg ? 'image/jpeg' : 'image/png');

  return {
    title: `${story.title} | BacaYuk`,
    description: story.description,
    url: `${siteUrl}/read/${encodeURIComponent(story.id)}`,
    image: coverUrl,
    imageAlt: `Sampul buku ${story.title}`,
    imageType: imageType,
    siteName: 'BacaYuk',
  };
}
