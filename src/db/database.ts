import { Dexie, type EntityTable } from 'dexie';
import type { Block, MetaEntry } from '@/domain/types';

export const DB_NAME = 'ofelia';
/** Data schema version of the stored data (US-02 adds the migration chain). */
export const SCHEMA_VERSION = 1;

export class OfeliaDatabase extends Dexie {
  blocks!: EntityTable<Block, 'id'>;
  meta!: EntityTable<MetaEntry, 'key'>;

  constructor(name: string = DB_NAME) {
    super(name);
    // Indexes from Tech Spec §2.2.
    this.version(1).stores({
      blocks: 'id, pageDate, [pageDate+parentId], parentId, *tags, task.state, reminder.remindAt, updatedAt',
      meta: 'key',
    });
    this.on('populate', (tx) => {
      void tx.table('meta').add({ key: 'schemaVersion', value: SCHEMA_VERSION } satisfies MetaEntry);
    });
  }
}

export const db = new OfeliaDatabase();
