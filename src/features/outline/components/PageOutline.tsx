'use client';

import { useState } from 'react';
import type { LocalDate } from '@/domain/types';
import { usePageBlocks } from '../hooks/usePageBlocks';
import { BlockEditor } from './BlockEditor';
import styles from './PageOutline.module.css';

export function PageOutline({ pageDate }: { pageDate: LocalDate }) {
  const blocks = usePageBlocks(pageDate);
  // Same id (and tree position) as the block it becomes once saved, so the editor keeps focus and caret.
  const [placeholderId] = useState(() => crypto.randomUUID());

  if (blocks === undefined) {
    return <p aria-busy="true">Loading…</p>;
  }

  const rows =
    blocks.length > 0
      ? blocks.map((b) => ({ id: b.id, content: b.content, persisted: true }))
      : [{ id: placeholderId, content: '', persisted: false }];

  return (
    <ul aria-label="Blocks" className={styles.outline}>
      {rows.map((row) => (
        <li key={row.id}>
          <BlockEditor
            id={row.id}
            pageDate={pageDate}
            initialContent={row.content}
            persisted={row.persisted}
            autoFocus={!row.persisted}
          />
        </li>
      ))}
    </ul>
  );
}
