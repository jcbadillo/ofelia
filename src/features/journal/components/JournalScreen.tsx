'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { formatPageTitle, today } from '@/domain/dates';
import { PageOutline } from '@/features/outline';
import styles from './JournalScreen.module.css';

const noopSubscribe = () => () => {};

/** `false` during static prerender, where "today" would be the build day. */
function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/** Today's page with a readable title. Day navigation arrives with US-04. */
export function JournalScreen() {
  const isClient = useIsClient();

  return <main className={styles.main}>{isClient ? <JournalPage /> : <p aria-busy="true">Loading…</p>}</main>;
}

function JournalPage() {
  // Captured once per mount: the page stays on the day it opened on, even past midnight (US-03).
  const [pageDate] = useState(today);
  const title = formatPageTitle(pageDate);

  useEffect(() => {
    const previous = document.title;
    document.title = `${title} · Ofelia`;
    return () => {
      document.title = previous;
    };
  }, [title]);

  return (
    <>
      <h1 className={styles.title}>
        <time dateTime={pageDate}>{title}</time>
      </h1>
      <PageOutline pageDate={pageDate} />
    </>
  );
}
