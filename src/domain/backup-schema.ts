import { z } from 'zod';
import { SCHEMA_VERSION } from './schema-version';
import { normalizeTag } from './tags';
import type { Block, IsoDateTime, MetaEntry } from './types';

// JSON backup contract (Tech Spec §2.5). Export (US-24) and restore (US-25) build on it.

export const BACKUP_FORMAT = 'ofelia-backup';

const isoDateTime = z.iso.datetime({ offset: true });
const localDate = z.iso.date();
const tagName = z
  .string()
  .regex(/^[\p{L}\p{N}_-]+$/u)
  .refine((tag) => tag === normalizeTag(tag), 'Tags are stored in lowercase');

export const taskInfoSchema = z.object({
  state: z.enum(['TODO', 'DOING', 'DONE']),
  stateChangedAt: isoDateTime,
});

export const reminderSchema = z.object({
  remindAt: isoDateTime,
  firedAt: isoDateTime.nullable(),
  dismissedAt: isoDateTime.nullable(),
});

export const blockSchema = z.object({
  id: z.string().min(1),
  pageDate: localDate,
  parentId: z.string().min(1).nullable(),
  order: z.string().min(1),
  content: z.string(),
  tags: z.array(tagName),
  task: taskInfoSchema.nullable(),
  reminder: reminderSchema.nullable(),
  collapsed: z.boolean(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

export const metaEntrySchema = z.discriminatedUnion('key', [
  z.object({ key: z.literal('schemaVersion'), value: z.number().int().positive() }),
  z.object({ key: z.literal('lastOpenedAt'), value: isoDateTime }),
]);

export const backupFileSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  schemaVersion: z.literal(SCHEMA_VERSION),
  appVersion: z.string().min(1),
  exportedAt: isoDateTime,
  data: z.object({
    blocks: z.array(blockSchema),
    meta: z.array(metaEntrySchema),
  }),
});

export type BackupFile = z.infer<typeof backupFileSchema>;

export interface CreateBackupInput {
  blocks: Block[];
  meta: MetaEntry[];
  appVersion: string;
  exportedAt: IsoDateTime;
}

/** Builds a backup of the current data; it always carries the current schema version (US-02, US-24). */
export function createBackupFile({ blocks, meta, appVersion, exportedAt }: CreateBackupInput): BackupFile {
  return {
    format: BACKUP_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    appVersion,
    exportedAt,
    data: {
      blocks,
      meta: meta.map((entry) => (entry.key === 'schemaVersion' ? { ...entry, value: SCHEMA_VERSION } : entry)),
    },
  };
}

/** Upgrades a raw backup object from `version - 1` to `version`. */
export type BackupMigration = (backup: Record<string, unknown>) => Record<string, unknown>;

/** Keyed by target version, mirroring the database migrations in `db/migrations.ts`. */
export const BACKUP_MIGRATIONS: Readonly<Record<number, BackupMigration>> = {};

export type MigrateBackupResult =
  | { ok: true; backup: BackupFile }
  | { ok: false; error: 'unknown-format' | 'unsupported-version' | 'schema-mismatch'; message: string };

/**
 * Brings a parsed backup up to the current schema version and validates it, without side effects.
 * Older versions are upgraded step by step; newer versions are rejected.
 */
export function migrateBackup(
  raw: unknown,
  migrations: Readonly<Record<number, BackupMigration>> = BACKUP_MIGRATIONS,
): MigrateBackupResult {
  const header = z.object({ format: z.literal(BACKUP_FORMAT), schemaVersion: z.number().int().positive() }).safeParse(raw);
  if (!header.success) {
    return { ok: false, error: 'unknown-format', message: 'This file is not an Ofelia backup.' };
  }
  const { schemaVersion } = header.data;
  if (schemaVersion > SCHEMA_VERSION) {
    return {
      ok: false,
      error: 'unsupported-version',
      message: `This backup was made by a newer version of Ofelia (schema ${schemaVersion}). Update the app to restore it.`,
    };
  }

  let current = raw as Record<string, unknown>;
  for (let version = schemaVersion + 1; version <= SCHEMA_VERSION; version++) {
    const migrate = migrations[version];
    if (!migrate) {
      return { ok: false, error: 'unsupported-version', message: `No upgrade path from backup schema ${version - 1}.` };
    }
    current = { ...migrate(current), schemaVersion: version };
  }

  const parsed = backupFileSchema.safeParse(current);
  return parsed.success
    ? { ok: true, backup: parsed.data }
    : { ok: false, error: 'schema-mismatch', message: 'The backup file is damaged or incomplete.' };
}
