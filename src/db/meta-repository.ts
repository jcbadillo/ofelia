import type { MetaEntry, MetaKey, MetaValue } from '@/domain/types';
import type { OfeliaDatabase } from './database';
import { withStorageErrors } from './errors';

export class MetaRepository {
  constructor(private readonly db: OfeliaDatabase) {}

  get<K extends MetaKey>(key: K): Promise<MetaValue<K> | undefined> {
    return withStorageErrors(async () => {
      const entry = await this.db.meta.get(key);
      return entry?.value as MetaValue<K> | undefined;
    });
  }

  set<K extends MetaKey>(key: K, value: MetaValue<K>): Promise<void> {
    return withStorageErrors(async () => {
      await this.db.meta.put({ key, value } as MetaEntry);
    });
  }

  getAll(): Promise<MetaEntry[]> {
    return withStorageErrors(() => this.db.meta.toArray());
  }
}
