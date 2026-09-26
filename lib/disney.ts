import { z } from "zod";
import { config } from "./config";

/**
 * Disney Store Japan (store.disney.co.jp) scraping logic.
 *
 * Framework-free on purpose: no `next/*` imports, so this module runs
 * unchanged in the Route Handler, in tests, and in any future runtime.
 *
 * Reverse-engineered endpoints (Salesforce Commerce Cloud / Demandware):
 * - `Product-Variation?pid=<SKU>` — full product dossier (online stock,
 *   ATS, price, specs, images, rating, favorites, release date…)
 * - `Product-FindInStore?sku=<SKU>` — `templateContent` HTML with per-store
 *   あり / なし / 店舗問合せ rows grouped by region.
 *
 * What the official goods page cannot do (and this exists for):
 * - The store button is hidden when `data-is-find-in-store="false"`, yet the
 *   FindInStore endpoint still returns data — we reveal hidden store stock.
 * - "Sold out everywhere" proof: N rows all なし, vs. unknown.
 * - One-screen dossier (specs, images, rating, release date) + buy verdict,
 *   all from public endpoints the page buries across tabs.
 */

const BASE =
  "https://store.disney.co.jp/on/demandware.store/Sites-shopDisneyJapan-Site/ja_JP";

const KNOWN_STATUSES = new Set(["あり", "なし", "店舗問合せ"]);

/* ---------------------------------- types --------------------------------- */

export interface StoreEntry {
  name: string;
  status: string;
  url: string;
  region: string;
  /** True for non-stock rows (e.g. limited-time event announcements). */
  isEvent: boolean;
}

export interface RegionGroup {
  name: string;
  stores: StoreEntry[];
}

export interface OnlineInfo {
  pid: string;
  name: string | null;
  url: string;
  price: string | null;
  priceValue: number | null;
  currency: string;
  availableOnline: boolean | null;
  ats: number | null;
  messages: string[] | null;
  inStockDate: string | null;
  releaseDateTime: string | null;
  isPreOrder: boolean | null;
  isBackOrder: boolean | null;
  isComingSoon: boolean | null;
  rating: number | null;
  favorites: number | null;
  /** False even when store data exists — the official button hides anyway. */
  enableStoreStock: boolean | null;
  storeButtonHidden: boolean;
  addToCartLabel: string | null;
  addToCartDisabled: boolean | null;
  addToCartSoldOut: boolean | null;
  maxOrderQuantity: number | null;
  variantQuantityLimit: number | null;
  readyToOrder: boolean | null;
  images: string[];
  image: string | null;
  badges: { top: unknown; bottom: unknown; inventory: unknown };
  description: string | null;
  specs: {
    size: string | null;
    material: string | null;
    weight: string | null;
    age: string | null;
    country: string | null;
    manufacturer: string | null;
  };
  warning: string | null;
  shipping: { message: string | null; freeThreshold: number | null };
  giftWrappable: boolean | null;
  dscPoint: boolean | null;
}

export interface StockSummary {
  total: number;
  ari: number;
  toiawase: number;
  nashi: number;
  other: number;
  ariStores: string[];
}

export type VerdictKey =
  | "buy_online"
  | "goto_store"
  | "call_store"
  | "watch_restock"
  | "soldout_everywhere"
  | "check_detail";

export interface Verdict {
  key: VerdictKey;
  level: "good" | "warn" | "bad";
}

export interface SkuReport {
  sku: string;
  fetchedAt: string;
  stockAsOfNote: string;
  online: OnlineInfo;
  regions: RegionGroup[];
  stores: StoreEntry[];
  summary: StockSummary;
  verdict: Verdict;
}

export interface SkuFailure {
  ok: false;
  sku: string;
  error: string;
}

export interface SkuSuccess {
  ok: true;
  data: SkuReport;
}

export type SkuResult = SkuSuccess | SkuFailure;

export class DisneyApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 502) {
    super(message);
    this.name = "DisneyApiError";
    this.statusCode = statusCode;
  }
}

/* ------------------------------- validation -------------------------------- */

