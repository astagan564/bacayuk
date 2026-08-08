import 'dotenv/config';
import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import midtransClient from 'midtrans-client';
import { INITIAL_STORIES } from './src/data/stories';
import { createClient } from '@supabase/supabase-js';
import type { Story } from './src/types';

const DEFAULT_EBOOK_PRICE = 15000;
const VIP_SUBSCRIPTION_PRICE = 100000;

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase admin credentials are not configured.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function isValidAdminPin(pin: unknown) {
  const configuredPin = process.env.ADMIN_PIN || process.env.VITE_ADMIN_PIN;
  return Boolean(configuredPin && typeof pin === 'string' && pin === configuredPin);
}

const GEMINI_TEXT_MODELS = Array.from(
  new Set(
    [
      process.env.GEMINI_MODEL,
      process.env.GEMINI_TEXT_MODEL,
      'gemini-3.6-flash',
      'gemini-3.5-flash-lite',
      'gemini-2.5-flash',
    ].filter((model): model is string => Boolean(model?.trim()))
  )
);

function isGeminiModelUnavailable(error: unknown) {
  const detail = error as { status?: number; message?: string };
  const message = typeof detail?.message === 'string' ? detail.message.toLowerCase() : '';

  return (
    detail?.status === 404 ||
    message.includes('not_found') ||
    message.includes('no longer available') ||
    message.includes('model') && message.includes('not found')
  );
}

async function generateGeminiJson(ai: GoogleGenAI, contents: string) {
  let lastError: unknown;

  for (const model of GEMINI_TEXT_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          responseMimeType: 'application/json',
        },
      });

      return {
        model,
        text: response.text || '',
      };
    } catch (error) {
      lastError = error;
      if (!isGeminiModelUnavailable(error)) {
        throw error;
      }

      console.warn(`Gemini model ${model} unavailable, trying fallback model...`);
    }
  }

  throw lastError || new Error('No Gemini text models are configured.');
}

function normalizeStory(story: Story): Story {
  return {
    ...story,
    status: story.status || 'published',
    pages: story.pages.map((page, index) => ({
      ...page,
      pageNumber: index + 1,
    })),
  };
}

const SERVER_COUPONS = [
  { code: 'BUKUANAK20', type: 'percent', value: 20, maxUsage: 100 },
  { code: 'MERDEKA5K', type: 'fixed', value: 5000, maxUsage: 50 },
  { code: 'PARENTSPROMO', type: 'percent', value: 30, maxUsage: 200 },
] as const;

function getSnapClient() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.VITE_MIDTRANS_CLIENT_KEY;

  if (!serverKey || !clientKey) {
    throw new Error('Midtrans keys are not configured.');
  }

  return new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey,
    clientKey,
  });
}

function getCoreClient() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.VITE_MIDTRANS_CLIENT_KEY;

  if (!serverKey || !clientKey) {
    throw new Error('Midtrans keys are not configured.');
  }

  return new midtransClient.CoreApi({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey,
    clientKey,
  });
}

function calculateDiscount(couponCode: unknown, originalAmount: number) {
  if (typeof couponCode !== 'string' || !couponCode.trim()) {
    return { discountAmount: 0, couponCode: null as string | null };
  }

  const cleanCode = couponCode.trim().toUpperCase();
  const coupon = SERVER_COUPONS.find((item) => item.code === cleanCode);
  if (!coupon) {
    return { discountAmount: 0, couponCode: null as string | null };
  }

  const rawDiscount =
    coupon.type === 'percent' ? Math.round((originalAmount * coupon.value) / 100) : coupon.value;

  return {
    discountAmount: Math.min(originalAmount, Math.max(0, rawDiscount)),
    couponCode: coupon.code,
  };
}

async function findStoryForCheckout(storyId: string): Promise<Story | undefined> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('admin_stories')
      .select('story, status')
      .eq('id', storyId)
      .eq('status', 'published')
      .maybeSingle();

    if (!error && data?.story) {
      return normalizeStory(data.story as Story);
    }
  } catch (error) {
    console.warn('Failed to load checkout story from Supabase:', error);
  }

  return INITIAL_STORIES.find((item) => item.id === storyId);
}

