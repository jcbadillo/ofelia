import type { Block } from '@/domain/types';
import { buildBlock } from '@/test/factories';
import { OfeliaDatabase, SCHEMA_VERSION } from './database';
import { StorageError } from './errors';
import { assertMigrationChain, MIGRATIONS, type Migration } from './migrations';

/** A fake v2 that renames content to upper case, so the test can see that the data changed. */
const upperCaseV2: Migration = {
  version: 2,
  upgrade: async (tx) => {
    await tx
      .table<Block>('blocks')
      .toCollection()
      .modify((block) => {
        block.content = block.content.toUpperCase();
      });
  },
};

describe('schema migrations (US-02)', () => {
  let name: string;
  const opened: OfeliaDatabase[] = [];

  function openDb(migrations?: readonly Migration[]): OfeliaDatabase {
    const db = new OfeliaDatabase(name, migrations);
    opened.push(db);
    return db;
  }

  async function seedV1(blocks: Block[]): Promise<void> {
    const v1 = openDb([]);
    await v1.blocks.bulkPut(blocks);
    v1.close();
  }

  beforeEach(() => {
    name = `test-${crypto.randomUUID()}`;
  });

  afterEach(async () => {
    opened.forEach((db) => db.close());
    opened.length = 0;
    await new OfeliaDatabase(name).delete();
  });

  it('creates a fresh database at the latest version without running migrations', async () => {
    const upgrade = vi.fn(async () => undefined);
    const db = openDb([{ version: 2, upgrade }]);
    const onUpgradeStart = vi.fn();
    db.onUpgradeStart(onUpgradeStart);

    await db.open();

    expect(await db.meta.get('schemaVersion')).toEqual({ key: 'schemaVersion', value: 2 });
    expect(upgrade).not.toHaveBeenCalled();
    expect(onUpgradeStart).not.toHaveBeenCalled();
  });

  it('runs the migration hook on startup when the stored version is older', async () => {
    const block = buildBlock({ content: 'hello' });
    await seedV1([block]);
    const db = openDb([upperCaseV2]);
    const onUpgradeStart = vi.fn();
    db.onUpgradeStart(onUpgradeStart);

    await db.open();

    expect(onUpgradeStart).toHaveBeenCalledOnce();
    expect(await db.blocks.get(block.id)).toEqual({ ...block, content: 'HELLO' });
    expect(await db.meta.get('schemaVersion')).toEqual({ key: 'schemaVersion', value: 2 });
    expect(db.verno).toBe(2);
  });

  it('runs every pending step in order', async () => {
    await seedV1([buildBlock()]);
    const calls: number[] = [];
    const step = (version: number): Migration => ({ version, upgrade: async () => void calls.push(version) });
    const db = openDb([step(2), step(3), step(4)]);
    const onUpgradeStart = vi.fn();
    db.onUpgradeStart(onUpgradeStart);

    await db.open();

    expect(calls).toEqual([2, 3, 4]);
    expect(onUpgradeStart).toHaveBeenCalledOnce();
    expect(await db.meta.get('schemaVersion')).toEqual({ key: 'schemaVersion', value: 4 });
  });

  it('does not run the hook again once the data is up to date', async () => {
    await seedV1([buildBlock({ content: 'hello' })]);
    const first = openDb([upperCaseV2]);
    await first.open();
    first.close();

    const upgrade = vi.fn(async () => undefined);
    const second = openDb([{ version: 2, upgrade }]);
    await second.open();

    expect(upgrade).not.toHaveBeenCalled();
  });

  it('leaves the old data untouched when a migration fails', async () => {
    const block = buildBlock({ content: 'hello' });
    await seedV1([block]);
    const failing: Migration = {
      version: 2,
      upgrade: async (tx) => {
        await tx.table('blocks').clear();
        throw new Error('boom');
      },
    };

    await expect(openDb([failing]).open()).rejects.toMatchObject({ name: 'StorageError', kind: 'migration-failed' });

    const v1 = openDb([]);
    expect(await v1.blocks.get(block.id)).toEqual(block);
    expect(await v1.meta.get('schemaVersion')).toEqual({ key: 'schemaVersion', value: 1 });
  });

  it('refuses to open data written by a newer version', async () => {
    await seedV1([]);
    const newer = openDb([upperCaseV2]);
    await newer.open();
    newer.close();

    const older = openDb([]);

    await expect(older.open()).rejects.toBeInstanceOf(StorageError);
    await expect(older.open()).rejects.toMatchObject({ kind: 'newer-version' });
  });

  it('closes and notifies an open connection when another tab upgrades', async () => {
    await seedV1([]);
    const oldTab = openDb([]);
    await oldTab.open();
    const onVersionChange = vi.fn();
    oldTab.onVersionChange(onVersionChange);

    await openDb([upperCaseV2]).open();

    expect(onVersionChange).toHaveBeenCalledOnce();
    expect(oldTab.isOpen()).toBe(false);
  });

  describe('assertMigrationChain', () => {
    const noop = async () => undefined;

    it('accepts the production chain for the current schema version', () => {
      expect(() => assertMigrationChain(MIGRATIONS, SCHEMA_VERSION)).not.toThrow();
    });

    it('accepts a contiguous chain', () => {
      expect(() => assertMigrationChain([{ version: 2, upgrade: noop }, { version: 3, upgrade: noop }], 3)).not.toThrow();
    });

    it('rejects gaps', () => {
      expect(() => assertMigrationChain([{ version: 2, upgrade: noop }, { version: 4, upgrade: noop }], 4)).toThrow(
        /expected 3/,
      );
    });

    it('rejects a chain that does not end at the schema version', () => {
      expect(() => assertMigrationChain([{ version: 2, upgrade: noop }], 1)).toThrow(/schema version is 1/);
    });
  });
});
