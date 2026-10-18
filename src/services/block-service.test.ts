import { OfeliaDatabase, SCHEMA_VERSION } from '@/db/database';
import { StorageError } from '@/db/errors';
import { BlockService } from './block-service';

const DAY = '2026-09-27';

describe('BlockService', () => {
  let db: OfeliaDatabase;
  let service: BlockService;
  let clock: Date;

  beforeEach(() => {
    db = new OfeliaDatabase(`test-${crypto.randomUUID()}`);
    clock = new Date('2026-09-27T10:00:00.000Z');
    service = new BlockService(db, () => clock);
  });

  afterEach(async () => {
    await db.delete();
  });

  it('creates a block with derived tags and timestamps', async () => {
    const block = await service.createBlock({ pageDate: DAY, content: 'Plan #Work' });

    expect(await db.blocks.get(block.id)).toEqual({
      id: block.id,
      pageDate: DAY,
      parentId: null,
      order: expect.any(String),
      content: 'Plan #Work',
      tags: ['work'],
      task: null,
      reminder: null,
      collapsed: false,
      createdAt: '2026-09-27T10:00:00.000Z',
      updatedAt: '2026-09-27T10:00:00.000Z',
    });
  });

  it('keeps a caller-provided id', async () => {
    const block = await service.createBlock({ pageDate: DAY, id: 'placeholder-1' });
    expect(block.id).toBe('placeholder-1');
  });

  it('orders appended and inserted siblings', async () => {
    const first = await service.createBlock({ pageDate: DAY, content: 'first' });
    const third = await service.createBlock({ pageDate: DAY, content: 'third' });
    const second = await service.createBlock({ pageDate: DAY, afterId: first.id, content: 'second' });

    const ordered = (await db.blocks.toArray()).sort((a, b) => (a.order < b.order ? -1 : 1));
    expect(ordered.map((b) => b.id)).toEqual([first.id, second.id, third.id]);
  });

  it('rejects a parent from another page', async () => {
    const parent = await service.createBlock({ pageDate: DAY });
    await expect(service.createBlock({ pageDate: '2026-09-28', parentId: parent.id })).rejects.toThrow(/does not exist/);
  });

  it('updates content, tags and updatedAt', async () => {
    const block = await service.createBlock({ pageDate: DAY, content: 'old' });
    clock = new Date('2026-09-27T10:05:00.000Z');

    await service.updateContent(block.id, 'new #idea');

    expect(await db.blocks.get(block.id)).toMatchObject({
      content: 'new #idea',
      tags: ['idea'],
      createdAt: '2026-09-27T10:00:00.000Z',
      updatedAt: '2026-09-27T10:05:00.000Z',
    });
  });

  it('deletes a block with all its descendants', async () => {
    const root = await service.createBlock({ pageDate: DAY });
    const child = await service.createBlock({ pageDate: DAY, parentId: root.id });
    await service.createBlock({ pageDate: DAY, parentId: child.id });
    const other = await service.createBlock({ pageDate: DAY });

    await service.deleteBlock(root.id);

    expect((await db.blocks.toArray()).map((b) => b.id)).toEqual([other.id]);
  });

  it('survives reopening the database', async () => {
    const block = await service.createBlock({ pageDate: DAY, content: 'persisted' });
    db.close();

    const reopened = new OfeliaDatabase(db.name);
    expect((await reopened.blocks.get(block.id))?.content).toBe('persisted');
    expect(await reopened.meta.get('schemaVersion')).toEqual({ key: 'schemaVersion', value: SCHEMA_VERSION });
    reopened.close();
  });

  it('notifies listeners and rejects with StorageError when storage is full', async () => {
    const listener = vi.fn();
    service.onStorageError(listener);
    vi.spyOn(db.blocks, 'put').mockRejectedValueOnce(new DOMException('full', 'QuotaExceededError'));

    const result = service.createBlock({ pageDate: DAY });

    await expect(result).rejects.toBeInstanceOf(StorageError);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ kind: 'quota-exceeded' }));
  });

  it('does not report programming errors as storage failures', async () => {
    const listener = vi.fn();
    service.onStorageError(listener);

    await expect(service.createBlock({ pageDate: DAY, parentId: 'missing' })).rejects.not.toBeInstanceOf(StorageError);
    expect(listener).not.toHaveBeenCalled();
  });
});
