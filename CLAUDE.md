# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Source of truth

Ofelia is a single-user, Logseq-style daily journal & tasks app for desktop browsers. The specs in `documentation/` drive all work — read the relevant parts before implementing a story:

- `documentation/Technical-Specification.md` — architecture, data model and `Block` invariants (§2.2), internal interfaces (§4), keyboard map (§4.5), NFRs (§5), testing strategy (§6), **§7 Rules for AI coding agents**.
- `documentation/Product-Backlog.md` — user stories US-01 … US-25 with acceptance criteria, and the Definition of Done.
- `documentation/MVP-Scope.md` — scope; anything in §4 "Out of scope" (accounts, sync, mobile layouts, backlinks, priorities, recurring tasks, extra task states…) must not be built.

Code comments reference these as `Tech Spec §x.y` and `US-xx`; keep doing so. Commits follow `feat(scope): summary (US-xx)`.

## Commands

Node ≥ 22 (`.nvmrc`: 24).

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run build` | Static export to `out/` |
| `npm start` | Serve `out/` on port 3000 |
| `npm run lint` / `npm run typecheck` | ESLint / `tsc --noEmit` |
| `npm test` | Vitest (jsdom, `src/**/*.test.{ts,tsx}`) |
| `npx vitest run src/db/migrations.test.ts -t "name"` | Single test file / test |
| `npm run e2e` | Playwright on Chromium, Firefox, WebKit; builds and serves `out/` first (reuses a running server locally) |
| `npx playwright test e2e/smoke.spec.ts --project=chromium` | Single e2e spec, one browser |

Docker: `docker build -t ofelia .` then `docker run --rm -p 8080:8080 ofelia` (unprivileged nginx, health at `/healthz`).

## Architecture

**Client-only Next.js 16 static export** (`output: 'export'`, `trailingSlash: true`) with React 19. No backend, no HTTP requests, no server-only features (route handlers, server actions, `cookies()`, dynamic SSR). Dynamic values go in query params (`/?date=YYYY-MM-DD`), never dynamic segments; screens using `useSearchParams()` must be wrapped in `<Suspense>`. Feature screens are Client Components; `src/app/` pages are thin wrappers that render a feature screen.

**IndexedDB (Dexie 4) is the single source of truth** — no duplicated client cache. Reads use `useLiveQuery` hooks; writes go through domain commands.

**Layer rule:** `app → features → (services, domain, db, shared)`.
- `src/domain/` — pure TypeScript (types, tags, dates, backup Zod schema, `SCHEMA_VERSION`). ESLint blocks imports of other layers, React, Next and Dexie here.
- `src/db/` — `OfeliaDatabase` (Dexie), repositories, migration chain, typed `StorageError`.
- `src/services/` — `BlockService`: every command runs in one Dexie transaction and preserves the `Block` invariants (parent exists on the same `pageDate`, no cycles, unique sibling order, `tags === parseTags(content)`, reminder null when task null). Components never call Dexie directly except via read hooks.
- `src/features/<name>/` — components (with colocated CSS Modules) and hooks; other features import them only through `index.ts`.
- `src/shared/` — `AppProviders` (opens the DB, runs migrations, shows the storage-error banner and "upgrading" gate), Zustand `ui-store` (ephemeral UI state only, never persisted), generic hooks and UI.

**Key mechanics:**
- Sibling order uses `fractional-indexing` keys (`order: string`) — inserting/moving writes one row.
- Only `Block.tags` may be stored as derived data; tag lists, breadcrumbs and day summaries are computed.
- Saving: content edits debounced (~300 ms, `useAutosave`), structural ops immediate, everything persisted within 1 s. Failed writes surface as `StorageError` → `reportStorageError` → persistent banner.
- An empty day shows an unsaved placeholder block that is persisted only once the user types.
- Schema changes: bump `SCHEMA_VERSION`, append a `Migration` to `MIGRATIONS` in `src/db/migrations.ts` (contiguous versions; `assertMigrationChain` checks it), add a `migrateBackup()` step, and test both. Data with a newer version than the app is rejected.
- Inline Markdown is rendered by an in-house tokenizer to React elements — never `dangerouslySetInnerHTML`. Links: `http(s)`/`mailto` only, `target="_blank" rel="noopener noreferrer"`.

## Conventions

- TypeScript `strict`, no `any` (lint error), discriminated unions for UI states/results. Import via the `@/` alias (`src/`).
- Every interaction has a keyboard path and an accessible name; the outline uses `role="tree"`/`treeitem` with `aria-level`/`aria-expanded`; confirmations use `<dialog>`.
- Styles in CSS Modules next to the component; `globals.css` only for design tokens and resets.
- Code, identifiers, comments and test names in English.

## Testing

- `src/test/setup.ts` loads `fake-indexeddb/auto`, so DB integration tests run in Vitest. `OfeliaDatabase(name, migrations)` and `BlockService(db, now)` take injectable dependencies — use a unique DB name per test and a fixed clock.
- Build fixtures with `src/test/factories.ts` (`buildBlock`, `buildSiblings`, `buildChain`).
- Levels (Tech Spec §6): domain unit tests, `fake-indexeddb` integration for repositories/services, RTL + `user-event` for components, one Playwright spec per epic. Story acceptance tests are named `us-xx-acceptance`.
- Use the `code-reviewer` subagent (`.claude/agents/code-reviewer.md`) after implementing a story.
