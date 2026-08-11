import { getSupabaseAdminClient } from '../clients/supabaseAdminClient';
import { USD_TO_IDR } from '../config/storybookConfig';

export type CostEventType = 'book_draft' | 'image_generation' | 'pdf_ocr' | 'payment_fee';
export type GeminiUsage = { inputTokens: number; outputTokens: number; imageTokens: number };

export function getGeminiUsage(response: unknown): GeminiUsage {
  const usage = (response as { usageMetadata?: Record<string, unknown> })?.usageMetadata || {};
  const inputTokens = Number(usage.promptTokenCount) || 0;
  const outputTokens = Number(usage.candidatesTokenCount) || 0;

  return { inputTokens, outputTokens, imageTokens: outputTokens };
}

export function estimateGeminiCost(model: string, usage: GeminiUsage, kind: 'text' | 'image'): { amountUsd: number; amountIdr: number } {
  const imageModel = model.includes('3-pro-image')
    ? { input: 2, output: 120 }
    : { input: 0.5, output: 60 };
  const textModel = model.includes('3.6-flash')
    ? { input: 1.5, output: 7.5 }
    : { input: 0.3, output: 2.5 };
  const pricing = kind === 'image' ? imageModel : textModel;
  const amountUsd = ((usage.inputTokens * pricing.input) + (usage.outputTokens * pricing.output)) / 1_000_000;

  return { amountUsd, amountIdr: Math.round(amountUsd * USD_TO_IDR) };
}

export async function recordCostEvent(input: {
  referenceId?: string;
  storyId?: string;
  storyTitle?: string;
  eventType: CostEventType;
  provider: string;
  model?: string;
  amountUsd?: number;
  amountIdr: number;
  usage?: GeminiUsage;
  metadata?: Record<string, unknown>;
}) {
  try {
    const supabase = getSupabaseAdminClient();
    const usage = input.usage || { inputTokens: 0, outputTokens: 0, imageTokens: 0 };
    const { error } = await supabase.from('book_cost_events').insert({
      id: `cost-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      reference_id: input.referenceId || null,
      story_id: input.storyId || null,
      story_title: input.storyTitle || '',
      event_type: input.eventType,
      provider: input.provider,
      model: input.model || null,
      amount_idr: input.amountIdr,
      amount_usd: input.amountUsd || null,
      input_tokens: usage.inputTokens || null,
      output_tokens: usage.outputTokens || null,
      image_tokens: usage.imageTokens || null,
      metadata: input.metadata || {},
    });
    if (error) throw error;
  } catch (error) {
    console.error('Failed to record book cost event:', error);
  }
}

export function estimateMidtransFee(amount: number, paymentMethod: string): number {
  const method = paymentMethod.toLowerCase();
  const baseFee = method.includes('qris')
    ? amount * 0.007
    : method.includes('gopay') || method.includes('shopee')
      ? amount * 0.02
      : method.includes('ovo') || method.includes('dana')
        ? amount * 0.015
        : method.includes('credit_card') || method.includes('credit')
          ? (amount * 0.029) + 2_000
          : 4_000;

  return Math.round(baseFee * 1.11);
}

