import { generateKeyBetween } from 'fractional-indexing';
import type { Block } from '@/domain/types';

export const TEST_DAY = '2026-09-27';
export const TEST_TIME = '2026-09-27T10:00:00.000Z';

/** A valid plain note with fixed timestamps; override any field. */
export function buildBlock(overrides: Partial<Block> = {}): Block {
  return {
    id: crypto.randomUUID(),
    pageDate: TEST_DAY,
    parentId: null,
    order: 'a0',
    content: '',
    tags: [],
    task: null,
    reminder: null,
    collapsed: false,
    createdAt: TEST_TIME,
    updatedAt: TEST_TIME,
    ...overrides,
  };
}

/** Sibling blocks under one parent, in order. */
export function buildSiblings(count: number, overrides: Partial<Block> = {}): Block[] {
  let order: string | null = null;
  return Array.from({ length: count }, (_, index) => {
    order = generateKeyBetween(order, null);
    return buildBlock({ content: `block ${index + 1}`, order, ...overrides });
  });
}

/** A chain where each block is the only child of the previous one; `chain[0]` is top-level. */
export function buildChain(depth: number, overrides: Partial<Block> = {}): Block[] {
  const chain: Block[] = [];
  for (let level = 0; level < depth; level++) {
    chain.push(buildBlock({ content: `level ${level + 1}`, parentId: chain.at(-1)?.id ?? null, ...overrides }));
  }
  return chain;
}
