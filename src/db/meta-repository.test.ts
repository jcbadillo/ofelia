import { OfeliaDatabase, SCHEMA_VERSION } from './database';
import { MetaRepository } from './meta-repository';

describe('MetaRepository', () => {
  let db: OfeliaDatabase;
  let repository: MetaRepository;

  beforeEach(() => {
    db = new OfeliaDatabase(`test-${crypto.randomUUID()}`);
    repository = new MetaRepository(db);
  });

  afterEach(async () => {
    await db.delete();
  });

  it('stores the schema version when the database is created', async () => {
    expect(await repository.get('schemaVersion')).toBe(SCHEMA_VERSION);
  });

  it('sets, overwrites and reads entries', async () => {
    await repository.set('lastOpenedAt', '2026-09-27T10:00:00.000Z');
    await repository.set('lastOpenedAt', '2026-09-28T08:00:00.000Z');

    expect(await repository.get('lastOpenedAt')).toBe('2026-09-28T08:00:00.000Z');
    expect(await repository.getAll()).toEqual(
      expect.arrayContaining([
        { key: 'schemaVersion', value: SCHEMA_VERSION },
        { key: 'lastOpenedAt', value: '2026-09-28T08:00:00.000Z' },
      ]),
    );
  });

  it('returns undefined for a missing key', async () => {
    expect(await repository.get('lastOpenedAt')).toBeUndefined();
  });
});
