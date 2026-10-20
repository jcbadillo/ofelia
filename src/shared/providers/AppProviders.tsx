'use client';

import { useEffect, type ReactNode } from 'react';
import { db } from '@/db/database';
import { StorageError, withStorageErrors } from '@/db/errors';
import { blockService } from '@/services/block-service';
import { useUiStore } from '@/shared/store/ui-store';
import { Banner } from '@/shared/ui/Banner';
import styles from './AppProviders.module.css';
import { reportStorageError } from './storage-errors';

function StorageErrorBanner() {
  const storageError = useUiStore((s) => s.storageError);
  return storageError ? <Banner tone="error">{storageError}</Banner> : null;
}

/** Renders the app once the database is open; shows a status while migrations run (US-02). */
function DatabaseGate({ children }: { children: ReactNode }) {
  const dbStatus = useUiStore((s) => s.dbStatus);
  if (dbStatus === 'upgrading') {
    return (
      <p role="status" className={styles.status}>
        Upgrading your data…
      </p>
    );
  }
  // 'opening' renders nothing: opening an up-to-date database takes a few milliseconds.
  return dbStatus === 'opening' ? null : children;
}

/**
 * Client bootstrap: opens the database (running migrations), asks for persistent storage and
 * reports storage failures (US-01, US-02).
 */
export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    const { setDbStatus } = useUiStore.getState();
    const unsubscribers = [
      blockService.onStorageError(reportStorageError),
      db.onUpgradeStart(() => setDbStatus('upgrading')),
      db.onVersionChange(() =>
        reportStorageError(new StorageError('newer-version', 'Another tab upgraded the database.')),
      ),
    ];

    withStorageErrors(() => db.open())
      .then(() => setDbStatus('ready'))
      .catch((error: unknown) => {
        // Show the page anyway; the banner explains that nothing is being saved.
        setDbStatus('failed');
        reportStorageError(error);
      });
    // Best effort: reduces the chance of the browser evicting the journal under storage pressure.
    void navigator.storage?.persist?.().catch(() => undefined);

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  return (
    <>
      <StorageErrorBanner />
      <DatabaseGate>{children}</DatabaseGate>
    </>
  );
}
