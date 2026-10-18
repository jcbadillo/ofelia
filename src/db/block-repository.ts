import type { Block, BlockId, LocalDate } from '@/domain/types';
import type { OfeliaDatabase } from './database';
import { withStorageErrors } from './errors';

const byOrder = (a: Block, b: Block) => (a.order < b.order ? -1 : a.order > b.order ? 1 : 0);

export class BlockRepository {
  constructor(private readonly db: OfeliaDatabase) {}

  getById(id: BlockId): Promise<Block | undefined> {
    return withStorageErrors(() => this.db.blocks.get(id));
  }

  getByPage(pageDate: LocalDate): Promise<Block[]> {
    return withStorageErrors(() => this.db.blocks.where('pageDate').equals(pageDate).toArray());
  }

  /** Siblings sorted by `order`. `parentId === null` returns the top-level blocks of the page. */
  async getSiblings(pageDate: LocalDate, parentId: BlockId | null): Promise<Block[]> {
    // `null` is not a valid IndexedDB key, so top-level blocks are filtered in memory.
    const blocks =
      parentId === null
        ? (await this.getByPage(pageDate)).filter((b) => b.parentId === null)
        : await withStorageErrors(() =>
            this.db.blocks.where('[pageDate+parentId]').equals([pageDate, parentId]).toArray(),
          );
    return blocks.sort(byOrder);
  }

  getChildren(parentId: BlockId): Promise<Block[]> {
    return withStorageErrors(async () =>
      (await this.db.blocks.where('parentId').equals(parentId).toArray()).sort(byOrder),
    );
  }

  async getDescendants(id: BlockId): Promise<Block[]> {
    const result: Block[] = [];
    let frontier: BlockId[] = [id];
    while (frontier.length > 0) {
      const level = await withStorageErrors(() =>
        this.db.blocks.where('parentId').anyOf(frontier).toArray(),
      );
      result.push(...level);
      frontier = level.map((b) => b.id);
    }
    return result;
  }

  getAll(): Promise<Block[]> {
    return withStorageErrors(() => this.db.blocks.toArray());
  }

  put(block: Block): Promise<void> {
    return withStorageErrors(async () => {
      await this.db.blocks.put(block);
    });
  }

  bulkPut(blocks: Block[]): Promise<void> {
    return withStorageErrors(async () => {
      await this.db.blocks.bulkPut(blocks);
    });
  }

  bulkDelete(ids: BlockId[]): Promise<void> {
    return withStorageErrors(() => this.db.blocks.bulkDelete(ids));
  }
}
