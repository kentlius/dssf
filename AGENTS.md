<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project: disney-store-stock-finder

Next.js 16 App Router + TypeScript (strict) + Tailwind v4 + zod + vitest.
Docs: `node_modules/next/dist/docs/` (version-matched, per the block above).

- Upstream scraping lives in `lib/disney.ts` — framework-free by design
  (no `next/*` imports) so it stays unit-testable under plain vitest.
  Run `pnpm test` after touching it; fixtures are inline in `lib/disney.test.ts`.
- Server config is env-driven with zod defaults in `lib/config.ts`
  (see `.env.example`). Never leak upstream URLs/statuses into API errors —
  `DisneyApiError` messages are user-facing.
- `app/api/check/route.ts` is `force-dynamic` + `runtime: "nodejs"` on
  purpose: every request must hit the read-through cache logic in lib,
  never the edge/prerender cache. The in-memory cache + rate limiter are
  per-instance (fine for single-instance; see `docs` self-hosting guide
  before scaling out).
- UI is client-driven (`components/stock-finder.tsx` boundary) because of
  filters and share-URL state; keep the page shell static. No watch mode,
  no area presets, no hardcoded example products — store stock is a daily
  09:00 JST snapshot, so the UI stays stateless and general-purpose.
- Verify with `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
  For runtime checks use a running dev server (`.next/dev/lock`) and curl
  `/api/check?sku=4550586333055`.
