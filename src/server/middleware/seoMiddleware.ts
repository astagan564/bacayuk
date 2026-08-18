import type { Express } from 'express';
import fs from 'fs';
import path from 'path';
import type { Story } from '../../types';
import { SITE_URL } from '../config/siteConfig';
import { getPublishedStoryById } from '../services/storyService';
import { getStorySeoImage } from '../utils/seoImage';

const DEFAULT_SEO_REGEX = /<!-- DEFAULT_SEO_START -->[\s\S]*?<!-- DEFAULT_SEO_END -->/;
const JSONLD_MARKER = '<!-- SEO_DYNAMIC_JSONLD -->';

import { buildStorySeoMeta } from '../../utils/seo';

/**
 * Server-side metadata injection for `/read/:storyId`.
 *
 * On production, intercepts requests matching the read route pattern,
 * fetches the story from Supabase (or bundled fallback), and replaces
 * the default SEO block with dynamic `<title>`, meta, canonical, OG/Twitter.
 * Also injects Book JSON-LD at predefined comment markers.
 *
 * If the story is not found or any error occurs, the unmodified HTML
 * is sent with a 404 status code so the SPA can handle the missing state.
 */
export function registerSeoMiddleware(app: Express, distPath: string) {
  const htmlPath = path.join(distPath, 'index.html');

  let cachedTemplate: string | null = null;
  function getTemplate(): string {
    if (!cachedTemplate) {
      cachedTemplate = fs.readFileSync(htmlPath, 'utf-8');
    }
    return cachedTemplate;
  }

  app.get('/read/:storyId', async (req, res, next) => {
    const template = getTemplate();

    if (!DEFAULT_SEO_REGEX.test(template)) {
      return next();
    }

    let story: Story | null = null;
    try {
      story = await getPublishedStoryById(req.params.storyId);
    } catch (err) {
      console.warn('SEO middleware: failed to fetch story, serving generic HTML with 404:', err);
    }

    if (!story) {
      res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(template);
    }

    const coverUrl = getStorySeoImage(story);
    const seoMeta = buildStorySeoMeta(story, SITE_URL, coverUrl);

    const headTags = [
      `<title>${escapeHtml(seoMeta.title)}</title>`,
      `<meta name="description" content="${escapeAttr(seoMeta.description)}" />`,
      `<link rel="canonical" href="${escapeAttr(seoMeta.url)}" />`,
      `<meta property="og:site_name" content="${escapeAttr(seoMeta.siteName)}" />`,
      `<meta property="og:title" content="${escapeAttr(seoMeta.title)}" />`,
      `<meta property="og:description" content="${escapeAttr(seoMeta.description)}" />`,
      `<meta property="og:url" content="${escapeAttr(seoMeta.url)}" />`,
      `<meta property="og:image" content="${escapeAttr(seoMeta.image)}" />`,
      `<meta property="og:type" content="book" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${escapeAttr(seoMeta.title)}" />`,
      `<meta name="twitter:description" content="${escapeAttr(seoMeta.description)}" />`,
      `<meta name="twitter:image" content="${escapeAttr(seoMeta.image)}" />`,
    ].join('\n    ');

    const bookJsonLd = buildBookJsonLd(story, seoMeta.url, seoMeta.image);

    const html = template
      .replace(DEFAULT_SEO_REGEX, headTags)
      .replace(JSONLD_MARKER, bookJsonLd);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  });
}

function buildBookJsonLd(story: Story, storyUrl: string, coverUrl: string): string {
  const book: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    '@id': `${storyUrl}#book`,
    name: story.title,
    url: storyUrl,
    description: story.description,
    image: coverUrl,
    inLanguage: 'id',
    genre: story.category,
    publisher: {
      '@id': `${SITE_URL}/#organization`,
    },
    isPartOf: {
      '@id': `${SITE_URL}/#website`,
    },
  };

  if (story.author) {
    book.author = { '@type': 'Person', name: story.author };
  }

  // Only include typicalAgeRange if the value looks like a numeric range.
  if (story.targetAge && /\d/.test(story.targetAge)) {
    book.typicalAgeRange = story.targetAge;
  }

  return `<script type="application/ld+json">\n    ${JSON.stringify(book, null, 2).replace(/\n/g, '\n    ')}\n    </script>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
