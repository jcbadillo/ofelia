# Ofelia

Personal daily journal & tasks — client-only Next.js static export (see [`documentation/Technical-Specification.md`](documentation/Technical-Specification.md)).

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run build` | Static export to `out/` |
| `npm start` | Serve `out/` on http://localhost:3000 |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm test` | Vitest unit/component tests |
| `npm run e2e` | Playwright (builds and serves `out/`) |

Docker: `docker build -t ofelia .` then `docker run --rm -p 8080:8080 ofelia` → http://localhost:8080 (health: `/healthz`).
