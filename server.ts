import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import midtransClient from 'midtrans-client';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini AI endpoint for custom children's story generation
  app.post('/api/generate-story', async (req, res) => {
    try {
      const { characterName, characterType, setting, moralValue, pageCount = 6 } = req.body;

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
- Jumlah Halaman: ${pageCount} halaman

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

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '';
      const parsedJson = JSON.parse(responseText);

      res.json(parsedJson);
    } catch (error) {
      console.error('Error generating story:', error);
      res.status(500).json({ error: 'Failed to generate story with Gemini.' });
    }
  });

  // Midtrans Snap Token endpoint
  app.post('/api/create-transaction', async (req, res) => {
    try {
      const { transactionId, amount, customerName, customerEmail, storyTitle } = req.body;

      const snap = new midtransClient.Snap({
        isProduction: false,
        serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-YOUR_SERVER_KEY',
        clientKey: process.env.VITE_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-YOUR_CLIENT_KEY'
      });

      const parameter = {
        transaction_details: {
          order_id: transactionId,
          gross_amount: amount
        },
        credit_card: {
          secure: true
        },
        customer_details: {
          first_name: customerName,
          email: customerEmail
        },
        item_details: [{
          id: transactionId,
          price: amount,
          quantity: 1,
          name: storyTitle
        }]
      };

      const transaction = await snap.createTransaction(parameter);
      res.json({ token: transaction.token, redirect_url: transaction.redirect_url });
    } catch (error) {
      console.error('Error generating midtrans token:', error);
      res.status(500).json({ error: 'Failed to generate midtrans token.' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
