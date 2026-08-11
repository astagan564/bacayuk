import { useCallback, useEffect, useMemo, useState } from 'react';
import { storybookApi } from '@/features/book-studio/api/storybookApi';
import type { BookCostEvent } from '@/features/book-studio/types';

export interface StoryCostRow {
  storyId: string;
  title: string;
  aiCost: number;
  paymentFee: number;
  imageCount: number;
}

interface CostLedgerControllerOptions {
  adminPin?: string;
  totalRevenue: number;
}

export function useCostLedgerController({ adminPin, totalRevenue }: CostLedgerControllerOptions) {
  const [costEvents, setCostEvents] = useState<BookCostEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadCostEvents = useCallback(async () => {
    if (!adminPin) return;
    try {
      setCostEvents(await storybookApi.getCostEvents(adminPin));
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Ledger biaya belum dapat dimuat.');
    }
  }, [adminPin]);

  useEffect(() => {
    void loadCostEvents();
  }, [loadCostEvents]);

  const totals = useMemo(() => {
    const totalAiCost = costEvents
      .filter((event) => event.event_type !== 'payment_fee')
      .reduce((sum, event) => sum + event.amount_idr, 0);
    const totalPaymentFee = costEvents
      .filter((event) => event.event_type === 'payment_fee')
      .reduce((sum, event) => sum + event.amount_idr, 0);

    const storyRows = Object.values(costEvents.reduce<Record<string, StoryCostRow>>((rows, event) => {
      const storyId = event.story_id || 'belum-tertaut';
      const row = rows[storyId] || {
        storyId,
        title: event.story_title || 'Biaya belum ditautkan ke buku',
        aiCost: 0,
        paymentFee: 0,
        imageCount: 0,
      };
      if (event.event_type === 'payment_fee') row.paymentFee += event.amount_idr;
      else row.aiCost += event.amount_idr;
      if (event.event_type === 'image_generation') row.imageCount += 1;
      rows[storyId] = row;
      return rows;
    }, {})).sort((left, right) =>
      (right.aiCost + right.paymentFee) - (left.aiCost + left.paymentFee)
    );

    return {
      totalAiCost,
      totalPaymentFee,
      netProfit: totalRevenue - totalAiCost - totalPaymentFee,
      storyRows,
    };
  }, [costEvents, totalRevenue]);

  return {
    error,
    loadCostEvents,
    ...totals,
  };
}
