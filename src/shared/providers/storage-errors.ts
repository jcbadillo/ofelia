import { toStorageError, type StorageError } from '@/db/errors';
import { useUiStore } from '@/shared/store/ui-store';

export function storageErrorMessage(error: StorageError): string {
  if (error.kind === 'migration-failed') {
    return 'Your data could not be upgraded to this version of Ofelia. Nothing was changed. Reload the page to try again.';
  }
  if (error.kind === 'newer-version') {
    return 'This data was saved by a newer version of Ofelia, so changes are not being saved. Reload the page to use it.';
  }
  const reason =
    error.kind === 'quota-exceeded'
      ? 'Your browser storage is full. Free up space, then reload the page.'
      : error.kind === 'unavailable'
        ? 'Browser storage is unavailable (for example in some private windows or when site data is blocked).'
        : 'Your browser refused to store the latest change.';
  return `Changes are not being saved. ${reason}`;
}

/** Shows the persistent "not saving" banner (US-01). Version problems take precedence (US-02). */
export function reportStorageError(error: unknown): void {
  const storageError = toStorageError(error);
  const blocking = storageError.kind === 'migration-failed' || storageError.kind === 'newer-version';
  useUiStore.getState().setStorageError(storageErrorMessage(storageError), { blocking });
}
