'use client';

import { useCallback, useRef } from 'react';
import type { BlockId, LocalDate } from '@/domain/types';
import { blockService } from '@/services/block-service';
import { useDebouncedCallback } from '@/shared/hooks/useDebouncedCallback';

/** Content writes are debounced but always land within 1 s of the keystroke (US-01, Tech Spec §1.4). */
export const AUTOSAVE_DELAY_MS = 300;
export const AUTOSAVE_MAX_WAIT_MS = 800;

interface AutosaveTarget {
  id: BlockId;
  pageDate: LocalDate;
  /** `false` for the unsaved placeholder block of an empty day. */
  persisted: boolean;
}

/**
 * Saves the content of one block as the user types. Writes are queued so the placeholder's
 * create always runs before its first content update. Failures surface through the storage banner.
 */
export function useAutosave({ id, pageDate, persisted }: AutosaveTarget): (content: string) => void {
  const persistedRef = useRef(persisted);
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());

  const enqueue = useCallback((write: () => Promise<unknown>) => {
    queueRef.current = queueRef.current.then(write).catch(() => {
      // Reported by BlockService.onStorageError; keep the queue alive for later edits.
    });
  }, []);

  const saveContent = useDebouncedCallback(
    (content: string) => enqueue(() => blockService.updateContent(id, content)),
    { delay: AUTOSAVE_DELAY_MS, maxWait: AUTOSAVE_MAX_WAIT_MS },
  );

  return useCallback(
    (content: string) => {
      if (!persistedRef.current) {
        persistedRef.current = true;
        enqueue(() => blockService.createBlock({ id, pageDate, content }));
        return;
      }
      saveContent(content);
    },
    [enqueue, id, pageDate, saveContent],
  );
}
