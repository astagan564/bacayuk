import 'dotenv/config';
import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import midtransClient from 'midtrans-client';
import { INITIAL_STORIES } from './src/data/stories';
import { createClient } from '@supabase/supabase-js';
import type {
  GlossaryItem,
  InteractiveElement,
  QuizQuestion,
  Story,
  StoryCharacterBibleEntry,
  StoryPage,
  StoryProductionGuide,
  StoryVisualPreset,
  VocabularyQuiz,
  VocabularyQuizQuestion,
} from './src/types';

const DEFAULT_EBOOK_PRICE = 15000;
const VIP_SUBSCRIPTION_PRICE = 100000;
const STORYBOOK_ILLUSTRATION_TYPES: StoryPage['illustrationType'][] = [
  'forest',
  'dragon',
  'space',
  'sea',
  'castle',
  'garden',
  'custom',
];
const STORYBOOK_ANIMATIONS: InteractiveElement['animation'][] = ['hop', 'spin', 'bounce', 'glow', 'pulse', 'float'];
const STORYBOOK_SOUNDS: NonNullable<InteractiveElement['soundType']>[] = [
  'pop',
  'chime',
  'giggle',
  'magic',
  'sparkle',
  'roar',
  'splash',
];
const STORYBOOK_VISUAL_PRESETS: StoryVisualPreset[] = [
  'soft-2d-cartoon',
  'colorful-storybook',
  'stylized-adventure-cartoon',
];
type GeneratedStoryPage = Omit<StoryPage, 'colors'>;

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
const GEMINI_IMAGE_MODELS = Array.from(
  new Set(
    [
      process.env.GEMINI_IMAGE_MODEL,
      'gemini-3.1-flash-image',
      'gemini-3-pro-image-preview',
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

async function generateGeminiImage(ai: GoogleGenAI, prompt: string, aspectRatio: '4:3' | '3:4' = '3:4') {
  let lastError: unknown;

  for (const model of GEMINI_IMAGE_MODELS) {
    try {
      const interaction = await ai.interactions.create({
        model,
        input: prompt,
        response_format: {
          type: 'image',
          aspect_ratio: aspectRatio,
          image_size: '1K',
        },
      });
      const outputBlocks = (interaction as {
        outputs?: Array<{ type?: string; data?: string; mime_type?: string }>;
      }).outputs;
      const image = interaction.output_image || outputBlocks?.find((output) => output.type === 'image');
      const data = image?.data;

      if (!data) {
        throw new Error('Gemini did not return image data.');
      }

      return {
        model,
        data,
        mimeType: image.mime_type || 'image/png',
      };
    } catch (error) {
      lastError = error;
      if (!isGeminiModelUnavailable(error)) {
        throw error;
      }

      console.warn(`Gemini image model ${model} unavailable, trying fallback model...`);
    }
  }

  throw lastError || new Error('No Gemini image models are configured.');
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

function createStorageSlug(value: string, fallback = 'story') {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || fallback;
}

function imageExtensionFromMimeType(mimeType: string) {
  if (mimeType.includes('webp')) return 'webp';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
  return 'png';
}

function cleanAiText(value: unknown, maxLength: number, fallback = '') {
  if (typeof value !== 'string') return fallback;

  return value
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);
}

function cleanOneLine(value: unknown, maxLength: number, fallback = '') {
  return cleanAiText(value, maxLength, fallback).replace(/\s+/g, ' ').trim();
}

function removeLiteralPhrases(value: string, phrases: string[], fallback: string) {
  const cleaned = phrases.reduce((result, phrase) => {
    const literal = phrase.trim();
    return literal ? result.split(literal).join(' ') : result;
  }, value);

  return cleanAiText(cleaned.replace(/^[\s:;,.\-–—]+/, ''), 700) || fallback;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function clampPercent(value: unknown, fallback: number) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.min(100, Math.max(0, Math.round(numberValue)));
}

function normalizeIllustrationType(value: unknown, text = ''): StoryPage['illustrationType'] {
  if (typeof value === 'string' && STORYBOOK_ILLUSTRATION_TYPES.includes(value as StoryPage['illustrationType'])) {
    return value as StoryPage['illustrationType'];
  }

  const lower = text.toLowerCase();
  if (/laut|pantai|ombak|ikan|perahu|sungai|danau|hujan|sea|river|lake|boat/.test(lower)) return 'sea';
  if (/bintang|bulan|langit|planet|roket|angkasa|awan|space|star|moon|rocket/.test(lower)) return 'space';
  if (/naga|ajaib|sihir|peri|cahaya|kristal|magic|dragon|crystal/.test(lower)) return 'dragon';
  if (/istana|raja|ratu|putri|pangeran|menara|castle|kingdom|palace/.test(lower)) return 'castle';
  if (/kebun|bunga|taman|kupu|lebah|garden|flower|butterfly/.test(lower)) return 'garden';
  return 'forest';
}

function normalizeQuizQuestion(value: unknown): QuizQuestion | undefined {
  const raw = asRecord(value);
  const question = cleanOneLine(raw.question, 180);
  const options = Array.isArray(raw.options)
    ? raw.options.map((option) => cleanOneLine(option, 80)).filter(Boolean).slice(0, 4)
    : [];

  if (!question || options.length < 2) return undefined;

  const answerIndex = Math.min(options.length - 1, Math.max(0, Number(raw.answerIndex) || 0));

  return {
    question,
    options,
    answerIndex,
    explanation: cleanOneLine(raw.explanation, 220, 'Jawaban ini paling sesuai dengan isi cerita.'),
  };
}

function normalizeInteractiveElements(value: unknown, pageNumber: number): InteractiveElement[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index): InteractiveElement | null => {
      const raw = asRecord(item);
      const label = cleanOneLine(raw.label, 60, 'Interaksi');
      if (!label) return null;

      const animation = STORYBOOK_ANIMATIONS.includes(raw.animation as InteractiveElement['animation'])
        ? raw.animation as InteractiveElement['animation']
        : 'bounce';
      const soundType = STORYBOOK_SOUNDS.includes(raw.soundType as NonNullable<InteractiveElement['soundType']>)
        ? raw.soundType as NonNullable<InteractiveElement['soundType']>
        : 'pop';

      return {
        id: cleanOneLine(raw.id, 40, `ai_${pageNumber}_${index + 1}`),
        type: ['animal', 'star', 'item', 'sound', 'character'].includes(raw.type as string)
          ? raw.type as InteractiveElement['type']
          : 'item',
        label,
        x: clampPercent(raw.x, 50),
        y: clampPercent(raw.y, 55),
        animation,
        soundType,
        dialogue: cleanOneLine(raw.dialogue, 120),
        emoji: cleanOneLine(raw.emoji, 12, '✨'),
      };
    })
    .filter((item): item is InteractiveElement => Boolean(item))
    .slice(0, 2);
}

function normalizeStringList(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanOneLine(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeProductionGuide(value: unknown, fallbackPreset: StoryVisualPreset): StoryProductionGuide {
  const raw = asRecord(value);
  const visualPreset = STORYBOOK_VISUAL_PRESETS.includes(raw.visualPreset as StoryVisualPreset)
    ? raw.visualPreset as StoryVisualPreset
    : fallbackPreset;
  const characterBible = Array.isArray(raw.characterBible)
    ? raw.characterBible
        .map((item, index): StoryCharacterBibleEntry | null => {
          const character = asRecord(item);
          const name = cleanOneLine(character.name, 60);
          if (!name) return null;

          return {
            id: cleanOneLine(character.id, 50, `character-${index + 1}`),
            name,
            role: ['main', 'supporting', 'background'].includes(character.role as string)
              ? character.role as StoryCharacterBibleEntry['role']
              : index === 0 ? 'main' : 'supporting',
            speciesOrIdentity: cleanOneLine(character.speciesOrIdentity, 120, 'Child-friendly story character'),
            ageAppearance: cleanOneLine(character.ageAppearance, 80, 'Matches the target reader age'),
            bodyAndFace: cleanOneLine(character.bodyAndFace, 220),
            skinFurOrHair: cleanOneLine(character.skinFurOrHair, 180),
            outfit: cleanOneLine(character.outfit, 180),
            accessories: normalizeStringList(character.accessories, 8, 100),
            signatureColors: normalizeStringList(character.signatureColors, 8, 30),
            personality: normalizeStringList(character.personality, 8, 60),
            expressionGuide: normalizeStringList(character.expressionGuide, 8, 160),
            immutableTraits: normalizeStringList(character.immutableTraits, 10, 160),
          };
        })
        .filter((character): character is StoryCharacterBibleEntry => Boolean(character))
        .slice(0, 8)
    : [];

  return {
    visualPreset,
    aspectRatio: ['3:4', '4:3', '1:1', '16:9'].includes(raw.aspectRatio as string)
      ? raw.aspectRatio as StoryProductionGuide['aspectRatio']
      : '3:4',
    characterBible,
    palette: normalizeStringList(raw.palette, 10, 30),
    coverPrompt: cleanAiText(raw.coverPrompt, 700),
    continuityRules: normalizeStringList(raw.continuityRules, 12, 180),
    negativePrompt: [
      cleanAiText(raw.negativePrompt, 420),
      'photorealistic, horror, violence, typography, letters, numbers, words, sentences, captions, speech bubbles, text panels, signs, watermark, logo, extra limbs, duplicate character, changed outfit, changed colors',
    ].filter(Boolean).join(', ').slice(0, 700),
  };
}

function normalizeGlossary(value: unknown): GlossaryItem[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  return value
    .map((item, index): GlossaryItem | null => {
      const raw = asRecord(item);
      const wordEn = cleanOneLine(raw.wordEn, 50);
      const translationId = cleanOneLine(raw.translationId, 70);
      if (!wordEn || !translationId) return null;

      const key = wordEn.toLowerCase();
      if (seen.has(key)) return null;
      seen.add(key);

      return {
        id: cleanOneLine(raw.id, 40, `ai-glossary-${index + 1}`),
        wordEn,
        translationId,
        phonetic: cleanOneLine(raw.phonetic, 60),
        emoji: cleanOneLine(raw.emoji, 12, '📖'),
        exampleEn: cleanOneLine(raw.exampleEn, 140),
        exampleId: cleanOneLine(raw.exampleId, 140),
      };
    })
    .filter((item): item is GlossaryItem => Boolean(item))
    .slice(0, 12);
}

function normalizeVocabularyQuiz(value: unknown): VocabularyQuiz | undefined {
  const raw = asRecord(value);
  const questions = Array.isArray(raw.questions)
    ? raw.questions
        .map((item, questionIndex): VocabularyQuizQuestion | null => {
          const question = asRecord(item);
          const wordEn = cleanOneLine(question.wordEn, 50);
          const correctTranslationId = cleanOneLine(question.correctTranslationId, 70);
          const optionsId = Array.isArray(question.optionsId)
            ? question.optionsId.map((option) => cleanOneLine(option, 70)).filter(Boolean).slice(0, 4)
            : [];

          if (!wordEn || !correctTranslationId || optionsId.length < 2) return null;

          const distractors = Array.from(new Set(optionsId.filter((option) => option !== correctTranslationId))).slice(0, 3);
          const options = [...distractors];
          const answerPosition = (questionIndex + 1) % (options.length + 1);
          options.splice(answerPosition, 0, correctTranslationId);

          return {
            wordEn,
            correctTranslationId,
            optionsId: options,
            emoji: cleanOneLine(question.emoji, 12),
            phonetic: cleanOneLine(question.phonetic, 60),
          };
        })
        .filter((item): item is VocabularyQuiz['questions'][number] => Boolean(item))
        .slice(0, 6)
    : [];

  if (questions.length === 0) return undefined;

  return {
    title: cleanOneLine(raw.title, 100, 'Kuis Kosakata'),
    description: cleanOneLine(raw.description, 160, 'Latihan kosakata dari cerita.'),
    questions,
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

    if (error) throw error;
    return data?.story ? normalizeStory(data.story as Story) : undefined;
  } catch (error) {
    console.warn('Failed to load checkout story from Supabase:', error);
    return INITIAL_STORIES.find((item) => item.id === storyId);
  }
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

      const stories = (data || []).map((row) => normalizeStory({ ...row.story, id: row.id, status: row.status }));

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

      const stories = (data || []).map((row) => normalizeStory({ ...row.story, id: row.id, status: row.status }));

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
    if (!Array.isArray(req.body?.stories)) {
      return res.status(400).json({ error: 'Daftar buku tidak valid.' });
    }

    const storyIds = stories.map((story) => story.id?.trim());
    if (storyIds.some((id) => !id) || new Set(storyIds).size !== storyIds.length) {
      return res.status(400).json({ error: 'Setiap buku harus memiliki ID unik.' });
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

      const { data: existingRows, error: existingError } = await supabase
        .from('admin_stories')
        .select('id');
      if (existingError) throw existingError;

      if (payload.length > 0) {
        const { error: upsertError } = await supabase.from('admin_stories').upsert(payload, { onConflict: 'id' });
        if (upsertError) throw upsertError;
      }

      const deletedIds = (existingRows || [])
        .map((row) => row.id)
        .filter((id) => !storyIds.includes(id));
      if (deletedIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('admin_stories')
          .delete()
          .in('id', deletedIds);
        if (deleteError) throw deleteError;
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

  app.post('/api/admin/generate-book-draft', async (req, res) => {
    if (!isValidAdminPin(req.headers['x-admin-pin'])) {
      return res.status(403).json({ error: 'PIN admin tidak valid.' });
    }

    try {
      const requestedTitle = cleanOneLine(req.body?.title, 120);
      const targetAgeInput = cleanOneLine(req.body?.targetAge, 40, '6-8');
      const targetAgeKey = ['3-5', '6-8', '9-12'].find((value) => targetAgeInput.includes(value)) || '6-8';
      const targetAge = `${targetAgeKey} Tahun`;
      const primaryLanguage = req.body?.primaryLanguage === 'en' ? 'en' : 'id';
      const brief = cleanAiText(req.body?.brief ?? req.body?.manuscript, 24000);
      const moralMessage = cleanOneLine(req.body?.moralMessage, 220);
      const characterHints = cleanAiText(req.body?.characterHints, 800);
      const pageCount = Math.min(12, Math.max(8, Math.round(Number(req.body?.pageCount) || 10)));
      const defaultVisualPreset: StoryVisualPreset = targetAgeKey === '3-5'
        ? 'soft-2d-cartoon'
        : targetAgeKey === '9-12'
          ? 'stylized-adventure-cartoon'
          : 'colorful-storybook';
      const visualPreset = STORYBOOK_VISUAL_PRESETS.includes(req.body?.visualPreset as StoryVisualPreset)
        ? req.body.visualPreset as StoryVisualPreset
        : defaultVisualPreset;
      const tabooContent = normalizeStringList(
        Array.isArray(req.body?.tabooContent)
          ? req.body.tabooContent
          : cleanAiText(req.body?.tabooContent, 500).split(',').map((item) => item.trim()),
        12,
        100
      );

      if (brief.length < 12) {
        return res.status(400).json({ error: 'Tuliskan sedikitnya satu ide cerita yang jelas.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: 'GEMINI_API_KEY is not configured.' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are BacaYuk Book Studio, an expert children's storybook writer and visual continuity editor.
Create a complete, reviewable storybook draft from a short idea, premise, or pasted manuscript. Do not publish it.

Input:
- Optional title: ${requestedTitle || 'Generate a fitting title'}
- Target age: ${targetAge}
- Primary language: ${primaryLanguage === 'id' ? 'Indonesian' : 'English'}
- Desired page count: ${pageCount}
- Visual preset: ${visualPreset}
- Optional moral direction: ${moralMessage || 'Infer a gentle lesson from the story'}
- Optional character hints: ${characterHints || 'Create fitting original characters'}
- Additional content to avoid: ${tabooContent.length ? tabooContent.join(', ') : 'None beyond standard child-safety rules'}
- Story idea or manuscript:
${brief}

Rules:
- Return only valid JSON. No markdown wrapper.
- Remove meta-chat, assistant follow-up questions, and source formatting artifacts.
- Produce exactly ${pageCount} pages.
- Expand a short premise into a coherent beginning, problem, attempts, resolution, and reflection.
- Each page must have one clear story beat, a short title, child-safe text, one visual scene prompt, and an illustrationType.
- illustrationType must be one of: forest, dragon, space, sea, castle, garden, custom.
- Keep page text in the requested primary language and leave textEn empty.
- Do not invent a fake English translation.
- Create glossary candidates only from useful words that appear in the story.
- Create quiz/interactions as suggestions only. Keep them simple and child-friendly.
- Vary the correct vocabulary answer position across questions; never place every correct answer first.
- Visual prompts must describe subject + action + setting + mood + important object + child-safe illustration style.
- Illustration and cover prompts are visual descriptions only. Never quote or repeat the book title, page title, narration, dialogue, captions, signs, letters, or numbers.
- Define the character bible before scene prompts. Repeat immutable character traits in every relevant scene prompt.
- Keep the same visual preset, character design, outfit, colors, proportions, and recurring setting details across all pages.
- Avoid photorealism, violence, frightening imagery, readable text, logos, watermarks, extra limbs, and duplicate characters.

JSON shape:
{
  "title": "Book title",
  "category": "Story category",
  "description": "Short description",
  "moralMessage": "Moral message",
  "coverPrompt": "Cover scene prompt",
  "productionGuide": {
    "visualPreset": "${visualPreset}",
    "aspectRatio": "3:4",
    "characterBible": [
      {
        "id": "character-id",
        "name": "Character name",
        "role": "main",
        "speciesOrIdentity": "Identity or species",
        "ageAppearance": "Age appearance",
        "bodyAndFace": "Stable body and face details",
        "skinFurOrHair": "Stable skin, fur, or hair details",
        "outfit": "Exact recurring outfit",
        "accessories": ["Stable accessory"],
        "signatureColors": ["#F4C542"],
        "personality": ["Kind", "Curious"],
        "expressionGuide": ["Nervous: lowered ears"],
        "immutableTraits": ["Outfit never changes"]
      }
    ],
    "palette": ["#F4C542", "#238A8D"],
    "coverPrompt": "Cover scene prompt without readable text",
    "continuityRules": ["Visual continuity rule"],
    "negativePrompt": "Unsafe or inconsistent visual traits to exclude"
  },
  "pages": [
    {
      "title": "Page title",
      "text": "Page story text",
      "textEn": "",
      "illustrationType": "forest",
      "illustrationPrompt": "Scene prompt",
      "interactiveElements": [
        {
          "type": "character",
          "label": "Object or character",
          "x": 50,
          "y": 55,
          "animation": "bounce",
          "soundType": "chime",
          "dialogue": "Short child-friendly dialogue",
          "emoji": "✨"
        }
      ],
      "quizQuestion": {
        "question": "Question about this page",
        "options": ["Correct", "Wrong", "Wrong", "Wrong"],
        "answerIndex": 0,
        "explanation": "Why the answer is correct"
      }
    }
  ],
  "glossary": [
    {
      "wordEn": "Forest",
      "translationId": "Hutan",
      "phonetic": "for-est",
      "emoji": "🌲",
      "exampleEn": "The forest is green.",
      "exampleId": "Hutan itu hijau."
    }
  ],
  "vocabularyQuiz": {
    "title": "Kuis Kosakata",
    "description": "Latihan kosakata dari cerita.",
    "questions": [
      {
        "wordEn": "Forest",
        "correctTranslationId": "Hutan",
        "optionsId": ["Laut", "Hutan", "Istana", "Bintang"],
        "emoji": "🌲",
        "phonetic": "for-est"
      }
    ]
  }
}`;

      const response = await generateGeminiJson(ai, prompt);
      const parsed = asRecord(JSON.parse(response.text || '{}'));
      const productionGuide = normalizeProductionGuide(parsed.productionGuide, visualPreset);
      const rawPages = Array.isArray(parsed.pages) ? parsed.pages : [];
      const pages = rawPages
        .map((item, index): GeneratedStoryPage | null => {
          const page = asRecord(item);
          const pageTitle = cleanOneLine(page.title, 100, `Halaman ${index + 1}`);
          const text = cleanAiText(page.text, 1800);
          if (!text) return null;
          const illustrationType = normalizeIllustrationType(page.illustrationType, `${pageTitle} ${text}`);

          return {
            pageNumber: index + 1,
            title: pageTitle,
            titleEn: cleanOneLine(page.titleEn, 100),
            text,
            textEn: cleanAiText(page.textEn, 1800),
            illustrationType,
            illustrationPrompt: cleanAiText(
              page.illustrationPrompt,
              500,
              `A clear ${illustrationType} story scene with one focal action, expressive characters, and a child-safe colorful illustration style.`
            ),
            interactiveElements: normalizeInteractiveElements(page.interactiveElements, index + 1),
            quizQuestion: normalizeQuizQuestion(page.quizQuestion),
          };
        })
        .filter((page): page is GeneratedStoryPage => Boolean(page))
        .slice(0, 12);

      if (pages.length < 8) {
        return res.status(502).json({ error: 'AI tidak mengembalikan halaman cerita yang cukup valid.' });
      }
      if (productionGuide.characterBible.length === 0) {
        return res.status(502).json({ error: 'AI belum menghasilkan acuan karakter yang valid.' });
      }

      res.json({
        draft: {
          title: cleanOneLine(parsed.title, 120, requestedTitle || 'Buku Cerita Baru'),
          category: cleanOneLine(parsed.category, 80, 'Petualangan'),
          description: cleanOneLine(parsed.description, 220, pages[0]?.text.slice(0, 150) || ''),
          moralMessage: cleanOneLine(parsed.moralMessage, 220, 'Gunakan kebaikan dan keberanian dalam setiap perjalanan.'),
          coverPrompt: cleanAiText(
            parsed.coverPrompt,
            500,
            productionGuide.coverPrompt || 'Main character in the main setting with the key story object, warm child-safe cover artwork without text.'
          ),
          productionGuide,
          pages,
          glossary: normalizeGlossary(parsed.glossary),
          vocabularyQuiz: normalizeVocabularyQuiz(parsed.vocabularyQuiz),
        },
        model: response.model,
      });
    } catch (error) {
      console.error('Error generating book draft:', error);
      res.status(500).json({ error: 'Gagal membuat draft buku dengan AI.' });
    }
  });

  app.post('/api/admin/generate-book-enhancement', async (req, res) => {
    if (!isValidAdminPin(req.headers['x-admin-pin'])) {
      return res.status(403).json({ error: 'PIN admin tidak valid.' });
    }

    try {
      const mode = req.body?.mode;
      const title = cleanOneLine(req.body?.title, 120, 'BacaYuk Story');
      const targetAge = cleanOneLine(req.body?.targetAge, 40, '4-8 Tahun');
      const productionGuide = normalizeProductionGuide(req.body?.productionGuide, 'colorful-storybook');
      const visualContinuityContext = JSON.stringify({
        visualPreset: productionGuide.visualPreset,
        characterBible: productionGuide.characterBible,
        palette: productionGuide.palette,
        continuityRules: productionGuide.continuityRules,
        negativePrompt: productionGuide.negativePrompt,
      }).slice(0, 7000);
      const pages = Array.isArray(req.body?.pages)
        ? req.body.pages
            .map((item: unknown, index: number) => {
              const page = asRecord(item);
              return {
                pageNumber: Number(page.pageNumber) || index + 1,
                title: cleanOneLine(page.title, 100, `Halaman ${index + 1}`),
                text: cleanAiText(page.text, 1800),
                illustrationType: normalizeIllustrationType(page.illustrationType, `${page.title || ''} ${page.text || ''}`),
              };
            })
            .filter((page) => page.text)
            .slice(0, 12)
        : [];

      if (!['illustration', 'glossary', 'quiz_interactions'].includes(mode as string)) {
        return res.status(400).json({ error: 'Mode enhancement tidak valid.' });
      }
      if (pages.length === 0) {
        return res.status(400).json({ error: 'Tidak ada halaman cerita untuk diproses.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: 'GEMINI_API_KEY is not configured.' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const pageContext = pages
        .map((page) => `Page ${page.pageNumber}${page.title ? ` - ${page.title}` : ''}:\n${page.text}`)
        .join('\n\n');
      const promptByMode = {
        illustration: `Create fresh child-safe illustration scene prompts for this storybook.
Return only valid JSON:
{
  "pages": [
    { "pageNumber": 1, "illustrationType": "forest", "illustrationPrompt": "Scene prompt" }
  ]
}

Rules:
- Keep the same page numbers.
- illustrationType must be one of: forest, dragon, space, sea, castle, garden, custom.
- Prompt shape: subject + action + setting + mood + important object + child-safe storybook style.
- Repeat the relevant immutable character traits in every prompt.
- Prompts must describe visible scenery only; do not copy page titles, narration, or dialogue into them.
- Do not request typography, letters, numbers, captions, speech bubbles, signs, labels, logos, or watermarks.

Visual continuity guide:
${visualContinuityContext}

Title: ${title}
Target age: ${targetAge}
Pages:
${pageContext}`,
        glossary: `Extract useful English-learning glossary candidates from this storybook.
Return only valid JSON:
{
  "glossary": [
    {
      "wordEn": "Forest",
      "translationId": "Hutan",
      "phonetic": "for-est",
      "emoji": "🌲",
      "exampleEn": "The forest is green.",
      "exampleId": "Hutan itu hijau."
    }
  ],
  "vocabularyQuiz": {
    "title": "Kuis Kosakata",
    "description": "Latihan kosakata dari cerita.",
    "questions": [
      {
        "wordEn": "Forest",
        "correctTranslationId": "Hutan",
        "optionsId": ["Laut", "Hutan", "Istana", "Bintang"],
        "emoji": "🌲",
        "phonetic": "for-est"
      }
    ]
  }
}

Rules:
- Only include words that are relevant to the story.
- Prefer 6 to 10 useful child-friendly vocabulary items.
- Do not include generic words that are not in the story context.
- Quiz options must include the correct answer exactly once.
- Vary the correct answer position across questions; never place every correct answer first.

Title: ${title}
Target age: ${targetAge}
Pages:
${pageContext}`,
        quiz_interactions: `Create reviewable quiz and interaction suggestions for this storybook.
Return only valid JSON:
{
  "pages": [
    {
      "pageNumber": 1,
      "interactiveElements": [
        {
          "type": "character",
          "label": "Object or character",
          "x": 50,
          "y": 55,
          "animation": "bounce",
          "soundType": "chime",
          "dialogue": "Short child-friendly dialogue",
          "emoji": "✨"
        }
      ],
      "quizQuestion": {
        "question": "Question about this page",
        "options": ["Correct", "Wrong", "Wrong", "Wrong"],
        "answerIndex": 0,
        "explanation": "Why the answer is correct"
      }
    }
  ]
}

Rules:
- Keep the same page numbers.
- One interaction per page is enough; maximum two.
- X/Y are percentages for likely visual object positions.
- Quiz should test comprehension or moral reasoning.
- Keep options stable and child-friendly.

Title: ${title}
Target age: ${targetAge}
Pages:
${pageContext}`,
      } as const;

      const response = await generateGeminiJson(ai, promptByMode[mode as keyof typeof promptByMode]);
      const parsed = asRecord(JSON.parse(response.text || '{}'));

      if (mode === 'illustration') {
        const enhancedPages = Array.isArray(parsed.pages)
          ? parsed.pages
              .map((item: unknown) => {
                const page = asRecord(item);
                const pageNumber = Number(page.pageNumber);
                const sourcePage = pages.find((candidate) => candidate.pageNumber === pageNumber);
                if (!pageNumber || !sourcePage) return null;

                return {
                  pageNumber,
                  illustrationType: normalizeIllustrationType(
                    page.illustrationType,
                    `${sourcePage.title} ${sourcePage.text}`
                  ),
                  illustrationPrompt: cleanAiText(page.illustrationPrompt, 500),
                };
              })
              .filter((page): page is { pageNumber: number; illustrationType: StoryPage['illustrationType']; illustrationPrompt: string } =>
                Boolean(page?.illustrationPrompt)
              )
          : [];

        return res.json({ pages: enhancedPages, model: response.model });
      }

      if (mode === 'glossary') {
        return res.json({
          glossary: normalizeGlossary(parsed.glossary),
          vocabularyQuiz: normalizeVocabularyQuiz(parsed.vocabularyQuiz),
          model: response.model,
        });
      }

      const enhancedPages = Array.isArray(parsed.pages)
        ? parsed.pages
            .map((item: unknown): {
              pageNumber: number;
              interactiveElements: InteractiveElement[];
              quizQuestion?: QuizQuestion;
            } | null => {
              const page = asRecord(item);
              const pageNumber = Number(page.pageNumber);
              if (!pageNumber || !pages.some((candidate) => candidate.pageNumber === pageNumber)) return null;

              return {
                pageNumber,
                interactiveElements: normalizeInteractiveElements(page.interactiveElements, pageNumber),
                quizQuestion: normalizeQuizQuestion(page.quizQuestion),
              };
            })
            .filter((page): page is {
              pageNumber: number;
              interactiveElements: InteractiveElement[];
              quizQuestion?: QuizQuestion;
            } => Boolean(page && (page.interactiveElements.length > 0 || page.quizQuestion)))
        : [];

      return res.json({ pages: enhancedPages, model: response.model });
    } catch (error) {
      console.error('Error generating story enhancement:', error);
      res.status(500).json({ error: 'Gagal membuat enhancement cerita dengan AI.' });
    }
  });

  app.post('/api/admin/generate-page-image', async (req, res) => {
    if (!isValidAdminPin(req.headers['x-admin-pin'])) {
      return res.status(403).json({ error: 'PIN admin tidak valid.' });
    }

    try {
      const storyId = cleanOneLine(req.body?.storyId, 100, 'story');
      const storyTitle = cleanOneLine(req.body?.storyTitle, 120, 'BacaYuk Story');
      const targetAge = cleanOneLine(req.body?.targetAge, 40, '4-8 Tahun');
      const imageKind = req.body?.imageKind === 'cover' ? 'cover' : 'page';
      const pageNumber = Math.max(1, Number(req.body?.pageNumber) || 1);
      const pageTitle = cleanOneLine(req.body?.pageTitle, 100, `Halaman ${pageNumber}`);
      const pageText = cleanAiText(req.body?.pageText, 1800);
      const illustrationType = normalizeIllustrationType(req.body?.illustrationType, `${pageTitle} ${pageText}`);
      const illustrationPrompt = cleanAiText(req.body?.illustrationPrompt, 700);
      const productionGuide = normalizeProductionGuide(req.body?.productionGuide, 'colorful-storybook');
      const coverPrompt = cleanAiText(
        req.body?.coverPrompt,
        700,
        productionGuide.coverPrompt || 'Main character in the main setting, warm child-safe storybook cover artwork.'
      );
      const visualCoverPrompt = removeLiteralPhrases(
        coverPrompt,
        [storyTitle],
        'Main character in the main setting, warm child-safe storybook cover artwork.'
      );
      const visualIllustrationPrompt = removeLiteralPhrases(
        illustrationPrompt,
        [storyTitle, pageTitle, pageText],
        `A clear child-safe ${illustrationType} scene with one focal action and expressive characters.`
      );
      const ageArtDirection = /3\s*[-–]\s*5/.test(targetAge)
        ? 'simple friendly shapes, gentle expressions, and an uncluttered composition'
        : /9\s*[-–]\s*12/.test(targetAge)
          ? 'richer environmental detail while keeping the focal action clear'
          : 'clear expressive characters with balanced storybook detail';
      const visualContinuityContext = JSON.stringify({
        visualPreset: productionGuide.visualPreset,
        characterBible: productionGuide.characterBible,
        palette: productionGuide.palette,
        continuityRules: productionGuide.continuityRules,
        negativePrompt: productionGuide.negativePrompt,
      }).slice(0, 7000);

      if (imageKind === 'page' && !illustrationPrompt) {
        return res.status(400).json({ error: 'Prompt adegan visual diperlukan sebelum membuat gambar.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: 'GEMINI_API_KEY is not configured.' });
      }

      const prompt = imageKind === 'cover'
        ? `NON-NEGOTIABLE OUTPUT RULE: Create artwork containing zero text or typography. Do not reproduce any words from this prompt in the image.

Create one polished portrait cover artwork for a children's storybook.
Visual scene description: ${visualCoverPrompt}
Age-appropriate style: ${ageArtDirection}

Art direction:
- Use the visual preset and character bible below as the source of truth.
- Show the main character, main setting, key story object, and emotional promise.
- Preserve every immutable character trait, outfit, color, accessory, and proportion.
- Use a clear portrait composition with one focal scene, not a collage.
- Avoid scary, violent, dark, or photorealistic adult styling.
- Edge-to-edge illustration only. No title, typography, letters, numbers, words, sentences, captions, speech bubbles, labels, signs, text panels, logos, signatures, or watermarks.
- Do not create blank title boxes, caption areas, banners, placards, pages, or UI elements.

Visual continuity guide:
${visualContinuityContext}

FINAL CHECK: The finished artwork must contain no visible written characters of any kind.`
        : `NON-NEGOTIABLE OUTPUT RULE: Create artwork containing zero text or typography. Do not reproduce any words from this prompt in the image.

Create one polished edge-to-edge illustration for a children's storybook page.
Visual scene description: ${visualIllustrationPrompt}
Visual environment category: ${illustrationType}
Age-appropriate style: ${ageArtDirection}

Art direction:
- Use the visual preset and character bible below as the source of truth.
- Indonesian-friendly characters/settings when context suggests Indonesia.
- One clear focal action.
- Preserve every immutable character trait, outfit, color, accessory, and proportion.
- Avoid scary, violent, dark, or photorealistic adult styling.
- No typography, letters, numbers, words, sentences, captions, speech bubbles, labels, signs, text panels, logos, signatures, or watermarks.
- Do not create blank caption boxes, banners, placards, pages, or UI elements.
- Fill the entire frame with illustration; the app renders story text separately outside this image.

Visual continuity guide:
${visualContinuityContext}

FINAL CHECK: The finished artwork must contain no visible written characters of any kind.`;

      const ai = new GoogleGenAI({ apiKey });
      const generatedImage = await generateGeminiImage(ai, prompt, '3:4');
      const imageBuffer = Buffer.from(generatedImage.data, 'base64');
      const contentType = generatedImage.mimeType;
      const extension = imageExtensionFromMimeType(contentType);
      const storySlug = createStorageSlug(storyId || storyTitle, 'story');
      const objectPath = imageKind === 'cover'
        ? `${storySlug}/cover-${Date.now()}.${extension}`
        : `${storySlug}/page-${String(pageNumber).padStart(2, '0')}-${Date.now()}.${extension}`;
      const supabase = getSupabaseAdminClient();
      const { error } = await supabase
        .storage
        .from('story-images')
        .upload(objectPath, imageBuffer, {
          contentType,
          upsert: true,
        });

      if (error) {
        throw error;
      }

      const { data } = supabase.storage.from('story-images').getPublicUrl(objectPath);

      res.json({
        imageUrl: data.publicUrl,
        path: objectPath,
        model: generatedImage.model,
        mimeType: contentType,
      });
    } catch (error) {
      console.error('Error generating story image:', error);
      res.status(500).json({ error: 'Gagal generate gambar buku.' });
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
