# Product Backlog: Personal Daily Journal & Tasks (MVP)

| | |
|---|---|
| **Version** | v1 |
| **Date** | 2026-09-27 |
| **Source** | [MVP-Scope.md](MVP-Scope.md) (v2) |
| **Team** | 1 developer |
| **Estimation** | Story points (Fibonacci). Planning velocity: ~15 points per 1-week iteration |
| **Total** | 8 epics · 25 stories · 76 points · 5 iterations |

---

## Epic overview

| Epic | Name | Stories | Points | Iteration |
|---|---|---|---|---|
| E1 | Foundation & Persistence | US-01 – US-02 | 6 | 1 |
| E2 | Daily Journal | US-03 – US-04 | 5 | 1 |
| E3 | Blocks & Outline | US-05 – US-10 | 17 | 1–2 |
| E4 | Tags | US-11 – US-13 | 8 | 3 |
| E5 | Tasks | US-14 – US-16 | 9 | 2–3 |
| E6 | Reminders | US-17 – US-19 | 11 | 5 |
| E7 | Search | US-20 – US-22 | 10 | 4 |
| E8 | Export & Restore | US-23 – US-25 | 10 | 3–5 |

---

## E1 · Foundation & Persistence

### US-01 · Automatic local saving — 3 pts
**As a** user, **I want to** have every change saved automatically in my browser, **so that** I never lose my notes and never have to remember to save.

**Acceptance criteria**
- Any change (create, edit, move, delete, state change) is saved to IndexedDB within 1 second, with no save action needed.
- After a page reload or a browser restart, the journal shows exactly the content it had before.
- If browser storage is unavailable or full, a visible error banner explains that changes are not being saved.

### US-02 · Versioned data schema — 3 pts
**As a** developer, **I want to** define a versioned data schema for blocks (id, parent, order, content, tags, task state, reminder, collapsed, timestamps), **so that** export, restore and future migrations are reliable.

**Acceptance criteria**
- The schema version is stored with the data and written into every JSON export.
- On startup, a migration hook runs when the stored version is older than the app's version.
- Unit tests cover create, read, update and delete for blocks, including parent/child relationships.

---

## E2 · Daily Journal

### US-03 · Open today's journal on launch — 2 pts
**As a** user, **I want to** land on today's journal page when I open the app, **so that** I can start writing immediately.

**Acceptance criteria**
- The app opens on today's date, based on the local time zone.
- If today's page has no content, it shows one empty block with the cursor ready to type.
- The page title shows the date in a readable format (e.g. "Sunday, 27 Sep 2026").

### US-04 · Navigate between days — 3 pts
**As a** user, **I want to** move between days and jump to any date, **so that** I can review and edit past entries.

**Acceptance criteria**
- Previous/next buttons and keyboard shortcuts move one day back or forward.
- A "Today" button returns to the current day from any page.
- A date picker jumps to any date, and highlights the days that have content.

---

## E3 · Blocks & Outline

### US-05 · Create and edit blocks — 3 pts
**As a** user, **I want to** write notes as separate blocks using the keyboard, **so that** I can capture ideas quickly.

**Acceptance criteria**
- `Enter` creates a new block below the current one and moves the cursor into it.
- `Backspace` in an empty block deletes it and moves the cursor to the end of the previous block.
- Each block stores its creation and last-edited timestamps.

### US-06 · Basic Markdown formatting — 2 pts
**As a** user, **I want to** use basic Markdown in my notes, **so that** I can add emphasis, links and code.

**Acceptance criteria**
- Bold, italic, links and inline code are rendered when the block is not being edited.
- While editing, the block shows the raw Markdown text.
- Links open in a new browser tab.

### US-07 · Indent and outdent blocks — 5 pts
**As a** user, **I want to** nest blocks under other blocks with `Tab` and `Shift+Tab`, **so that** I can structure my notes as an outline.