async function resolveTransactionRequest(body: Record<string, unknown>) {
  const purchaseType = body.purchaseType === 'vip' ? 'vip' : 'book';
  const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : '';
  const customerEmail =
    typeof body.customerEmail === 'string' ? body.customerEmail.trim().toLowerCase() : '';

  if (!customerName || !customerEmail || !customerEmail.includes('@') || !customerEmail.includes('.')) {
    throw new Error('Customer name and valid email are required.');
  }

  if (purchaseType === 'vip') {
    const { discountAmount, couponCode } = calculateDiscount(body.couponCode, VIP_SUBSCRIPTION_PRICE);
    return {
      purchaseType,
      storyId: 'vip_sub',
      storyTitle: 'Langganan VIP 1 Bulan',
      amount: Math.max(1000, VIP_SUBSCRIPTION_PRICE - discountAmount),
      discountAmount,
      couponCode,
      customerName,
      customerEmail,
    };
  }

  if (typeof body.storyId !== 'string' || !body.storyId.trim()) {
    throw new Error('storyId is required.');
  }

  const story = await findStoryForCheckout(body.storyId);
  if (story?.downloadEnabled === false) {
    throw new Error('Offline download is disabled for this story.');
  }

  const originalAmount = story?.ebookPrice || DEFAULT_EBOOK_PRICE;
  const { discountAmount, couponCode } = calculateDiscount(body.couponCode, originalAmount);
  const fallbackTitle = typeof body.storyTitle === 'string' && body.storyTitle.trim()
    ? body.storyTitle.trim().slice(0, 80)
    : 'Buku Cerita BacaYuk';

  return {
    purchaseType,
    storyId: body.storyId,
    storyTitle: story?.title || fallbackTitle,
    amount: Math.max(1000, originalAmount - discountAmount),
    discountAmount,
    couponCode,
    customerName,
    customerEmail,
  };
}

