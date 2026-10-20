import { Dexie, type EntityTable } from 'dexie';
import { SCHEMA_VERSION } from '@/domain/schema-version';
import type { Block, MetaEntry } from '@/domain/types';
import { StorageError } from './errors';
import { latestVersion, MIGRATIONS, V1_STORES, type Migration } from './migrations';

export { SCHEMA_VERSION };

export const DB_NAME = 'ofelia';

type Listener = () => void;

export class OfeliaDatabase extends Dexie {
  blocks!: EntityTable<Block, 'id'>;
  meta!: EntityTable<MetaEntry, 'key'>;
  /** Version the stored data has once the database is open. */
  readonly schemaVersion: number;

  private readonly upgradeListeners = new Set<Listener>();
  private readonly versionChangeListeners = new Set<Listener>();

  /** `migrations` defaults to the production chain; tests inject their own. */
  constructor(name: string = DB_NAME, migrations: readonly Migration[] = MIGRATIONS) {
    super(name);
    this.schemaVersion = latestVersion(migrations);

    this.version(1).stores(V1_STORES);
    let upgradeStarted = false;
    for (const migration of migrations) {
      this.version(migration.version)
        .stores(migration.stores ?? {})
        .upgrade(async (tx) => {
          if (!upgradeStarted) {
            upgradeStarted = true;
            this.upgradeListeners.forEach((listener) => listener());
          }
          try {
            await migration.upgrade(tx);
          } catch (cause) {
            // Dexie rejects open() with the raw error; type it so the UI can explain what happened.
            throw new StorageError('migration-failed', `Migration to version ${migration.version} failed.`, { cause });
          }
          // Same transaction as the data change: version and data always match.
          await tx.table('meta').put({ key: 'schemaVersion', value: migration.version } satisfies MetaEntry);
        });
    }

    // Dexie runs no upgrades on a fresh database, so it starts at the latest version.
    this.on('populate', (tx) => {
      void tx.table('meta').add({ key: 'schemaVersion', value: this.schemaVersion } satisfies MetaEntry);
    });
    // Dexie opens a database with a higher version without complaint, so compare the data version ourselves.
    this.on('ready', async () => {
      const stored = await this.meta.get('schemaVersion');
      if (stored?.key === 'schemaVersion' && stored.value > this.schemaVersion) {
        throw new StorageError(
          'newer-version',
          `Stored data has schema version ${stored.value}; this app supports up to ${this.schemaVersion}.`,
        );
      }
    });
    // Another tab opened a newer version: let it upgrade instead of blocking it.
    this.on('versionchange', () => {
      this.close();
      this.versionChangeListeners.forEach((listener) => listener());
      return false;
    });
  }

  /** Notified once when an existing database starts running migrations (US-02). */
  onUpgradeStart(listener: Listener): () => void {
    this.upgradeListeners.add(listener);
    return () => this.upgradeListeners.delete(listener);
  }

  /** Notified when another tab upgraded the database and this connection was closed. */
  onVersionChange(listener: Listener): () => void {
    this.versionChangeListeners.add(listener);
    return () => this.versionChangeListeners.delete(listener);
  }
}

export const db = new OfeliaDatabase();
