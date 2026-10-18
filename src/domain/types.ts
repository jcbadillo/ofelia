// Entities and value objects (Tech Spec §2).

export type BlockId = string;
/** Calendar day in the user's local time zone, `YYYY-MM-DD`. */
export type LocalDate = string;
/** ISO 8601 timestamp with offset or `Z`. */
export type IsoDateTime = string;
export type TaskState = 'TODO' | 'DOING' | 'DONE';
/** Fractional index key, compared lexicographically. */
export type OrderKey = string;
/** Lowercase tag name matching `[\p{L}\p{N}_-]+`. */
export type TagName = string;

export interface TaskInfo {
  state: TaskState;
  stateChangedAt: IsoDateTime;
}

export interface Reminder {
  remindAt: IsoDateTime;
  firedAt: IsoDateTime | null;
  dismissedAt: IsoDateTime | null;
}

export interface Block {
  id: BlockId;
  pageDate: LocalDate;
  parentId: BlockId | null;
  order: OrderKey;
  content: string;
  tags: TagName[];
  task: TaskInfo | null;
  reminder: Reminder | null;
  collapsed: boolean;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface MetaValues {
  schemaVersion: number;
  lastOpenedAt: IsoDateTime;
}

export type MetaKey = keyof MetaValues;
export type MetaValue<K extends MetaKey> = MetaValues[K];
export type MetaEntry = { [K in MetaKey]: { key: K; value: MetaValues[K] } }[MetaKey];
