'use client';

import { useEffect, type ReactNode } from 'react';
import { db } from '@/db/database';
import { withStorageErrors } from '@/db/errors';
import { blockService } from '@/services/block-service';
import { useUiStore } from '@/shared/store/ui-store';
import { Banner } from '@/shared/ui/Banner';
import { reportStorageError } from './storage-errors';

function StorageErrorBanner() {
  const storageError = useUiStore((s) => s.storageError);
  return storageError ? <Banner tone="error">{storageError}</Banner> : null;
}

/** Client bootstrap: opens the database, asks for persistent storage and reports storage failures (US-01). */
export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    const unsubscribe = blockService.onStorageError(reportStorageError);

    withStorageErrors(() => db.open()).catch(reportStorageError);
    // Best effort: reduces the chance of the browser evicting the journal under storage pressure.
    void navigator.storage?.persist?.().catch(() => undefined);

    return unsubscribe;
  }, []);

  return (
    <>
      <StorageErrorBanner />
      {children}
    </>
  );
}
