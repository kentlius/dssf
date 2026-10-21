# 🏰 Disney Store Stock Finder (Disney Store Japan In-Store Stock Checker)

Paste a product URL or JAN — it does what **the official page won't**.

Built on **Next.js 16 (App Router) + TypeScript + Tailwind + zod**, per the
[official docs](https://nextjs.org/docs) (`create-next-app` defaults, Route
Handlers, self-hosting guide). See `AGENTS.md` for agent-facing notes.

## Why this exists

Digging into the sample `https://store.disney.co.jp/goods/4550586333055.html` (FAIRY POOH) revealed:

| Official page | This tool |
|---|---|
| The in-store stock button is hidden entirely (`data-is-find-in-store="false"`). You learn nothing | Calls the internal API (`Product-FindInStore`) directly to **show stock for every hidden store** |
| Can't tell sold out from unknown | **Proves "no store has it"** (all stores empty → definitely sold out). No guessing |
| Product details are split across tabs (description, size, material, shipping…) | **The essentials on one screen**: images, size/material/weight/age range, release date, rating ★, favorites count |
| Online stock and store stock are separate | Both in one view (online ATS + every store's status) |
| The store list only exists in a modal, with no filtering | Filter by region, store name, or status; copy results and share a link |
| Japanese only | **Japanese/English toggle** |
| Store stock is daily data refreshed at 09:00 JST | The UI assumes the same: fetch fresh on open, no watch mode |

Real examples (works for any product — just paste a URL or JAN):

| SKU | Online | Stores |
|---|---|---|
| `4550586333697` | In stock (ATS 198) | 4 stores in stock + 23 by enquiry |
| `4550586333055` | Out of stock (ATS 0) | None of the 45 stores |

## Development

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## Deploy

- **Vercel (recommended)**: just import the repository (zero-config).
  pnpm 9/10 is selected automatically from the lockfileVersion (9.0).
  Environment variables are optional: `NEXT_TELEMETRY_DISABLED=1` + `DSSF_*` (see `.env.example`).
  Node is pinned via `engines` (22.x).
- **Docker / VPS**: `Dockerfile` (official pattern; `output: standalone` is
  enabled only for Docker builds)
  ```bash
  docker build -t dssf . && docker run -p 3000:3000 dssf
  ```

API + routes:

```
GET /                        The app itself (mobile-first, two-column results on lg)
GET /api/check?sku=4550586333055                  -> single-product report
GET /api/check?skus=<JAN>,<JAN>                   -> multiple reports ({ results }, max 4)
```

## How it works

`store.disney.co.jp` runs on Salesforce Commerce Cloud (Demandware):

```
GET .../ja_JP/Product-Variation?pid=<SKU>&quantity=1
 -> product.available / availability.ATS / price / images / rating /
    favoritesCountHtml / releaseDateTime / descriptionFor{Size,Material,…} /
    enableStoreStock (store data exists even when false!) / addToCartButtonState

GET .../ja_JP/Product-FindInStore?sku=<SKU>
 -> { templateContent: HTML for "#findInStoreListAccordion", error }
 -> 9 regional groups × rows of <a class="store-name"> + <span class="inventory-stock-status">
 -> in stock / out of stock / ask the store (other rows are split out as event rows, e.g. pop-ups)
```

`app/api/check/route.ts` acts as a same-origin proxy
(Disney sends no CORS headers, so the browser can't call the API directly).
`lib/disney.ts` is framework-free (unit-tested with vitest) → `lib/disney.test.ts`.

## Structure

```
app/                  App Router (page, layout, error, api/check/route)
components/           stock-finder (client boundary) + dossier/store-list/accordion
lib/                  disney.ts (scrape) / config.ts (env) / readings.ts / format.ts / variants.ts
Dockerfile            Follows the official with-docker pattern (standalone, Docker only)
.github/workflows/ci.yml  lint → typecheck → test → build
```

- Store locator (official): https://www.disney.co.jp/store/storeinfo.html
- Restock info (official): https://store.disney.co.jp/restock/
- Guest Center: 0570-01-3932 (weekdays 9:00–17:00 / Sat 9:00–13:00)

Unofficial tool. Stock changes constantly — always confirm with the store.
