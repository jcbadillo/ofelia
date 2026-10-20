import { buildBlock } from '@/test/factories';
import { createBackupFile, migrateBackup } from './backup-schema';

// Pretend the app is at schema version 2 so a version-1 backup needs upgrading.
vi.mock('./schema-version', () => ({ SCHEMA_VERSION: 2 }));

const EXPORTED_AT = '2026-09-27T18:30:00.000Z';

describe('migrateBackup with an older backup (US-02)', () => {
  const current = createBackupFile({
    blocks: [buildBlock({ content: 'hello' })],
    meta: [{ key: 'schemaVersion', value: 2 }],
    appVersion: '0.2.0',
    exportedAt: EXPORTED_AT,
  });
  const v1 = { ...current, schemaVersion: 1, data: { ...current.data, legacy: true } };

  it('upgrades the backup step by step before validating it', () => {
    const toV2 = vi.fn((backup: Record<string, unknown>) => {
      const data = { ...(backup.data as Record<string, unknown>) };
      delete data.legacy;
      return { ...backup, data };
    });

    const result = migrateBackup(v1, { 2: toV2 });

    expect(toV2).toHaveBeenCalledOnce();
    expect(result).toEqual({ ok: true, backup: current });
  });

  it('rejects a backup without an upgrade path', () => {
    expect(migrateBackup(v1, {})).toMatchObject({ ok: false, error: 'unsupported-version' });
  });

  it('rejects a backup the upgrade could not repair', () => {
    expect(migrateBackup(v1, { 2: (backup) => ({ ...backup, data: null }) })).toMatchObject({
      ok: false,
      error: 'schema-mismatch',
    });
  });
});
