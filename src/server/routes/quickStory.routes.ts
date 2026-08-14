import type { Express } from 'express';
import { GoogleGenAI } from '@google/genai';
import { generateGeminiJson } from '../services/gemini.service';
import { AuthenticationError, requireAuthenticatedUser } from '../middleware/userAuth';
import { listUserEntitlements } from '../services/payment.service';

export function registerQuickStoryRoutes(app: Express) {
  // Gemini AI endpoint for custom children's story generation
  app.post('/api/generate-story', async (req, res) => {
    try {
      if (process.env.AI_STORY_MAKER_ENABLED !== 'true') {
        return res.status(503).json({ error: 'Fitur membuat cerita AI segera hadir.' });
      }

      const user = await requireAuthenticatedUser(req);
      const entitlements = await listUserEntitlements(user.id);
      const hasActiveVip = entitlements.some((entitlement) => (
        entitlement.entitlement_type === 'vip'
        && entitlement.starts_at
        && new Date(entitlement.starts_at) <= new Date()
        && entitlement.expires_at
        && new Date(entitlement.expires_at) > new Date()
      ));
      if (!hasActiveVip) {
        return res.status(403).json({ error: 'Fitur ini hanya tersedia untuk anggota VIP aktif.' });
      }

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
      if (error instanceof AuthenticationError) {
        return res.status(401).json({ error: error.message });
      }
      console.error('Error generating story:', error);
      res.status(500).json({ error: 'Failed to generate story with Gemini.' });
    }
  });
}

