import type { Express } from 'express';
import { GoogleGenAI } from '@google/genai';
import { USD_TO_IDR } from '../config/storybookConfig';
import { getSupabaseAdminClient } from '../clients/supabaseAdminClient';
import { isValidAdminPin } from '../middleware/adminAuth';
import { estimateGeminiCost, recordCostEvent } from '../services/costTracking.service';
import { extractGeminiTextFromImage } from '../services/gemini.service';
import { cleanAiText, cleanOneLine } from '../utils/storybookNormalization';

export function registerManuscriptRoutes(app: Express) {
  app.get('/api/admin/book-cost-events', async (req, res) => {
    if (!isValidAdminPin(req.headers['x-admin-pin'])) {
      return res.status(403).json({ error: 'PIN admin tidak valid.' });
    }

    try {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from('book_cost_events')
        .select('id, story_id, story_title, event_type, provider, model, amount_idr, amount_usd, input_tokens, output_tokens, image_tokens, metadata, created_at')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      res.json({ events: data || [] });
    } catch (error) {
      console.error('Error fetching book cost events:', error);
      res.status(500).json({ error: 'Ledger biaya belum tersedia. Terapkan migrasi Supabase terlebih dahulu.' });
    }
  });

  app.post('/api/admin/extract-pdf-page-text', async (req, res) => {
    if (!isValidAdminPin(req.headers['x-admin-pin'])) {
      return res.status(403).json({ error: 'PIN admin tidak valid.' });
    }

    const imageBase64 = typeof req.body?.imageBase64 === 'string' ? req.body.imageBase64.trim() : '';
    if (!/^[A-Za-z0-9+/=]+$/.test(imageBase64) || imageBase64.length < 100 || imageBase64.length > 700_000) {
      return res.status(400).json({ error: 'Gambar halaman PDF tidak valid atau terlalu besar untuk OCR.' });
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: 'GEMINI_API_KEY is not configured.' });
      }

      const result = await extractGeminiTextFromImage(new GoogleGenAI({ apiKey }), imageBase64);
      const text = cleanAiText(result.text, 3_600);
      const ocrCost = estimateGeminiCost(result.model, result.usage, 'text');
      await recordCostEvent({
        storyId: cleanOneLine(req.body?.storyId, 100),
        storyTitle: cleanOneLine(req.body?.storyTitle, 120),
        eventType: 'pdf_ocr',
        provider: 'Gemini',
        model: result.model,
        amountUsd: ocrCost.amountUsd,
        amountIdr: ocrCost.amountIdr,
        usage: result.usage,
        metadata: { usdToIdr: USD_TO_IDR },
      });
      res.json({ text });
    } catch (error) {
      console.error('Error extracting PDF page text:', error);
      res.status(500).json({ error: 'OCR halaman PDF dengan AI gagal.' });
    }
  });
}

