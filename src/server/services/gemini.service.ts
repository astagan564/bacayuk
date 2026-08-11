import { GoogleGenAI } from '@google/genai';
import { GEMINI_IMAGE_MODELS, GEMINI_TEXT_MODELS } from '../config/storybookConfig';
import { getGeminiUsage } from './costTracking.service';

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

export async function generateGeminiJson(ai: GoogleGenAI, contents: string) {
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
        usage: getGeminiUsage(response),
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

export async function extractGeminiTextFromImage(ai: GoogleGenAI, imageBase64: string) {
  let lastError: unknown;

  for (const model of GEMINI_TEXT_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{
          role: 'user',
          parts: [
            {
              text: 'Transcribe every readable word on this children\'s-book page. Preserve natural paragraph breaks and dialogue. Return only the transcribed text: no introduction, no markdown, no description of the image, and no page number.',
            },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64,
              },
            },
          ],
        }],
      });

      return { model, text: response.text || '', usage: getGeminiUsage(response) };
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

export async function generateGeminiImage(ai: GoogleGenAI, prompt: string, aspectRatio: '4:3' | '3:4' = '3:4') {
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
        usage: getGeminiUsage(interaction),
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

