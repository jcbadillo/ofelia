import { create } from 'zustand';

/** Ephemeral UI state, never persisted (Tech Spec §4.4). Fields are added by the stories that need them. */
interface UiState {
  storageError: string | null;
  setStorageError: (message: string | null) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  storageError: null,
  setStorageError: (storageError) => set({ storageError }),
}));