**Acceptance criteria**
- `Tab` makes the block a child of the block above it. Nothing happens on the first block of a page.
- `Shift+Tab` moves the block one level up, and its own children move with it.
- The hierarchy is saved and stays responsive with nesting at least 10 levels deep.

### US-08 · Collapse and expand blocks — 2 pts
**As a** user, **I want to** collapse and expand blocks that have children, **so that** I can hide detail and focus on the big picture.

**Acceptance criteria**
- A toggle appears only on blocks that have children.
- Collapsed/expanded state is saved across reloads.
- A collapsed block shows how many children it hides.

### US-09 · Reorder blocks with their children — 3 pts
**As a** user, **I want to** move a block up or down, **so that** I can reorganise my notes without retyping them.

**Acceptance criteria**
- A keyboard shortcut (e.g. `Alt+Shift+↑/↓`) moves the block up or down among its siblings.
- All children move together with their parent.
- The new order is saved immediately.

### US-10 · Delete a block and its children — 2 pts
**As a** user, **I want to** delete a block safely, **so that** I remove what I no longer need without losing content by accident.

**Acceptance criteria**
- A block with no children is deleted immediately.
- A block with children asks for confirmation first and shows how many blocks will be removed.
- On confirmation, the block and all its descendants are deleted and the change is saved.

---

## E4 · Tags

### US-11 · Add tags inline — 3 pts
**As a** user, **I want to** tag a block by typing `#tag`, **so that** I can group related notes across days.

**Acceptance criteria**
- `#tag` text is recognised when the block is saved and shown as a clickable chip.
- Tags may contain letters, numbers, `-` and `_`.
- Tags are case-insensitive (`#Work` and `#work` are the same tag).

### US-12 · Tag page — 3 pts
**As a** user, **I want to** open a page for a tag, **so that** I can see every note and task that uses it.

**Acceptance criteria**
- Clicking a tag chip opens a page with all blocks that have the tag, grouped by day, newest first.
- Each result shows its parent path (breadcrumb) for context.
- Clicking a result opens the day and focuses that block.

### US-13 · Tag list — 2 pts
**As a** user, **I want to** see all my tags and how often I use them, **so that** I can browse my topics.

**Acceptance criteria**
- The list shows every tag with its number of uses.
- Tags are sorted by number of uses, then alphabetically.
- A tag that is no longer used anywhere is removed from the list.

---

## E5 · Tasks

### US-14 · Turn a note into a task and back — 2 pts
**As a** user, **I want to** mark any note as a task, and turn it back into a note, **so that** I can capture to-dos in the same flow as my notes.

**Acceptance criteria**
- A keyboard shortcut (e.g. `Ctrl+Enter`) or a menu action turns a note into a `TODO` task.
- Turning a task back into a note removes its state and keeps its content and tags.
- Only the selected block changes. Its children are not affected.

### US-15 · Move a task through its states — 2 pts
**As a** user, **I want to** move a task through `TODO`, `DOING` and `DONE`, **so that** I can track progress on my work.

**Acceptance criteria**
- Clicking the state marker, or the shortcut, cycles `TODO` → `DOING` → `DONE` → `TODO`.
- Each state has its own look, and `DONE` tasks are struck through.
- Each state change is saved with a timestamp.

### US-16 · Task list view — 5 pts
**As a** user, **I want to** see all my open tasks from every day in one place, **so that** nothing gets forgotten in old journal pages.

**Acceptance criteria**
- The view shows all `TODO` and `DOING` tasks from every day, grouped by state.
- It can be filtered by state and by tag.
- Each task shows its date and breadcrumb, and its state can be changed directly from the list.

---

## E6 · Reminders

### US-17 · Set a reminder on a task — 3 pts
**As a** user, **I want to** set a date and time reminder on a task, **so that** I'm prompted to act on it at the right moment.

**Acceptance criteria**
- A task can get a reminder through a date-time picker.
- Tasks with a reminder show an indicator with the reminder time.
- A reminder can be edited or removed.

