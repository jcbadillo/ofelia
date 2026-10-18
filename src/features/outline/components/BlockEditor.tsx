'use client';

import type { BlockId, LocalDate } from '@/domain/types';
import { useAutosave } from '../hooks/useAutosave';
import styles from './BlockEditor.module.css';

interface BlockEditorProps {
  id: BlockId;
  pageDate: LocalDate;
  initialContent: string;
  persisted: boolean;
  autoFocus?: boolean;
}

export function BlockEditor({ id, pageDate, initialContent, persisted, autoFocus }: BlockEditorProps) {
  const save = useAutosave({ id, pageDate, persisted });

  return (
    <textarea
      id={`block-${id}`}
      className={styles.editor}
      aria-label="Block content"
      rows={1}
      defaultValue={initialContent}
      autoFocus={autoFocus}
      onChange={(event) => save(event.target.value)}
    />
  );
}
