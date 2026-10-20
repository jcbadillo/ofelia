import type { z } from 'zod';
import { buildBlock } from '@/test/factories';
import {
  BACKUP_FORMAT,
  backupFileSchema,
  blockSchema,
  createBackupFile,
  metaEntrySchema,
  migrateBackup,
} from './backup-schema';
import { SCHEMA_VERSION } from './schema-version';
import type { Block, MetaEntry } from './types';

const EXPORTED_AT = '2026-09-27T18:30:00.000Z';

function sampleBackup() {
  const parent = buildBlock({ content: 'Plan #work', tags: ['work'], collapsed: true });
  const task = buildBlock({
    parentId: parent.id,
    content: 'Call',
    task: { state: 'TODO', stateChangedAt: '2026-09-27T10:00:00.000Z' },
    reminder: { remindAt: '2026-09-28T09:00:00.000Z', firedAt: null, dismissedAt: null },
  });
  return createBackupFile({
    blocks: [parent, task],
    meta: [
      { key: 'schemaVersion', value: SCHEMA_VERSION },
      { key: 'lastOpenedAt', value: '2026-09-27T08:00:00.000Z' },
    ],
    appVersion: '0.1.0',
    exportedAt: EXPORTED_AT,
  });
}

describe('backup schema (US-02)', () => {
  it('keeps the runtime schemas in sync with the domain types', () => {
    expectTypeOf<z.infer<typeof blockSchema>>().toEqualTypeOf<Block>();
    expectTypeOf<z.infer<typeof metaEntrySchema>>().toEqualTypeOf<MetaEntry>();
  });

  describe('createBackupFile', () => {
    it('writes the format and the current schema version', () => {
      const backup = sampleBackup();

      expect(backup).toMatchObject({ format: BACKUP_FORMAT, schemaVersion: SCHEMA_VERSION, appVersion: '0.1.0', exportedAt: EXPORTED_AT });
      expect(backupFileSchema.safeParse(backup).success).toBe(true);
    });

    it('keeps hierarchy, tags, task state, reminders and collapsed state', () => {
      const backup = sampleBackup();
      const [parent, task] = backup.data.blocks;

      expect(parent).toMatchObject({ tags: ['work'], collapsed: true });
      expect(task).toMatchObject({ parentId: parent!.id, task: { state: 'TODO' }, reminder: { remindAt: '2026-09-28T09:00:00.000Z' } });
    });

    it('stamps the current version in meta too', () => {
      const backup = createBackupFile({ blocks: [], meta: [{ key: 'schemaVersion', value: 0 }], appVersion: '0.1.0', exportedAt: EXPORTED_AT });

      expect(backup.data.meta).toEqual([{ key: 'schemaVersion', value: SCHEMA_VERSION }]);
    });
  });

  describe('migrateBackup', () => {
    it('accepts a current backup that survives a JSON round trip unchanged', () => {
      const backup = sampleBackup();

      expect(migrateBackup(JSON.parse(JSON.stringify(backup)))).toEqual({ ok: true, backup });
    });

    it.each([null, 'text', {}, { format: 'other', schemaVersion: 1 }])('rejects %j as an unknown format', (raw) => {
      expect(migrateBackup(raw)).toMatchObject({ ok: false, error: 'unknown-format' });
    });

    it('rejects a backup from a newer schema version', () => {
      expect(migrateBackup({ ...sampleBackup(), schemaVersion: SCHEMA_VERSION + 1 })).toMatchObject({
        ok: false,
        error: 'unsupported-version',
      });
    });

    it('rejects a malformed block', () => {
      const backup = sampleBackup();
      const broken = { ...backup, data: { ...backup.data, blocks: [{ ...backup.data.blocks[0], tags: ['Work'] }] } };

      expect(migrateBackup(broken)).toMatchObject({ ok: false, error: 'schema-mismatch' });
    });

    it('rejects a task with an unknown state', () => {
      const backup = sampleBackup();
      const task = { ...backup.data.blocks[1], task: { state: 'LATER', stateChangedAt: EXPORTED_AT } };
      const broken = { ...backup, data: { ...backup.data, blocks: [task] } };

      expect(migrateBackup(broken)).toMatchObject({ ok: false, error: 'schema-mismatch' });
    });
  });
});
