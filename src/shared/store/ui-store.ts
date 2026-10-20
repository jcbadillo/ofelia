import { create } from 'zustand';

/** Lifecycle of the IndexedDB connection; children render once it is `ready` or `failed` (US-02). */
export type DbStatus = 'opening' | 'upgrading' | 'ready' | 'failed';

/** Ephemeral UI state, never persisted (Tech Spec §4.4). Fields are added by the stories that need them. */
interface UiState {
  storageError: string | null;
  /** A blocking error (failed migration, newer data) is not replaced by the follow-up errors it causes. */
  storageErrorBlocking: boolean;
  dbStatus: DbStatus;
  setStorageError: (message: string | null, options?: { blocking?: boolean }) => void;
  setDbStatus: (status: DbStatus) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  storageError: null,
  storageErrorBlocking: false,
  dbStatus: 'opening',
  setStorageError: (storageError, options) =>
    set((state) =>
      state.storageErrorBlocking && storageError !== null && !options?.blocking
        ? state
        : { storageError, storageErrorBlocking: storageError !== null && (options?.blocking ?? false) },
    ),
  setDbStatus: (dbStatus) => set({ dbStatus }),
}));
