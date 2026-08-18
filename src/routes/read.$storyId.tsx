import { createFileRoute } from '@tanstack/react-router';
import type { Story } from '@/types';

import { buildStorySeoMeta } from '@/utils/seo';

const SITE_URL = (import.meta.env.VITE_APP_URL || 'https://www.bacayuk.web.id').replace(/\/$/, '');

export const Route = createFileRoute('/read/$storyId')({
  loader: async ({ params }) => {
    const res = await fetch(`/api/stories/${encodeURIComponent(params.storyId)}`);

    if (!res.ok) return null;

    const data: { story: Story } = await res.json();
    return data.story ?? null;
  },

  head: ({ loaderData: story }) => {
    if (!story) return {};

    const coverUrl = getStorySeoImage(story);
    const seoMeta = buildStorySeoMeta(story, SITE_URL, coverUrl);

    return {
      title: seoMeta.title,

      meta: [
        {
          name: 'description',
          content: seoMeta.description,
        },
        {
          property: 'og:site_name',
          content: seoMeta.siteName,
        },
        {
          property: 'og:title',
          content: seoMeta.title,
        },
        {
          property: 'og:description',
          content: seoMeta.description,
        },
        {
          property: 'og:image',
          content: seoMeta.image,
        },
        {
          property: 'og:url',
          content: seoMeta.url,
        },
        {
          property: 'og:type',
          content: 'book',
        },
        {
          name: 'twitter:card',
          content: 'summary_large_image',
        },
        {
          name: 'twitter:title',
          content: seoMeta.title,
        },
        {
          name: 'twitter:description',
          content: seoMeta.description,
        },
        {
          name: 'twitter:image',
          content: seoMeta.image,
        },
      ],

      links: [
        {
          rel: 'canonical',
          href: seoMeta.url,
        },
      ],
    };
  },

  component: RoutePlaceholder,
});

/**
 * The reader UI is rendered by ReaderApplication at the App level.
 * This route exists for URL matching, loader data, and head management.
 */
function RoutePlaceholder() {
  return null;
}

/**
 * Client-side mirror of the server's seoImage resolver.
 * Returns the cover URL if absolute, otherwise the generic OG image.
 */
function getStorySeoImage(story: Story): string {
  if (/^https?:\/\//i.test(story.coverImage)) {
    return story.coverImage;
  }
  return `${SITE_URL}/bacayuk-og.png`;
}
