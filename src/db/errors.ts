export type StorageErrorKind = 'quota-exceeded' | 'unavailable' | 'unknown';

/** Every failed persistence call rejects with this error (Tech Spec §4). */
export class StorageError extends Error {
  readonly kind: StorageErrorKind;

  constructor(kind: StorageErrorKind, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'StorageError';
    this.kind = kind;
  }
}

function errorName(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const { name, inner } = error as { name?: unknown; inner?: unknown };
  // Dexie wraps native DOMExceptions in `inner`.
  return errorName(inner) ?? (typeof name === 'string' ? name : undefined);
}

export function toStorageError(error: unknown): StorageError {
  if (error instanceof StorageError) return error;
  const name = errorName(error);
  if (name === 'QuotaExceededError') {
    return new StorageError('quota-exceeded', 'Browser storage is full.', { cause: error });
  }
  if (
    name === 'InvalidStateError' ||
    name === 'DatabaseClosedError' ||
    name === 'MissingAPIError' ||
    name === 'OpenFailedError' ||
    name === 'UnknownError'
  ) {
    return new StorageError('unavailable', 'Browser storage is unavailable.', { cause: error });
  }
  return new StorageError('unknown', 'Writing to browser storage failed.', { cause: error });
}

/**
 * Fails fast when the browser exposes no IndexedDB. Dexie's Safari workaround would otherwise
 * throw an uncaught TypeError outside its promise chain.
 */
export function assertStorageAvailable(): void {
  if (typeof indexedDB === 'undefined' || indexedDB === null) {
    throw new StorageError('unavailable', 'Browser storage is unavailable.');
  }
}

export async function withStorageErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    assertStorageAvailable();
    return await operation();
  } catch (error) {
    throw toStorageError(error);
  }
}
