'use client';

import { useSyncExternalStore } from 'react';
import { today } from '@/domain/dates';
import type { LocalDate } from '@/domain/types';
import { PageOutline } from '@/features/outline';
import styles from './JournalScreen.module.css';

const noopSubscribe = () => () => {};

/** Today's local date on the client; `null` during static prerender, where "today" is the build day. */
function useClientToday(): LocalDate | null {
  return useSyncExternalStore(noopSubscribe, today, () => null);
}

/** Today's page. Readable title and day navigation arrive with US-03 / US-04. */
export function JournalScreen() {
  const pageDate = useClientToday();

  return (
    <main className={styles.main}>
      {pageDate === null ? (
        <p aria-busy="true">Loading…</p>
      ) : (
        <>
          <h1>{pageDate}</h1>
          <PageOutline pageDate={pageDate} />
        </>
      )}
    </main>
  );
}
