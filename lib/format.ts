import type { SkuReport, StoreEntry } from "./disney";
import { storeMatchesKeyword } from "./readings";

export type SoloStatus = "あり" | "店舗問合せ" | "なし";

export interface StoreFilter {
  region: string;
  keyword: string;
  /** Statuses toggled off (multi-select). Default hides なし. */
  off: SoloStatus[];
}

export const EMPTY_FILTER: StoreFilter = {
  region: "",
  keyword: "",
  off: ["なし"],
};

const STATUS_ORDER: Record<string, number> = { あり: 0, 店舗問合せ: 1, なし: 2 };

/** Apply the UI filters to a report's stores (events always excluded). */
export function filterStores(report: SkuReport, f: StoreFilter): StoreEntry[] {
  let list = report.stores.filter((s) => !s.isEvent);
  if (f.region) list = list.filter((s) => s.region === f.region);
  const kw = f.keyword.trim();
  if (kw) list = list.filter((s) => storeMatchesKeyword(s.name, s.region, kw));
  if (f.off.length > 0) list = list.filter((s) => !f.off.includes(s.status as SoloStatus));
  return [...list].sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9),
  );
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
