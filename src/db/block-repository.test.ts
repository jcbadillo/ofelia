import { buildBlock, buildChain, buildSiblings, TEST_DAY } from '@/test/factories';
import { BlockRepository } from './block-repository';
import { OfeliaDatabase } from './database';
import { StorageError } from './errors';

const OTHER_DAY = '2026-09-28';

describe('BlockRepository', () => {
  let db: OfeliaDatabase;
  let repository: BlockRepository;

  beforeEach(() => {
    db = new OfeliaDatabase(`test-${crypto.randomUUID()}`);
    repository = new BlockRepository(db);
  });

  afterEach(async () => {
    await db.delete();
  });

  describe('create and read', () => {
    it('puts a block and reads it back by id', async () => {
      const block = buildBlock({ content: 'Plan #work', tags: ['work'] });

      await repository.put(block);

      expect(await repository.getById(block.id)).toEqual(block);
    });

    it('returns undefined for an unknown id', async () => {
      expect(await repository.getById('missing')).toBeUndefined();
    });

    it('reads every block of a page, and only that page', async () => {
      const today = buildSiblings(2);
      const other = buildBlock({ pageDate: OTHER_DAY });
      await repository.bulkPut([...today, other]);

      const page = await repository.getByPage(TEST_DAY);

      expect(page.map((b) => b.id).sort()).toEqual(today.map((b) => b.id).sort());
    });

    it('reads all blocks', async () => {
      const blocks = [...buildSiblings(2), buildBlock({ pageDate: OTHER_DAY })];
      await repository.bulkPut(blocks);

      expect(await repository.getAll()).toHaveLength(3);
    });
  });

  describe('parent/child relationships', () => {
    it('returns top-level siblings sorted by order, without children', async () => {
      const [first, second, third] = buildSiblings(3);
      const child = buildBlock({ parentId: first!.id });
      await repository.bulkPut([third!, child, first!, second!]);

      const siblings = await repository.getSiblings(TEST_DAY, null);

      expect(siblings.map((b) => b.id)).toEqual([first!.id, second!.id, third!.id]);
    });

    it('returns the children of a parent sorted by order', async () => {
      const parent = buildBlock();
      const children = buildSiblings(3, { parentId: parent.id });
      await repository.bulkPut([parent, ...[...children].reverse()]);

      expect((await repository.getSiblings(TEST_DAY, parent.id)).map((b) => b.id)).toEqual(children.map((b) => b.id));
      expect((await repository.getChildren(parent.id)).map((b) => b.id)).toEqual(children.map((b) => b.id));
    });

    it('returns only direct children', async () => {
      const [root, child, grandchild] = buildChain(3);
      await repository.bulkPut([root!, child!, grandchild!]);

      expect((await repository.getChildren(root!.id)).map((b) => b.id)).toEqual([child!.id]);
    });

    it('returns all descendants of a 10-level chain', async () => {
      const chain = buildChain(10);
      const unrelated = buildBlock();
      await repository.bulkPut([...chain, unrelated]);

      const descendants = await repository.getDescendants(chain[0]!.id);

      expect(descendants.map((b) => b.id).sort()).toEqual(chain.slice(1).map((b) => b.id).sort());
    });

    it('returns descendants across several branches', async () => {
      const root = buildBlock();
      const branches = buildSiblings(2, { parentId: root.id });
      const leaves = branches.map((branch) => buildBlock({ parentId: branch.id }));
      await repository.bulkPut([root, ...branches, ...leaves]);

      const descendants = await repository.getDescendants(root.id);

      expect(descendants).toHaveLength(4);
    });

    it('returns no descendants for a leaf', async () => {
      const leaf = buildBlock();
      await repository.put(leaf);

      expect(await repository.getDescendants(leaf.id)).toEqual([]);
    });
  });

  describe('update', () => {
    it('replaces a block when put again with the same id', async () => {
      const block = buildBlock({ content: 'old' });
      await repository.put(block);

      await repository.put({ ...block, content: 'new', collapsed: true });

      expect(await repository.getById(block.id)).toMatchObject({ content: 'new', collapsed: true });
      expect(await repository.getAll()).toHaveLength(1);
    });

    it('moves a block to another parent', async () => {
      const [a, b] = buildSiblings(2);
      const child = buildBlock({ parentId: a!.id });
      await repository.bulkPut([a!, b!, child]);

      await repository.put({ ...child, parentId: b!.id });

      expect(await repository.getChildren(a!.id)).toEqual([]);
      expect((await repository.getChildren(b!.id)).map((x) => x.id)).toEqual([child.id]);
    });
  });

  describe('delete', () => {
    it('deletes the given blocks only', async () => {
      const [a, b, c] = buildSiblings(3);
      await repository.bulkPut([a!, b!, c!]);

      await repository.bulkDelete([a!.id, c!.id]);

      expect((await repository.getAll()).map((x) => x.id)).toEqual([b!.id]);
    });
  });

  it('rejects with a typed StorageError when a write fails', async () => {
    vi.spyOn(db.blocks, 'put').mockRejectedValueOnce(new DOMException('full', 'QuotaExceededError'));

    const result = repository.put(buildBlock());

    await expect(result).rejects.toBeInstanceOf(StorageError);
    await expect(result).rejects.toMatchObject({ kind: 'quota-exceeded' });
  });
});
