# MVP Scope: Personal Daily Journal & Tasks

| | |
|---|---|
| **Version** | v2 |
| **Date** | 2026-09-27 |
| **Status** | Draft for review |
| **Owner** | Juan Carlos Badillo |

---

## 1. Product summary

A single-user journal for desktop browsers, in the style of Logseq. Each day has its own journal page. On that page you write notes as nested blocks (an outline), tag them, and can turn any note into a task. All data is stored locally in the browser. There are no accounts and no backend.

## 2. Target user

One person who wants to capture thoughts and to-dos in the same daily flow, without setting up or syncing a separate task manager.

## 3. In scope

### 3.1 Daily journal
- Today's journal page opens automatically when the app starts.
- You can move to previous and next days, jump to a date with a date picker, or jump back to today.
- Each page is an outline of note blocks.

### 3.2 Notes (blocks)
- Create, edit, delete and reorder notes on a day's page.
- Basic Markdown: bold, italic, links and inline code.
- Each note is saved with its creation date and last-edited date.

### 3.3 Nested blocks and indentation
- `Tab` indents a block under the one above it, and `Shift+Tab` moves it back out, with no fixed depth limit.
- Blocks with children can be collapsed and expanded, and that state is remembered.
- Moving, reordering or deleting a parent block does the same to all its children. Deleting a parent asks for confirmation when it has children.
- In search results, the tag page and the task list, a nested block is shown with its parent path (breadcrumb) for context.
- Tags and task states belong to the block they're on. Children do not inherit them.

### 3.4 Tags
- Add tags inline with `#tag` syntax.
- Each tag has a page listing every note and task that uses it, across all days.
- A tag list shows every tag and how often it's used.

### 3.5 Tasks
- Any note can be marked as a task, and a task can be turned back into a plain note.
- Task states: `TODO` → `DOING` → `DONE`. Clicking the state marker, or a keyboard shortcut, moves to the next state.
- A task list view shows open (`TODO` and `DOING`) tasks from all days. It groups them by state and can filter by state and tag.

### 3.6 Reminders
- You can set a date and time reminder on a task.
- When it's due, the app shows a browser notification, with an in-app banner if notification permission is denied.
- Overdue reminders show up the next time the app is opened.
- Reminders on `DONE` tasks are ignored.

### 3.7 Search
- Full-text search across all notes and tasks.
- Filters by tag, by type (note or task), by task state and by date range.
- Clicking a result opens the day's page, expands the parent blocks as needed, and highlights the block.

### 3.8 Export
- Export everything as **Markdown**, with one file per day inside a single `.zip`. Nesting is kept as indented bullet lists, and task states are written as `TODO`, `DOING` and `DONE` markers.
- Export everything as **JSON**, which works as a full backup of blocks, hierarchy, tags, states, reminders and UI state.

### 3.9 Restore from JSON
- You can import a JSON backup made by the app.
- The file is checked against the backup format version before anything is changed. An invalid file is rejected with a clear error.
- Restoring replaces all current data. The app shows a confirmation first and suggests exporting the current data.
- The restore is all or nothing: if it fails partway, the existing data is left unchanged.

### 3.10 Local persistence
- Data is stored in the browser with IndexedDB and saved automatically on every change.
- Data survives page reloads and closing the browser.

## 4. Out of scope for the MVP

- Accounts, authentication, multi-user use and sharing
- Cloud sync and use across several devices
- Mobile or responsive layouts, and offline PWA install
- Block references and backlinks
- Merging data on restore (restore always replaces), and importing Markdown or files from other tools such as Logseq
- Priorities, due dates on their own (without a reminder), recurring tasks and task states beyond `TODO`, `DOING` and `DONE`
- Attachments and images
- Themes and advanced settings

## 5. Key constraints and assumptions

- **Reminders only fire while the app is open.** With no backend or service worker push, a browser can't send notifications while the tab is closed. Opening the app afterwards shows any overdue reminders.
- **Data is tied to one browser profile.** Clearing site data deletes everything. JSON export and restore is the backup and recovery path.
- **The backup format has a version number,** so later versions of the app can still read older backups.
- **The app is keyboard-first.** Outline editing (Enter, Tab, Shift+Tab, collapse, state toggle) must work without a mouse.
- **Supported browsers:** current versions of Chrome, Edge, Firefox and Safari on desktop.
- **Scale:** it should stay fast with up to about 10,000 blocks and nesting up to 10 levels deep.

## 6. Success criteria

- You capture notes and tasks every day for 2 or more weeks without going back to another tool.
- Search results appear in under 200 ms.
- No data is lost across browser restarts.
- Exporting to JSON and restoring it produces data identical to the original, including hierarchy, states and reminders.

## 7. Decision log

| # | Decision | Outcome |
|---|---|---|
| 1 | Single-user or collaborative | Single-user, personal tool |
| 2 | Data model | Logseq-style daily journal; notes can be tagged and marked as tasks |
| 3 | Platform | Desktop browser only |
| 4 | Persistence | Local, in the browser |
| 5 | Day-one features | Reminders, search, tags and export |
| 6 | Restore from JSON | Included in the MVP |
| 7 | Nested blocks and indentation | Included in the MVP |
| 8 | `DOING` task state | Included in the MVP |
