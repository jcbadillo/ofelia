import { generateKeyBetween } from 'fractional-indexing';
import { BlockRepository } from '@/db/block-repository';
import { db as defaultDb, type OfeliaDatabase } from '@/db/database';
import { assertStorageAvailable, StorageError, toStorageError } from '@/db/errors';
import { parseTags } from '@/domain/tags';
import type { Block, BlockId, LocalDate } from '@/domain/types';

export interface CreateBlockInput {
  pageDate: LocalDate;
  /** Insert right after this sibling; otherwise append at the end. */
  afterId?: BlockId;
  parentId?: BlockId | null;
  content?: string;
  /** Lets the editor keep a stable identity for the unsaved placeholder block. */
  id?: BlockId;
}

type StorageErrorListener = (error: StorageError) => void;

export class BlockService {
  private readonly blocks: BlockRepository;
  private readonly listeners = new Set<StorageErrorListener>();

  constructor(
    private readonly db: OfeliaDatabase,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.blocks = new BlockRepository(db);
  }

  /** Notified on every failed write (drives the "not saving" banner, US-01). */
  onStorageError(listener: StorageErrorListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  createBlock(input: CreateBlockInput): Promise<Block> {
    return this.write(async () => {
      const parentId = input.parentId ?? null;
      if (parentId !== null) {
        const parent = await this.blocks.getById(parentId);
        if (!parent || parent.pageDate !== input.pageDate) {
          throw new Error(`Parent ${parentId} does not exist on page ${input.pageDate}`);
        }
      }
      const siblings = await this.blocks.getSiblings(input.pageDate, parentId);
      const afterIndex = input.afterId ? siblings.findIndex((b) => b.id === input.afterId) : -1;
      const prev = afterIndex >= 0 ? siblings[afterIndex] : siblings.at(-1);
      const next = afterIndex >= 0 ? siblings[afterIndex + 1] : undefined;

      const timestamp = this.now().toISOString();
      const content = input.content ?? '';
      const block: Block = {
        id: input.id ?? crypto.randomUUID(),
        pageDate: input.pageDate,
        parentId,
        order: generateKeyBetween(prev?.order ?? null, next?.order ?? null),
        content,
        tags: parseTags(content),
        task: null,
        reminder: null,
        collapsed: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await this.blocks.put(block);
      return block;
    });
  }

  updateContent(id: BlockId, content: string): Promise<void> {
    return this.write(async () => {
      const block = await this.blocks.getById(id);
      if (!block || block.content === content) return;
      await this.blocks.put({
        ...block,
        content,
        tags: parseTags(content),
        updatedAt: this.now().toISOString(),
      });
    });
  }

  /** Deletes the block and all its descendants. */
  deleteBlock(id: BlockId): Promise<void> {
    return this.write(async () => {
      const descendants = await this.blocks.getDescendants(id);
      await this.blocks.bulkDelete([id, ...descendants.map((b) => b.id)]);
    });
  }

  private async write<T>(operation: () => Promise<T>): Promise<T> {
    try {
      assertStorageAvailable();
      return await this.db.transaction('rw', this.db.blocks, operation);
    } catch (error) {
      const storageError = toStorageError(error);
      // Only storage failures raise the banner; programming errors are rethrown as-is.
      if (error instanceof StorageError || storageError.kind !== 'unknown') {
        this.listeners.forEach((listener) => listener(storageError));
        throw storageError;
      }
      throw error;
    }
  }
}

export const blockService = new BlockService(defaultDb);
