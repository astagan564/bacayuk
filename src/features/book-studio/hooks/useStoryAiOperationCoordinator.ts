import { useCallback, useEffect, useMemo, useRef } from 'react';
import type {
  StoryAiOperationCoordinator,
  StoryAiOperationTicket,
} from '@/features/book-studio/types/storyAi';

interface ActiveStoryAiOperation extends StoryAiOperationTicket {
  abortController: AbortController;
}

export function useStoryAiOperationCoordinator(storyId?: string): StoryAiOperationCoordinator {
  const nextOperationIdRef = useRef(0);
  const activeOperationRef = useRef<ActiveStoryAiOperation | null>(null);

  const cancelActive = useCallback(() => {
    activeOperationRef.current?.abortController.abort();
    activeOperationRef.current = null;
  }, []);

  const start = useCallback((): StoryAiOperationTicket | null => {
    if (activeOperationRef.current) return null;

    const abortController = new AbortController();
    const operation = {
      id: nextOperationIdRef.current + 1,
      signal: abortController.signal,
      abortController,
    };
    nextOperationIdRef.current = operation.id;
    activeOperationRef.current = operation;
    return operation;
  }, []);

  const isCurrent = useCallback((operationId: number) => (
    activeOperationRef.current?.id === operationId
    && !activeOperationRef.current.signal.aborted
  ), []);

  const finish = useCallback((operationId: number) => {
    if (activeOperationRef.current?.id === operationId) activeOperationRef.current = null;
  }, []);

  useEffect(() => cancelActive, [cancelActive, storyId]);

  return useMemo(() => ({ start, isCurrent, finish }), [finish, isCurrent, start]);
}