const variationSchema = z
  .object({
    favoritesCountHtml: z.string().optional(),
    addToCartButtonState: z
      .object({
        label: z.string().optional(),
        isDisabled: z.boolean().optional(),
        isSoldOut: z.boolean().optional(),
      })
      .passthrough()
      .optional(),
    product: z
      .object({
        productName: z.string().optional(),
        available: z.boolean().optional(),
        enableStoreStock: z.boolean().optional(),
        rating: z.union([z.number(), z.string()]).optional(),
        releaseDateTime: z.string().optional(),
        maxOrderQuantity: z.number().optional(),
        variantQuantityLimit: z.number().nullable().optional(),
        readyToOrder: z.boolean().optional(),
        isComingSoon: z.boolean().optional(),
        isGiftWrappable: z.boolean().optional(),
        grantDSCPoint: z.boolean().optional(),
        freeShippingThreshold: z.union([z.number(), z.string()]).nullable().optional(),
        topBadgeLabel: z.unknown().optional(),
        bottomBadgeLabel: z.unknown().optional(),
        inventoryBadgeLabel: z.unknown().optional(),
        longDescription: z.string().nullable().optional(),
        shortDescription: z.string().nullable().optional(),
        warning: z.string().nullable().optional(),
        shippingMessage: z.string().nullable().optional(),
        descriptionForSize: z.string().nullable().optional(),
        descriptionForMaterial: z.string().nullable().optional(),
        descriptionForWeight: z.string().nullable().optional(),
        descriptionForAge: z.string().nullable().optional(),
        descriptionForManufacturerCountry: z.string().nullable().optional(),
        descriptionForManufacturer: z.string().nullable().optional(),
        price: z
          .object({
            sales: z
              .object({
                formatted: z.string().optional(),
                value: z.number().optional(),
                currency: z.string().optional(),
              })
              .optional(),
          })
          .optional(),
        availability: z
          .object({
            ATS: z.number().optional(),
            messages: z.array(z.string()).optional(),
            inStockDate: z.string().optional(),
            isPreOrder: z.boolean().optional(),
            isBackOrder: z.boolean().optional(),
          })
          .optional(),
        images: z
          .object({ large: z.array(z.object({ url: z.string() })).optional() })
          .optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const findInStoreSchema = z
  .object({ templateContent: z.string().optional(), error: z.unknown().optional() })
  .passthrough();

export const querySchema = z.object({
  sku: z.string().max(500).optional(),
  skus: z.string().max(2000).optional(),
});

/* --------------------------------- parsing --------------------------------- */

/** First 13–14 digit run (JAN) in free-form input, else the trimmed input. */
export function extractSku(raw: string): string {
  const m = String(raw ?? "").match(/\d{13,14}/);
  return m ? m[0] : String(raw ?? "").trim();
}

/** All unique JANs in free-form input (URLs, comma/space separated), capped. */
export function extractSkus(raw: string, max: number = config.maxSkus): string[] {
  const found = String(raw ?? "").match(/\d{13,14}/g) ?? [];
  const uniq = [...new Set(found)].slice(0, max);
  if (uniq.length > 0) return uniq;
  const single = String(raw ?? "").trim();
  return single ? [single].slice(0, max) : [];
}

export function stripHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function textOrNull(value: unknown, max = 2000): string | null {
  if (value == null) return null;
  const t = stripHtml(value).slice(0, max);
  return t || null;
}

/** Full product dossier — fields the official page buries across tabs. */
export function parseOnline(pid: string, raw: unknown): OnlineInfo {
  const d = variationSchema.parse(raw);
  const p = d.product ?? {};
  const avail = p.availability ?? {};
  const sales = p.price?.sales;
  const images = (p.images?.large ?? []).map((i) => i.url).filter(Boolean);
  const favText = (d.favoritesCountHtml ?? "").replace(/\s+/g, " ");
  const favMatch = favText.match(/([\d,]+)\s*人/);
  const cart = d.addToCartButtonState ?? {};
  const shipRaw = p.freeShippingThreshold;
  const freeThreshold =
    typeof shipRaw === "number"
      ? shipRaw
      : typeof shipRaw === "string"
        ? Number(shipRaw.replace(/[^\d]/g, "")) || null
        : null;
  return {
    pid,
    name: p.productName ?? null,
    url: `https://store.disney.co.jp/goods/${pid}.html`,
    price: sales?.formatted ?? null,
    priceValue: sales?.value ?? null,
    currency: sales?.currency ?? "JPY",
    availableOnline: p.available ?? null,
    ats: avail.ATS ?? null,
    messages: avail.messages ?? null,
    inStockDate: avail.inStockDate ?? p.releaseDateTime ?? null,
    releaseDateTime: p.releaseDateTime ?? null,
    isPreOrder: avail.isPreOrder ?? null,
    isBackOrder: avail.isBackOrder ?? null,
    isComingSoon: p.isComingSoon ?? null,
    rating:
      typeof p.rating === "number"
        ? p.rating
        : typeof p.rating === "string"
          ? Number(p.rating) || null
          : null,
    favorites: favMatch ? Number(favMatch[1].replace(/,/g, "")) : null,
    enableStoreStock: p.enableStoreStock ?? null,
    storeButtonHidden: p.enableStoreStock === false,
    addToCartLabel: cart.label ?? null,
    addToCartDisabled: cart.isDisabled ?? null,
    addToCartSoldOut: cart.isSoldOut ?? null,
    maxOrderQuantity: p.maxOrderQuantity ?? null,
    variantQuantityLimit: p.variantQuantityLimit ?? null,
    readyToOrder: p.readyToOrder ?? null,
    images,
    image: images[0] ?? null,
    badges: {
      top: p.topBadgeLabel ?? null,
      bottom: p.bottomBadgeLabel ?? null,
      inventory: p.inventoryBadgeLabel ?? null,
    },
    description: textOrNull(p.longDescription ?? p.shortDescription, 3000),
    specs: {
      size: textOrNull(p.descriptionForSize, 500),
      material: textOrNull(p.descriptionForMaterial, 500),
      weight: textOrNull(p.descriptionForWeight, 200),
      age: textOrNull(p.descriptionForAge, 200),
      country: textOrNull(p.descriptionForManufacturerCountry, 200),
      manufacturer: textOrNull(p.descriptionForManufacturer, 200),
    },
    warning: textOrNull(p.warning, 1000),
    shipping: {
      message: textOrNull(p.shippingMessage, 500),
      freeThreshold,
    },
    giftWrappable: p.isGiftWrappable ?? null,
    dscPoint: p.grantDSCPoint ?? null,
  };
}

/**
 * Parse `templateContent` HTML into region groups.
 * Stores are assigned to the nearest preceding region header by position.
 */
export function parseRegions(templateContent: string | null | undefined): RegionGroup[] {
  const tc = String(templateContent ?? "");
  const regionMatches = [...tc.matchAll(/header-title"[^>]*>\s*([^<]+?)\s*<svg/g)].map(
    (m) => ({ pos: m.index, name: m[1].trim() }),
  );
  const storeMatches = [
    ...tc.matchAll(
      /<a href="([^"]+)" class="store-name"[^>]*>([^<]+)<\/a>[\s\S]*?inventory-stock-status[^>]*>([^<]+)<\/span>/g,
    ),
  ].map((m) => ({
    pos: m.index,
    url: m[1].trim(),
    name: m[2].trim(),
    status: m[3].trim(),
  }));

  const regions: RegionGroup[] = [];
  const index = new Map<string, number>();
  const ensure = (name: string): RegionGroup => {
    const i = index.get(name);
    if (i !== undefined) return regions[i];
    index.set(name, regions.length);
    const g: RegionGroup = { name, stores: [] };
    regions.push(g);
    return g;
  };

  let ri = 0;
  for (const s of storeMatches) {
    while (ri + 1 < regionMatches.length && regionMatches[ri + 1].pos < s.pos) ri += 1;
    const regionName = regionMatches.length > 0 ? regionMatches[ri].name : "全店舗";
    ensure(regionName).stores.push({
      name: s.name,
      status: s.status,
      url: s.url,
      region: regionName,
      isEvent: !KNOWN_STATUSES.has(s.status),
    });
  }
  return regions;
}

export function summarize(regions: RegionGroup[]): StockSummary {
  let total = 0,
    ari = 0,
    toiawase = 0,
    nashi = 0,
    other = 0;
  const ariStores: string[] = [];
  for (const r of regions) {
    for (const s of r.stores) {
      if (s.isEvent) {
        other += 1;
        continue;
      }
      total += 1;
      if (s.status === "あり") {
        ari += 1;
        ariStores.push(s.name);
      } else if (s.status === "店舗問合せ") toiawase += 1;
      else if (s.status === "なし") nashi += 1;
      else other += 1;
    }
  }
  return { total, ari, toiawase, nashi, other, ariStores };
}

/** Buy recommendation the official site never gives. */
export function verdictFor(online: OnlineInfo, summary: StockSummary): Verdict {
  const onlineOk = online.availableOnline === true && (online.ats ?? 0) > 0;
  if (onlineOk) return { key: "buy_online", level: "good" };
  if (summary.ari > 0) return { key: "goto_store", level: "good" };
  if (summary.total > 0 && summary.nashi === summary.total)
    return { key: "soldout_everywhere", level: "bad" };
  if (summary.toiawase > 0) return { key: "call_store", level: "warn" };
  if (summary.total === 0) return { key: "check_detail", level: "warn" };
  return { key: "watch_restock", level: "warn" };
}

/* --------------------------------- fetching -------------------------------- */

async function fetchJson(url: string): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), config.upstreamTimeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": config.userAgent, Accept: "application/json" },
    });
    if (!res.ok) throw new DisneyApiError(`Disney upstream HTTP ${res.status}`, res.status);
    return (await res.json()) as unknown;
  } catch (e) {
    if (e instanceof DisneyApiError) throw e;
    throw new DisneyApiError(
      e instanceof Error && e.name === "AbortError"
        ? "Disney upstream timed out"
        : `Disney upstream unreachable: ${e instanceof Error ? e.message : String(e)}`,
      502,
    );
  } finally {
    clearTimeout(t);
  }
}

