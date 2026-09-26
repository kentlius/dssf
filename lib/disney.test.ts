import { describe, expect, it, vi, afterEach } from "vitest";
import {
  extractSku,
  extractSkus,
  stripHtml,
  parseOnline,
  parseRegions,
  summarize,
  verdictFor,
  checkSku,
  type OnlineInfo,
} from "./disney";

/* Minimal templateContent fixture: 2 regions, 3 stock rows + 1 event row. */
const TEMPLATE_FIXTURE = `
<div><span class="btn btn-link header-title" tabindex="-1">
  東京都
  <svg class="accordion-arrow-down"></svg></span></div>
<div class="card-body">
  <div class="store-details-list">
    <div class="store-name-container">
      <a href="https://www.disney.co.jp/store/storeinfo/101.html" class="store-name" target="_blank">渋谷公園通り店</a>
    </div>
    <div class="store-status"><span class="inventory-stock-status" style="color: #1a9e4b"> あり </span></div>
  </div>
  <div class="store-details-list">
    <div class="store-name-container">
      <a href="https://www.disney.co.jp/store/storeinfo/140.html" class="store-name">新宿高島屋店</a>
    </div>
    <div class="store-status"><span class="inventory-stock-status"> 店舗問合せ </span></div>
  </div>
</div>
<div><span class="btn btn-link header-title" tabindex="-1">
  その他
  <svg class="accordion-arrow-down"></svg></span></div>
<div class="card-body">
  <div class="store-details-list">
    <div class="store-name-container">
      <a href="https://www.parcocity.jp/" class="store-name">＜沖縄会場＞Disney Tour</a>
    </div>
    <div class="store-status"><span class="inventory-stock-status"> 10/31(金)～11/24(月)期間限定オープン！ </span></div>
  </div>
</div>`;

