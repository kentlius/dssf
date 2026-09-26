"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import type { SkuReport } from "@/lib/disney";
import { extractSku } from "@/lib/disney";
import { ProductDossier } from "./product-dossier";
import { StoreList } from "./store-list";

interface RecentItem {
  skus: string;
  label: string;
  image?: string;
}

function loadRecent(): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem("dssf-recent") ?? "[]") as unknown;
    if (!Array.isArray(raw)) return [];
    return raw
      .map((x) =>
        typeof x === "string"
          ? { skus: x, label: x }
          : {
              skus: String((x as RecentItem).skus ?? ""),
              label: String((x as RecentItem).label ?? x),
              image: typeof (x as RecentItem).image === "string" ? (x as RecentItem).image : undefined,
            },
      )
      .filter((x) => x.skus)
      .slice(0, 8);
  } catch {
    return [];
  }
}

/**
 * Run a state update inside a View Transition when supported, so the
 * empty→results switch morphs instead of teleporting. Skipped under
 * prefers-reduced-motion (CSS handles the rest via the kill-switch).
 */
function updateInTransition(fn: () => void): void {
  if (typeof document === "undefined") return fn();
  const vt = (
    document as unknown as {
      startViewTransition?: (update: () => void) => void;
    }
  ).startViewTransition;
  if (typeof vt === "function" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    try {
      vt.call(document, fn);
      return;
    } catch {
      /* fall through to instant update */
    }
  }
  fn();
}

/**
 * Isolated `useSearchParams` reader so the rest of the page still prerenders
 * to a static shell (only this null-rendering child suspends).
 */
function DeepLink({ onDeepLink }: { onDeepLink: (value: string) => void }) {
  const searchParams = useSearchParams();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const init = searchParams.get("skus") ?? searchParams.get("sku");
    if (init) onDeepLink(init);
  }, [searchParams, onDeepLink]);
  return null;
}

export function StockFinder() {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<SkuReport | null>(null);
  const [recent, setRecent] = useState<RecentItem[]>(loadRecent);

  const saveRecent = useCallback((item: RecentItem) => {
    setRecent((prev) => {
      const next = [item, ...prev.filter((x) => x.skus !== item.skus)].slice(0, 8);
      try {
        localStorage.setItem("dssf-recent", JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const check = useCallback(
    async (override?: string) => {
      const sku = extractSku(override ?? input);
      if (!sku) {
        setReport(null);
        setError("商品番号（13桁）を入力してください");
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(`/api/check?sku=${encodeURIComponent(sku)}`);
        const data = (await res.json()) as SkuReport & { error?: string };
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        updateInTransition(() => {
          setReport(data);
          setError(null);
        });
        saveRecent({ skus: data.sku, label: data.online.name ?? data.sku, image: data.online.image ?? undefined });
        const url = new URL(window.location.href);
        url.searchParams.delete("sku");
        url.searchParams.delete("skus");
        url.searchParams.set("sku", data.sku);
        window.history.replaceState(null, "", url);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        updateInTransition(() => {
          setReport(null);
          setError(message);
        });
      } finally {
        setBusy(false);
      }
    },
    [input, saveRecent],
  );

  const handleDeepLink = useCallback(
    (value: string) => {
      setInput(value);
      void check(extractSku(value));
    },
    [check],
  );

  const hasResult = report !== null || error !== null || busy;

  return (
    <>
      <Suspense>
        <DeepLink onDeepLink={handleDeepLink} />
      </Suspense>

      <main className="mx-auto max-w-xl px-4 pb-10 lg:max-w-6xl">
        <div className="pt-3 text-lg font-bold">🏰 店舗在庫チェッカー</div>

        <div className={hasResult ? undefined : "grid min-h-[62dvh] content-center"}>
          <section
            className="mx-auto mt-2 w-full lg:max-w-xl"
            style={{ viewTransitionName: "search-card" }}
          >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void check();
            }}
            className="flex min-h-14 items-center gap-1 rounded-full border border-zinc-200 bg-white py-1.5 pr-1.5 pl-2 shadow-sm transition-shadow hover:shadow-md focus-within:border-zinc-300 focus-within:shadow-md"
          >
            <button
              type="submit"
              disabled={busy}
              aria-label="在庫を調べる"
              title="在庫を調べる"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg text-zinc-600 disabled:opacity-50"
            >
              {busy ? "⏳" : "🔍"}
            </button>
            <input
              id="sku"
              type="text"
              inputMode="numeric"
              aria-label="商品URLまたは商品番号"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="https://store.disney.co.jp/goods/… / 商品番号"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-zinc-400"
            />
            {input && !busy && (
              <button
                type="button"
                aria-label="入力をクリア"
                title="入力をクリア"
                onClick={() => setInput("")}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg text-zinc-500"
              >
                ✕
              </button>
            )}
          </form>
          {recent.length > 0 && (
            <div className="mt-2 flex snap-x gap-1.5 overflow-x-auto pb-1">
              {recent.map((r) => (
                <button
                  key={r.skus}
                  type="button"
                  title={r.label}
                  onClick={() => {
                    setInput(r.skus);
                    void check(r.skus);
                  }}
                  className="flex w-44 shrink-0 snap-start items-center gap-2 rounded-xl bg-slate-100 py-1.5 pr-3 pl-1.5 text-left"
                >
                  {r.image ? (
                    <Image
                      src={r.image}
                      alt=""
                      width={32}
                      height={32}
                      className="h-8 w-8 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="h-8 w-8 shrink-0 rounded-lg bg-zinc-200" aria-hidden />
                  )}
                  <span className="truncate text-xs">{r.label}</span>
                </button>
              ))}
            </div>
          )}
        </section>
        </div>

        {error && (
          <div className="error-enter mx-auto mt-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-800 lg:max-w-xl">
            エラー: {error}
          </div>
        )}

        {report && (
          <div className="mt-3 flex flex-col gap-3">
            <div className="grid items-start gap-3 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <ProductDossier report={report} />
              </div>
              <div className="lg:col-span-3">
                <StoreList report={report} />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-xl px-4 pb-8 text-center text-xs text-zinc-400 lg:max-w-6xl">
        by{" "}
        <a
          href="https://github.com/kentlius"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4"
        >
          kentlius
        </a>
      </footer>
    </>
  );
}
