import type { Express } from 'express';
import { GoogleGenAI } from '@google/genai';
import { getSupabaseAdminClient } from '../clients/supabaseAdminClient';
import { USD_TO_IDR } from '../config/storybookConfig';
import { isValidAdminPin } from '../middleware/adminAuth';
import { estimateGeminiCost, recordCostEvent } from '../services/costTracking.service';
import { generateGeminiImage } from '../services/gemini.service';
import {
  cleanAiText,
  cleanOneLine,
  createStorageSlug,
  imageExtensionFromMimeType,
  normalizeIllustrationType,
  normalizeProductionGuide,
  removeLiteralPhrases,
} from '../utils/storybookNormalization';

export function registerIllustrationRoutes(app: Express) {
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
      const imageCost = estimateGeminiCost(generatedImage.model, generatedImage.usage, 'image');
      await recordCostEvent({
        storyId,
        storyTitle,
        eventType: 'image_generation',
        provider: 'Gemini',
        model: generatedImage.model,
        amountUsd: imageCost.amountUsd,
        amountIdr: imageCost.amountIdr,
        usage: generatedImage.usage,
        metadata: { imageKind, pageNumber, imageSize: '1K', usdToIdr: USD_TO_IDR },
      });

      res.json({
        imageUrl: data.publicUrl,
        path: objectPath,
        model: generatedImage.model,
        mimeType: contentType,
        cost: imageCost,
      });
    } catch (error) {
      console.error('Error generating story image:', error);
      res.status(500).json({ error: 'Gagal generate gambar buku.' });
    }
  });
}