### US-18 · Get a notification when a reminder is due — 5 pts
**As a** user, **I want to** be notified when a reminder is due, **so that** I don't miss time-sensitive tasks.

**Acceptance criteria**
- While the app is open, a browser notification appears within 1 minute of the due time, and clicking it focuses the task.
- If notification permission is denied, an in-app banner is shown instead.
- Reminders on `DONE` tasks never fire.

### US-19 · See missed reminders on launch — 3 pts
**As a** user, **I want to** see reminders that came due while the app was closed, **so that** I can catch up on them.

**Acceptance criteria**
- On launch, the app lists every reminder that came due since it was last open.
- Each entry links to its task.
- From the list, each reminder can be dismissed or its task marked `DONE`.

---

## E7 · Search

### US-20 · Full-text search — 5 pts
**As a** user, **I want to** search all my notes and tasks by text, **so that** I can find anything I've written.

**Acceptance criteria**
- A shortcut (e.g. `Ctrl+K`) opens search from anywhere in the app.
- Results update as I type and appear in under 200 ms with 10,000 blocks.
- Each result highlights the matching text and shows its date and breadcrumb.

### US-21 · Search filters — 3 pts
**As a** user, **I want to** filter search results, **so that** I can narrow down what I'm looking for.

**Acceptance criteria**
- Results can be filtered by tag, type (note or task), task state and date range.
- Filters can be combined.
- One action clears all filters.

### US-22 · Jump to a search result — 2 pts
**As a** user, **I want to** open a search result in its original context, **so that** I can see the notes around it.

**Acceptance criteria**
- Selecting a result opens the day page where the block lives.
- Any collapsed parent blocks are expanded so the block is visible.
- The block is scrolled into view and briefly highlighted.

---

## E8 · Export & Restore

### US-23 · Export to Markdown — 3 pts
**As a** user, **I want to** export my journal as Markdown files, **so that** I can read my data in other tools.

**Acceptance criteria**
- The export is a single `.zip` with one file per day that has content, named `YYYY-MM-DD.md`.
- Nesting is written as indented bullet lists.
- Task states are written as `TODO`, `DOING` and `DONE` markers, and tags as `#tag`.

### US-24 · Export a JSON backup — 2 pts
**As a** user, **I want to** export all my data as a JSON file, **so that** I have a complete backup.

**Acceptance criteria**
- The file contains all blocks, hierarchy, tags, task states, reminders, collapsed state and the schema version.
- The file name includes the export date and time.
- Exporting and then restoring the file gives data identical to the original.

### US-25 · Restore from a JSON backup — 5 pts
**As a** user, **I want to** restore my data from a JSON backup, **so that** I can recover after losing browser data or moving to another browser.

**Acceptance criteria**
- The file is checked for format and schema version before anything changes. An invalid file shows a clear error and leaves data untouched.
- The app warns that restoring replaces all current data and offers to export the current data first.
- The restore is all or nothing: if it fails partway, the existing data stays unchanged.

---

## Iteration plan

| Iteration | Goal | Stories | Points |
|---|---|---|---|
| 1 | A working daily journal that saves locally | US-01, US-02, US-03, US-04, US-05, US-06 | 16 |
| 2 | Full outline editing and basic tasks | US-07, US-08, US-09, US-10, US-14, US-15 | 16 |
| 3 | Tags, task overview and a first backup | US-11, US-12, US-13, US-16, US-24 | 15 |
| 4 | Find anything, and recover from a backup | US-20, US-21, US-22, US-25 | 15 |
| 5 | Reminders and Markdown export: MVP complete | US-17, US-18, US-19, US-23 | 14 |

JSON export (US-24) comes in iteration 3 so the developer can back up real data while using the app daily.

## Definition of Done

- All acceptance criteria are met and checked by hand in Chrome, plus one other supported browser.
- Data-layer logic (blocks, hierarchy, tags, states, export/restore) has unit tests.
- Every new interaction can be done with the keyboard.
- No console errors, and no data loss after a reload.
