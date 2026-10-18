'use client';

import { useCallback, useEffect, useRef } from 'react';

export interface DebounceOptions {
  delay: number;
  /** Upper bound between the first pending call and its execution, even while calls keep coming. */
  maxWait?: number;
}

export interface DebouncedFunction<Args extends unknown[]> {
  (...args: Args): void;
  /** Runs the pending call now, if any. */
  flush: () => void;
}

export function debounce<Args extends unknown[]>(
  callback: (...args: Args) => void,
  { delay, maxWait }: DebounceOptions,
): DebouncedFunction<Args> {
  let pendingArgs: Args | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let maxTimer: ReturnType<typeof setTimeout> | undefined;

  const flush = () => {
    clearTimeout(timer);
    clearTimeout(maxTimer);
    timer = maxTimer = undefined;
    if (pendingArgs === null) return;
    const args = pendingArgs;
    pendingArgs = null;
    callback(...args);
  };

  const debounced = (...args: Args) => {
    pendingArgs = args;
    clearTimeout(timer);
    timer = setTimeout(flush, delay);
    if (maxWait !== undefined && maxTimer === undefined) {
      maxTimer = setTimeout(flush, maxWait);
    }
  };
  return Object.assign(debounced, { flush });
}

/**
 * Debounces `callback`. The pending call is flushed when the page is hidden or unloaded
 * and when the component unmounts, so no edit is ever dropped.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  { delay, maxWait }: DebounceOptions,
): (...args: Args) => void {
  const callbackRef = useRef(callback);
  const debouncedRef = useRef<DebouncedFunction<Args> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const debounced = debounce<Args>((...args) => callbackRef.current(...args), { delay, maxWait });
    debouncedRef.current = debounced;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') debounced.flush();
    };
    window.addEventListener('pagehide', debounced.flush);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', debounced.flush);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      debounced.flush();
    };
  }, [delay, maxWait]);

  return useCallback((...args: Args) => debouncedRef.current?.(...args), []);
}