export async function checkSku(rawSku: string): Promise<SkuReport> {
  const sku = extractSku(rawSku);
  if (!sku) throw new DisneyApiError("商品番号が空です。13桁の商品番号を入力してください。", 400);
  const [variation, findInStore] = await Promise.all([
    fetchJson(`${BASE}/Product-Variation?pid=${encodeURIComponent(sku)}&quantity=1`).catch(
      (e: unknown) => {
        // Disney answers unknown PIDs with HTTP 5xx — translate to a 404.
        if (e instanceof DisneyApiError && e.statusCode >= 400) {
          throw new DisneyApiError(`商品が見つかりません: ${sku}（番号を確認してください）`, 404);
        }
        throw e;
      },
    ),
    fetchJson(`${BASE}/Product-FindInStore?sku=${encodeURIComponent(sku)}`),
  ]);
  const online = parseOnline(sku, variation);
  if (!online.name)
    throw new DisneyApiError(`商品が見つかりません: ${sku}（番号を確認してください）`, 404);
  const { templateContent } = findInStoreSchema.parse(findInStore);
  const regions = parseRegions(templateContent);
  const summary = summarize(regions);
  return {
    sku,
    fetchedAt: new Date().toISOString(),
    stockAsOfNote: "店舗在庫は 09:00 JST 時点の表示 (毎日更新) です",
    online,
    regions,
    stores: regions.flatMap((r) => r.stores),
    summary,
    verdict: verdictFor(online, summary),
  };
}

/**
 * Read-through cache (per server instance — see docs note in route handler).
 * Multi-instance deployments should front this with shared caching instead.
 */
const cache = new Map<string, { ts: number; data: SkuReport }>();

export async function checkSkuCached(rawSku: string): Promise<SkuReport> {
  const sku = extractSku(rawSku);
  const hit = cache.get(sku);
  if (hit && Date.now() - hit.ts < config.cacheTtlMs) return hit.data;
  const data = await checkSku(sku);
  cache.set(sku, { ts: Date.now(), data });
  if (cache.size > config.cacheMaxEntries) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) cache.delete(oldest[0]);
  }
  return data;
}

/** Multi-SKU: settled results so one bad JAN doesn't fail the batch. */
export async function checkSkusCached(skus: string[]): Promise<SkuResult[]> {
  const list = [...new Set(skus)].slice(0, config.maxSkus);
  return Promise.all(
    list.map(async (sku): Promise<SkuResult> => {
      try {
        return { ok: true, data: await checkSkuCached(sku) };
      } catch (e) {
        return {
          ok: false,
          sku: extractSku(sku),
          error: e instanceof Error ? e.message : String(e),
        };
      }
    }),
  );
}
