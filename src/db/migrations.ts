import type { Transaction } from 'dexie';

/** One step of the schema chain. Its Dexie version equals the data schema version. */
export interface Migration {
  /** Target version; must be the previous version + 1. */
  version: number;
  /** Dexie store changes for this version; omit when only the data changes. */
  stores?: Record<string, string | null>;
  /** Transforms the stored data. Runs in the upgrade transaction, so a throw leaves the old data untouched. */
  upgrade: (tx: Transaction) => Promise<void>;
}

/** Baseline schema (version 1), indexes from Tech Spec §2.2. */
export const V1_STORES = {
  blocks: 'id, pageDate, [pageDate+parentId], parentId, *tags, task.state, reminder.remindAt, updatedAt',
  meta: 'key',
} as const;

/** Production migrations, in order. Version 1 is the baseline and needs none. */
export const MIGRATIONS: readonly Migration[] = [];

/** The version a database reaches after running every migration in the chain. */
export function latestVersion(migrations: readonly Migration[]): number {
  return migrations.at(-1)?.version ?? 1;
}

/** Throws when the chain has gaps, is out of order or does not end at `schemaVersion`. */
export function assertMigrationChain(migrations: readonly Migration[], schemaVersion: number): void {
  migrations.forEach((migration, index) => {
    const expected = index + 2;
    if (migration.version !== expected) {
      throw new Error(`Migration #${index} targets version ${migration.version}, expected ${expected}`);
    }
  });
  if (latestVersion(migrations) !== schemaVersion) {
    throw new Error(`Migrations end at version ${latestVersion(migrations)}, but the schema version is ${schemaVersion}`);
  }
}
