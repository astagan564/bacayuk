import { useCallback, useEffect, useRef, useState } from 'react';

const TOAST_DURATION_MS = 3000;

export function useApplicationToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const showToast = useCallback((nextMessage: string): void => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(nextMessage);
    timerRef.current = setTimeout(() => {
      setMessage((currentMessage) => currentMessage === nextMessage ? null : currentMessage);
      timerRef.current = null;
    }, TOAST_DURATION_MS);
  }, []);

  return { message, showToast };
}

export type ApplicationToastController = ReturnType<typeof useApplicationToast>;
