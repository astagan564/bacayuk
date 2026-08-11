import type { Express } from 'express';
import { GoogleGenAI } from '@google/genai';
import type { StoryPage, StoryVisualPreset } from '../../types';
import { STORYBOOK_VISUAL_PRESETS, USD_TO_IDR } from '../config/storybookConfig';
import { isValidAdminPin } from '../middleware/adminAuth';
import { estimateGeminiCost, recordCostEvent } from '../services/costTracking.service';
import { generateGeminiJson } from '../services/gemini.service';
import {
  asRecord,
  cleanAiText,
  cleanOneLine,
  normalizeGlossary,
  normalizeIllustrationType,
  normalizeInteractiveElements,
  normalizeProductionGuide,
  normalizeQuizQuestion,
  normalizeStringList,
  normalizeVocabularyQuiz,
} from '../utils/storybookNormalization';

type GeneratedStoryPage = Omit<StoryPage, 'colors'>;

export function registerCoreStoryRoutes(app: Express) {
  app.post('/api/admin/generate-book-draft', async (req, res) => {
    if (!isValidAdminPin(req.headers['x-admin-pin'])) {
      return res.status(403).json({ error: 'PIN admin tidak valid.' });
    }

    try {
      const requestedTitle = cleanOneLine(req.body?.title, 120);
      const trackingStoryId = cleanOneLine(req.body?.storyId, 100);
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

      const draftCost = estimateGeminiCost(response.model, response.usage, 'text');
      await recordCostEvent({
        storyId: trackingStoryId,
        storyTitle: requestedTitle || cleanOneLine(parsed.title, 120, 'Buku Cerita Baru'),
        eventType: 'book_draft',
        provider: 'Gemini',
        model: response.model,
        amountUsd: draftCost.amountUsd,
        amountIdr: draftCost.amountIdr,
        usage: response.usage,
        metadata: { pageCount: pages.length, usdToIdr: USD_TO_IDR },
      });

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
}

