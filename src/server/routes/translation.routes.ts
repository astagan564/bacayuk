import type { Express } from 'express';
import { GoogleGenAI } from '@google/genai';
import { isValidAdminPin } from '../middleware/adminAuth';
import { generateGeminiJson } from '../services/gemini.service';
import { cleanOneLine } from '../utils/storybookNormalization';

export function registerTranslationRoutes(app: Express) {
  app.post('/api/admin/translate-story', async (req, res) => {
    if (!isValidAdminPin(req.headers['x-admin-pin'])) {
      return res.status(403).json({ error: 'PIN admin tidak valid.' });
    }

    try {
      const title = typeof req.body?.title === 'string' ? req.body.title.trim().slice(0, 120) : 'BacaYuk Story';
      const rawPages: unknown[] = Array.isArray(req.body?.pages) ? req.body.pages : [];
      const pages = rawPages
        .map((page, index) => {
          const item = page as Record<string, unknown>;
          return {
            pageNumber: Number(item.pageNumber) || index + 1,
            title: typeof item.title === 'string' ? item.title.trim().slice(0, 120) : '',
            text: typeof item.text === 'string' ? item.text.trim().slice(0, 1800) : '',
          };
        })
        .filter((page) => page.text);

      if (pages.length === 0) {
        return res.status(400).json({ error: 'Tidak ada teks halaman untuk diterjemahkan.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: 'GEMINI_API_KEY is not configured.' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Translate this Indonesian children's storybook into natural, simple English for children.
Translate the book title, every page title, and every page text. Keep the same number of pages.
Keep the meaning warm and child-safe. Do not add markdown.

Return only valid JSON with this shape:
{
  "titleEn": "English book title",
  "translations": [
    { "pageNumber": 1, "titleEn": "English page title", "textEn": "English translation..." }
  ]
}

Book title: ${title}
Pages:
${pages.map((page) => `Page ${page.pageNumber}${page.title ? ` - ${page.title}` : ''}:\n${page.text}`).join('\n\n')}`;

      const response = await generateGeminiJson(ai, prompt);
      const parsedJson = JSON.parse(response.text || '{}');
      const titleEn = cleanOneLine(parsedJson.titleEn, 120);
      const translations = Array.isArray(parsedJson.translations)
        ? parsedJson.translations
            .map((item: unknown) => {
              const row = item as Record<string, unknown>;
              return {
                pageNumber: Number(row.pageNumber),
                titleEn: cleanOneLine(row.titleEn, 120),
                textEn: typeof row.textEn === 'string' ? row.textEn.trim() : '',
              };
            })
            .filter((item: { pageNumber: number; titleEn: string; textEn: string }) => item.pageNumber && item.textEn)
        : [];

      if (translations.length === 0) {
        return res.status(502).json({ error: 'AI tidak mengembalikan hasil terjemahan yang valid.' });
      }

      res.json({ titleEn, translations, model: response.model });
    } catch (error) {
      console.error('Error translating story:', error);
      res.status(500).json({ error: 'Gagal membuat terjemahan cerita.' });
    }
  });
}

