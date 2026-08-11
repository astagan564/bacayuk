import type { Express } from 'express';
import { GoogleGenAI } from '@google/genai';
import type { InteractiveElement, QuizQuestion, StoryPage } from '../../types';
import { isValidAdminPin } from '../middleware/adminAuth';
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
  normalizeVocabularyQuiz,
} from '../utils/storybookNormalization';

export function registerStoryEnhancementRoutes(app: Express) {
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
      const rawPages: unknown[] = Array.isArray(req.body?.pages) ? req.body.pages : [];
      const pages = rawPages
        .map((item, index) => {
          const page = asRecord(item);
          return {
            pageNumber: Number(page.pageNumber) || index + 1,
            title: cleanOneLine(page.title, 100, `Halaman ${index + 1}`),
            text: cleanAiText(page.text, 1800),
            illustrationType: normalizeIllustrationType(page.illustrationType, `${page.title || ''} ${page.text || ''}`),
          };
        })
        .filter((page) => page.text)
        .slice(0, 12);

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
}