const VARIATION_FIXTURE = {
  favoritesCountHtml: "<span> 登録数: 1,055人 </span>",
  addToCartButtonState: { label: "在庫なし", isDisabled: true, isSoldOut: true },
  product: {
    productName: "プーさん FAIRY POOH",
    available: false,
    enableStoreStock: false,
    rating: 4.7,
    releaseDateTime: "2026/07/28 10:00:00",
    maxOrderQuantity: 99,
    price: { sales: { formatted: "3,000円", value: 3000, currency: "JPY" } },
    availability: { ATS: 0, messages: ["This item is currently not available"] },
    images: { large: [{ url: "https://example.com/a" }, { url: "https://example.com/b" }] },
    longDescription: "可愛い<br>ぬいぐるみ",
    descriptionForSize: "全長:約 25(cm)",
    descriptionForMaterial: "ポリエステル",
    // NOTE: upstream sends this as a locale-formatted STRING, not a number.
    freeShippingThreshold: "6,000",
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("extractSku / extractSkus", () => {
  it("pulls the JAN out of a product URL", () => {
    expect(extractSku("https://store.disney.co.jp/goods/4550586333055.html")).toBe(
      "4550586333055",
    );
  });
  it("collects, dedupes and caps multiple JANs", () => {
    expect(
      extractSkus("4550586333055, https://x/4550586333697.html 4550586333055"),
    ).toEqual(["4550586333055", "4550586333697"]);
    expect(
      extractSkus("4550586333055 4550586333697 4550586333055 1111111111111 2222222222222 3333333333333", 4),
    ).toEqual(["4550586333055", "4550586333697", "1111111111111", "2222222222222"]);
  });
  it("passes non-JAN input through as a single raw value", () => {
    expect(extractSkus("abc")).toEqual(["abc"]);
  });
  it("returns [] for empty input", () => {
    expect(extractSkus("   ")).toEqual([]);
  });
});

describe("stripHtml", () => {
  it("converts <br> to newlines and strips tags", () => {
    expect(stripHtml("a<br>b<p>c</p>")).toBe("a\nbc");
    expect(stripHtml(null)).toBe("");
  });
});

describe("parseOnline", () => {
  it("maps the dossier fields", () => {
    const o = parseOnline("4550586333055", VARIATION_FIXTURE);
    expect(o.name).toBe("プーさん FAIRY POOH");
    expect(o.price).toBe("3,000円");
    expect(o.ats).toBe(0);
    expect(o.rating).toBe(4.7);
    expect(o.favorites).toBe(1055);
    expect(o.images).toHaveLength(2);
    expect(o.storeButtonHidden).toBe(true);
    expect(o.description).toBe("可愛い\nぬいぐるみ");
    expect(o.specs.size).toBe("全長:約 25(cm)");
    expect(o.shipping.freeThreshold).toBe(6000);
  });
});

describe("parseRegions", () => {
  it("assigns stores to regions and flags event rows", () => {
    const regions = parseRegions(TEMPLATE_FIXTURE);
    expect(regions.map((r) => r.name)).toEqual(["東京都", "その他"]);
    const tokyo = regions[0].stores;
    expect(tokyo).toHaveLength(2);
    expect(tokyo[0]).toMatchObject({ name: "渋谷公園通り店", status: "あり", isEvent: false });
    expect(tokyo[1]).toMatchObject({ name: "新宿高島屋店", status: "店舗問合せ" });
    expect(regions[1].stores[0].isEvent).toBe(true);
  });
  it("returns [] for empty content", () => {
    expect(parseRegions("")).toEqual([]);
    expect(parseRegions(null)).toEqual([]);
  });
});

describe("summarize", () => {
  it("counts statuses and excludes events from the total", () => {
    const s = summarize(parseRegions(TEMPLATE_FIXTURE));
    expect(s).toMatchObject({ total: 2, ari: 1, toiawase: 1, nashi: 0, other: 1 });
    expect(s.ariStores).toEqual(["渋谷公園通り店"]);
  });
});

describe("verdictFor", () => {
  const base = { availableOnline: false, ats: 0 } as OnlineInfo;
  const sum = (over: Partial<ReturnType<typeof summarize>>) =>
    ({ total: 0, ari: 0, toiawase: 0, nashi: 0, other: 0, ariStores: [], ...over });
  it("prefers online stock", () => {
    expect(verdictFor({ ...base, availableOnline: true, ats: 5 }, sum({})).key).toBe(
      "buy_online",
    );
  });
  it("detects in-store-only, sold-out-everywhere, call, watch, and empty states", () => {
    expect(verdictFor(base, sum({ total: 3, ari: 1 })).key).toBe("goto_store");
    expect(verdictFor(base, sum({ total: 3, nashi: 3 })).key).toBe("soldout_everywhere");
    expect(verdictFor(base, sum({ total: 3, toiawase: 3 })).key).toBe("call_store");
    expect(verdictFor(base, sum({})).key).toBe("check_detail");
  });
});

function mockFetch(variation: unknown, findInStore: unknown, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const body = String(url).includes("Product-Variation") ? variation : findInStore;
      return { ok: status === 200, status, json: async () => body } as Response;
    }),
  );
}

describe("checkSku (mocked upstream)", () => {
  it("builds a full report", async () => {
    mockFetch(VARIATION_FIXTURE, { templateContent: TEMPLATE_FIXTURE, error: false });
    const r = await checkSku("4550586333055");
    expect(r.sku).toBe("4550586333055");
    expect(r.online.name).toBe("プーさん FAIRY POOH");
    expect(r.summary.ari).toBe(1);
    expect(r.verdict.key).toBe("goto_store");
  });
  it("throws a 404 when the product has no name", async () => {
    mockFetch({ product: {} }, { templateContent: "", error: false });
    await expect(checkSku("0000000000000")).rejects.toMatchObject({ statusCode: 404 });
  });
  it("throws a 404 when upstream rejects the variation call", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        String(url).includes("Product-Variation")
          ? ({ ok: false, status: 500, json: async () => ({}) } as Response)
          : ({ ok: true, status: 200, json: async () => ({ templateContent: "" }) } as Response),
      ),
    );
    await expect(checkSku("0000000000000")).rejects.toMatchObject({ statusCode: 404 });
  });
  it("throws a 400 for empty input without touching the network", async () => {
    const spy = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}) }) as Response);
    vi.stubGlobal("fetch", spy);
    await expect(checkSku("   ")).rejects.toMatchObject({ statusCode: 400 });
    expect(spy).not.toHaveBeenCalled();
  });
});
