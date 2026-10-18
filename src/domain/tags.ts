import type { TagName } from './types';

const TAG_PATTERN = /(?:^|[^\p{L}\p{N}_&#-])#([\p{L}\p{N}_-]+)/gu;

export function normalizeTag(raw: string): TagName {
  return raw.toLowerCase();
}

/** Unique, lowercase tags in order of first appearance (invariant 4, Tech Spec §2.2). */
export function parseTags(content: string): TagName[] {
  const tags = new Set<TagName>();
  for (const match of content.matchAll(TAG_PATTERN)) {
    const name = match[1];
    if (name) tags.add(normalizeTag(name));
  }
  return [...tags];
}
