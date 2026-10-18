'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { BlockRepository } from '@/db/block-repository';
import { db } from '@/db/database';
import type { Block, LocalDate } from '@/domain/types';
import { reportStorageError } from '@/shared/providers/storage-errors';

const blocks = new BlockRepository(db);

/**
 * Top-level blocks of a page, sorted by order. `undefined` while loading.
 * Becomes `usePageTree` once nesting lands (US-07).
 */
export function usePageBlocks(pageDate: LocalDate): Block[] | undefined {
  return useLiveQuery(async () => {
    try {
      return await blocks.getSiblings(pageDate, null);
    } catch (error) {
      // Keep the page usable; the banner explains that nothing is being saved.
      reportStorageError(error);
      return [];
    }
  }, [pageDate]);
}
