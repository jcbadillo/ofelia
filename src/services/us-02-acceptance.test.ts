import { BlockRepository } from '@/db/block-repository';
import { OfeliaDatabase, SCHEMA_VERSION } from '@/db/database';
import { MetaRepository } from '@/db/meta-repository';
import type { Migration } from '@/db/migrations';
import { createBackupFile } from '@/domain/backup-schema';
import { SCHEMA_VERSION as DOMAIN_SCHEMA_VERSION } from '@/domain/schema-version';
import { buildBlock } from '@/test/factories';
import { BlockService } from './block-service';

// Acceptance criteria for US-02: one test per criterion, named after it.

const DAY = '2026-09-27';
const EXPORTED_AT = '2026-09-27T18:30:00.000Z';

describe('US-02 acceptance', () => {
  let name: string;
  const opened: OfeliaDatabase[] = [];

  function openDb(migrations?: readonly Migration[]): OfeliaDatabase {
    const db = new OfeliaDatabase(name, migrations);
    opened.push(db);
    return db;
  }

  beforeEach(() => {
    name = `test-${crypto.randomUUID()}`;
  });

  afterEach(async () => {
    opened.forEach((db) => db.close());
    opened.length = 0;
    await new OfeliaDatabase(name).delete();
  });

  it('The schema version is stored with the data and written into every JSON export', async () => {
    const db = openDb();
    const service = new BlockService(db, () => new Date(EXPORTED_AT));
    const blockRepository = new BlockRepository(db);
    const metaRepository = new MetaRepository(db);
    await service.createBlock({ pageDate: DAY, content: 'Plan #work' });

    expect(SCHEMA_VERSION).toBe(DOMAIN_SCHEMA_VERSION);
    expect(await metaRepository.get('schemaVersion')).toBe(SCHEMA_VERSION);

    const exports = [
      createBackupFile({
        blocks: await blockRepository.getAll(),
        meta: await metaRepository.getAll(),
        appVersion: '0.1.0',
        exportedAt: EXPORTED_AT,
      }),
      createBackupFile({ blocks: [], meta: [], appVersion: '0.1.0', exportedAt: EXPORTED_AT }),
    ];
    for (const backup of exports) {
      const json: unknown = JSON.parse(JSON.stringify(backup));
      expect(json).toMatchObject({ format: 'ofelia-backup', schemaVersion: SCHEMA_VERSION });
    }
    expect(exports[0]!.data.meta).toContainEqual({ key: 'schemaVersion', value: SCHEMA_VERSION });
  });

  it("On startup, a migration hook runs when the stored version is older than the app's version", async () => {
    const block = buildBlock({ content: 'written by v1' });
    const v1 = openDb([]);
    await v1.blocks.put(block);
    v1.close();

    const upgrade = vi.fn(async () => undefined);
    const onUpgradeStart = vi.fn();
    const v2 = openDb([{ version: 2, upgrade }]);
    v2.onUpgradeStart(onUpgradeStart);
    await v2.open();

    expect(onUpgradeStart).toHaveBeenCalledOnce();
    expect(upgrade).toHaveBeenCalledOnce();
    expect(await new MetaRepository(v2).get('schemaVersion')).toBe(2);
    expect(await v2.blocks.get(block.id)).toEqual(block);
    v2.close();

    // Once the stored version matches, the next startup must not migrate again.
    const nextUpgrade = vi.fn(async () => undefined);
    const nextStart = vi.fn();
    const again = openDb([{ version: 2, upgrade: nextUpgrade }]);
    again.onUpgradeStart(nextStart);
    await again.open();

    expect(nextUpgrade).not.toHaveBeenCalled();
    expect(nextStart).not.toHaveBeenCalled();
  });

  it('Unit tests cover create, read, update and delete for blocks, including parent/child relationships', async () => {
    const db = openDb();
    let clock = new Date('2026-09-27T10:00:00.000Z');
    const service = new BlockService(db, () => clock);
    const repository = new BlockRepository(db);

    // Create a three-level tree plus an unrelated sibling.
    const parent = await service.createBlock({ pageDate: DAY, content: 'Project #work' });
    const child = await service.createBlock({ pageDate: DAY, parentId: parent.id, content: 'Draft' });
    const grandchild = await service.createBlock({ pageDate: DAY, parentId: child.id, content: 'Outline' });
    const sibling = await service.createBlock({ pageDate: DAY, content: 'Unrelated' });

    // Invalid input: a child under a parent that does not exist is rejected and nothing is written.
    await expect(service.createBlock({ pageDate: DAY, parentId: 'missing', content: 'orphan' })).rejects.toThrow(
      /does not exist/,
    );
    expect(await repository.getAll()).toHaveLength(4);

    // Read.
    expect(await repository.getById(child.id)).toEqual(child);
    expect(await repository.getById('missing')).toBeUndefined();
    expect((await repository.getChildren(parent.id)).map((b) => b.id)).toEqual([child.id]);
    expect((await repository.getDescendants(parent.id)).map((b) => b.id).sort()).toEqual(
      [child.id, grandchild.id].sort(),
    );
    expect(await repository.getChildren(grandchild.id)).toEqual([]);

    // Update a child without touching its parent; children do not inherit tags.
    clock = new Date('2026-09-27T10:05:00.000Z');
    await service.updateContent(child.id, 'Final draft #review');
    expect(await repository.getById(child.id)).toMatchObject({
      parentId: parent.id,
      content: 'Final draft #review',
      tags: ['review'],
      updatedAt: clock.toISOString(),
    });
    expect(await repository.getById(parent.id)).toEqual(parent);

    // Delete the parent: its whole subtree goes, the sibling stays.
    await service.deleteBlock(parent.id);
    expect((await repository.getAll()).map((b) => b.id)).toEqual([sibling.id]);
  });
});