export async function createApp(options: { serveClient?: boolean } = {}) {
  const app = express();
  const serveClient = options.serveClient ?? true;
  const isProductionServer = process.env.NODE_ENV === 'production' || process.argv[1]?.endsWith('server.cjs');

  app.use(express.json({ limit: '1mb' }));

  app.get('/api/stories', async (_req, res) => {
    try {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from('admin_stories')
        .select('id, story, status, sort_order, updated_at')
        .eq('status', 'published')
        .order('sort_order', { ascending: true })
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      const stories = data && data.length > 0
        ? data.map((row) => normalizeStory({ ...row.story, id: row.id, status: row.status }))
        : INITIAL_STORIES.map(normalizeStory);

      res.json({ stories });
    } catch (error) {
      console.warn('Falling back to bundled stories:', error);
      res.json({ stories: INITIAL_STORIES.map(normalizeStory), fallback: true });
    }
  });

  app.get('/api/admin/stories', async (req, res) => {
    if (!isValidAdminPin(req.headers['x-admin-pin'])) {
      return res.status(403).json({ error: 'PIN admin tidak valid.' });
    }

    try {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from('admin_stories')
        .select('id, story, status, sort_order, updated_at')
        .order('sort_order', { ascending: true })
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      const stories = data && data.length > 0
        ? data.map((row) => normalizeStory({ ...row.story, id: row.id, status: row.status }))
        : INITIAL_STORIES.map(normalizeStory);

      res.json({ stories });
    } catch (error) {
      console.error('Failed to load admin stories:', error);
      res.status(500).json({ error: 'Gagal memuat buku dari Supabase.' });
    }
  });

  app.post('/api/admin/stories', async (req, res) => {
    if (!isValidAdminPin(req.headers['x-admin-pin'])) {
      return res.status(403).json({ error: 'PIN admin tidak valid.' });
    }

    const stories: Story[] = Array.isArray(req.body?.stories)
      ? (req.body.stories as Story[]).map((story) => normalizeStory(story))
      : [];
    if (stories.length === 0) {
      return res.status(400).json({ error: 'Daftar buku tidak boleh kosong.' });
    }

    try {
      const supabase = getSupabaseAdminClient();
      const payload = stories.map((story, index) => ({
        id: story.id,
        title: story.title,
        category: story.category,
        status: story.status || 'published',
        story,
        sort_order: index,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from('admin_stories').upsert(payload, { onConflict: 'id' });
      if (error) {
        throw error;
      }

      res.json({ stories });
    } catch (error) {
      console.error('Failed to save admin stories:', error);
      res.status(500).json({ error: 'Gagal menyimpan buku ke Supabase.' });
    }
  });

  // Gemini AI endpoint for custom children's story generation
  app.post('/api/generate-story', async (req, res) => {
    try {
      const { characterName, characterType, setting, moralValue, pageCount = 6 } = req.body;
      const safePageCount = Math.min(10, Math.max(1, Number(pageCount) || 6));

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: 'GEMINI_API_KEY is not configured.' });
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Anda adalah penulis buku cerita anak profesional dalam bahasa Indonesia.
Tolong buatkan cerita anak bergambar interaktif lengkap dalam format JSON yang valid.

Parameter Cerita:
- Tokoh Utama: ${characterName} (${characterType})
- Latar Tempat: ${setting}
- Pesan Moral: ${moralValue}
- Jumlah Halaman: ${safePageCount} halaman

Format JSON yang HARUS dikembalikan (tanpa markdown pembungkus selain json):
{
  "story": {
    "id": "custom-story-${Date.now()}",
    "title": "Judul Cerita Menarik untuk Anak",
    "author": "AI Story Creator",
    "category": "Cerita Kustom",
    "coverImage": "${setting.includes('Luar Angkasa') ? 'space' : setting.includes('Laut') ? 'sea' : 'forest'}",
    "coverBg": "from-purple-600 via-pink-600 to-rose-600",
    "themeColor": "purple",
    "accentColor": "#9333EA",
    "targetAge": "3-9 Tahun",
    "description": "Deskripsi singkat cerita...",
    "moralMessage": "Pesan moral...",
    "pages": [
      {
        "pageNumber": 1,
        "title": "Judul Bab Halaman",
        "text": "Teks cerita halaman 1 yang singkat, ramah anak, berirama dan hangat...",
        "illustrationType": "${setting.includes('Luar Angkasa') ? 'space' : setting.includes('Laut') ? 'sea' : setting.includes('Awan') ? 'dragon' : 'forest'}",
        "colors": {
          "bgGradFrom": "#faf5ff",
          "bgGradTo": "#e9d5ff",
          "textBg": "bg-purple-950/80",
          "accentColor": "#9333ea",
          "borderAccent": "#c084fc"
        },
        "interactiveElements": [
          {
            "id": "elem-1",
            "type": "character",
            "label": "${characterName}",
            "x": 50,
            "y": 50,
            "animation": "bounce",
            "soundType": "pop",
            "dialogue": "Halo!",
            "emoji": "🌟"
          }
        ]
      }
    ]
  }
}`;

      const response = await generateGeminiJson(ai, prompt);
      const responseText = response.text;
      const parsedJson = JSON.parse(responseText);

      res.json({ ...parsedJson, model: response.model });
    } catch (error) {
      console.error('Error generating story:', error);
      res.status(500).json({ error: 'Failed to generate story with Gemini.' });
    }
  });

  app.post('/api/admin/translate-story', async (req, res) => {
    if (!isValidAdminPin(req.headers['x-admin-pin'])) {
      return res.status(403).json({ error: 'PIN admin tidak valid.' });
    }

    try {
      const title = typeof req.body?.title === 'string' ? req.body.title.trim().slice(0, 120) : 'BacaYuk Story';
      const pages = Array.isArray(req.body?.pages)
        ? req.body.pages
            .map((page: unknown, index: number) => {
              const item = page as Record<string, unknown>;
              return {
                pageNumber: Number(item.pageNumber) || index + 1,
                title: typeof item.title === 'string' ? item.title.trim().slice(0, 120) : '',
                text: typeof item.text === 'string' ? item.text.trim().slice(0, 1800) : '',
              };
            })
            .filter((page) => page.text)
        : [];

      if (pages.length === 0) {
        return res.status(400).json({ error: 'Tidak ada teks halaman untuk diterjemahkan.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: 'GEMINI_API_KEY is not configured.' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Translate this Indonesian children's storybook into natural, simple English for children.
Keep the same number of pages. Keep the meaning warm and child-safe. Do not add markdown.

Return only valid JSON with this shape:
{
  "translations": [
    { "pageNumber": 1, "textEn": "English translation..." }
  ]
}

Book title: ${title}
Pages:
${pages.map((page) => `Page ${page.pageNumber}${page.title ? ` - ${page.title}` : ''}:\n${page.text}`).join('\n\n')}`;

      const response = await generateGeminiJson(ai, prompt);
      const parsedJson = JSON.parse(response.text || '{}');
      const translations = Array.isArray(parsedJson.translations)
        ? parsedJson.translations
            .map((item: unknown) => {
              const row = item as Record<string, unknown>;
              return {
                pageNumber: Number(row.pageNumber),
                textEn: typeof row.textEn === 'string' ? row.textEn.trim() : '',
              };
            })
            .filter((item: { pageNumber: number; textEn: string }) => item.pageNumber && item.textEn)
        : [];

      if (translations.length === 0) {
        return res.status(502).json({ error: 'AI tidak mengembalikan hasil terjemahan yang valid.' });
      }

      res.json({ translations, model: response.model });
    } catch (error) {
      console.error('Error translating story:', error);
      res.status(500).json({ error: 'Gagal membuat terjemahan cerita.' });
    }
  });

  app.post('/api/verify-admin-pin', (req, res) => {
    const configuredPin = process.env.ADMIN_PIN || process.env.VITE_ADMIN_PIN;
    const submittedPin = typeof req.body?.pin === 'string' ? req.body.pin : '';

    if (!configuredPin) {
      return res.status(503).json({ error: 'ADMIN_PIN is not configured.' });
    }

    res.json({ ok: submittedPin === configuredPin });
  });

  // Midtrans Snap Token endpoint
  app.post('/api/create-transaction', async (req, res) => {
    try {
      const order = await resolveTransactionRequest(req.body);
      const snap = getSnapClient();
      const transactionId = `TRX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const parameter = {
        transaction_details: {
          order_id: transactionId,
          gross_amount: order.amount
        },
        credit_card: {
          secure: true
        },
        customer_details: {
          first_name: order.customerName,
          email: order.customerEmail
        },
        item_details: [{
          id: order.storyId,
          price: order.amount,
          quantity: 1,
          name: order.storyTitle
        }],
        custom_field1: order.purchaseType,
        custom_field2: order.storyId,
        custom_field3: order.couponCode || ''
      };

      const transaction = await snap.createTransaction(parameter);
      res.json({
        token: transaction.token,
        redirect_url: transaction.redirect_url,
        orderId: transactionId,
        amount: order.amount,
        discountAmount: order.discountAmount,
        couponCode: order.couponCode,
        storyId: order.storyId,
        storyTitle: order.storyTitle,
        purchaseType: order.purchaseType,
      });
    } catch (error) {
      console.error('Error generating midtrans token:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to generate midtrans token.' });
    }
  });

  app.post('/api/verify-transaction', async (req, res) => {
    try {
      const { orderId } = req.body;
      if (typeof orderId !== 'string' || !orderId.trim()) {
        return res.status(400).json({ error: 'orderId is required.' });
      }

      const core = getCoreClient();
      const status = await core.transaction.status(orderId.trim());
      const transactionStatus = status.transaction_status;
      const fraudStatus = status.fraud_status;
      const isPaid =
        (transactionStatus === 'capture' && fraudStatus === 'accept') ||
        transactionStatus === 'settlement';

      res.json({
        orderId,
        isPaid,
        transactionStatus,
        fraudStatus,
        paymentType: status.payment_type,
        grossAmount: Number(status.gross_amount || 0),
      });
    } catch (error) {
      console.error('Error verifying midtrans transaction:', error);
      res.status(500).json({ error: 'Failed to verify transaction status.' });
    }
  });

  app.post('/api/midtrans-notification', async (req, res) => {
    try {
      const core = getCoreClient();
      const status = await core.transaction.notification(req.body);
      console.log('Midtrans notification:', {
        orderId: status.order_id,
        transactionStatus: status.transaction_status,
        fraudStatus: status.fraud_status,
      });
      res.json({ ok: true });
    } catch (error) {
      console.error('Error processing midtrans notification:', error);
      res.status(500).json({ error: 'Failed to process notification.' });
    }
  });

  if (serveClient) {
    // Vite middleware for development
    if (!isProductionServer) {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  return app;
}

async function startServer() {
  const PORT = 3000;
  const app = await createApp();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}
