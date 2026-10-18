import { toStorageError, type StorageError } from '@/db/errors';
import { useUiStore } from '@/shared/store/ui-store';

export function storageErrorMessage(error: StorageError): string {
  const reason =
    error.kind === 'quota-exceeded'
      ? 'Your browser storage is full. Free up space, then reload the page.'
      : error.kind === 'unavailable'
        ? 'Browser storage is unavailable (for example in some private windows or when site data is blocked).'
        : 'Your browser refused to store the latest change.';
  return `Changes are not being saved. ${reason}`;
}

/** Shows the persistent "not saving" banner (US-01). */
export function reportStorageError(error: unknown): void {
  useUiStore.getState().setStorageError(storageErrorMessage(toStorageError(error)));
}
