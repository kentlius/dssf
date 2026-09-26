"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { SkuReport, Verdict } from "@/lib/disney";
import { copyText } from "@/lib/format";
import { Accordion } from "./accordion";

const VERDICT_TEXT: Record<Verdict["key"], string> = {
  buy_online: "オンライン在庫あり — 今すぐ買える",
  goto_store: "店舗に在庫あり",
  call_store: "店舗問合せ — 電話で確認を",
  watch_restock: "入荷待ち — 再入荷を待つ",
  soldout_everywhere: "全店売切 — 売切確定",
  check_detail: "詳細を確認",
};

const VERDICT_STYLE: Record<Verdict["level"], string> = {
  good: "border-green-300 bg-green-50 text-green-800",
  warn: "border-amber-300 bg-amber-50 text-amber-800",
  bad: "border-red-300 bg-red-50 text-red-800",
};

function VerdictBanner({ report }: { report: SkuReport }) {
  const text =
    report.verdict.key === "goto_store" && report.summary.ari > 0
      ? `店舗に在庫あり — ${report.summary.ari}店`
      : VERDICT_TEXT[report.verdict.key];
  return (
    <p
      className={`rounded-xl border px-3 py-2 text-center text-sm font-bold ${VERDICT_STYLE[report.verdict.level]}`}
    >
      {text}
    </p>
  );
}

function OnlineStatus({ report }: { report: SkuReport }) {
  const o = report.online;
  const inStock = o.availableOnline === true;
  if (!inStock) {
    return <p className="text-sm font-bold text-red-600">オンライン在庫なし</p>;
  }
  return (
    <p className="flex flex-wrap items-baseline gap-x-1.5">
      <span className="text-sm font-bold text-green-600">オンライン在庫あり</span>
      {o.ats != null && (
        <span className="text-lg font-extrabold text-green-600">残り{o.ats}</span>
      )}
    </p>
  );
}

export function ProductDossier({ report }: { report: SkuReport }) {
  const o = report.online;
  const [imgIdx, setImgIdx] = useState(0);
  const [shared, setShared] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const images = o.images.length > 0 ? o.images : o.image ? [o.image] : [];

  function goTo(i: number): void {
    setImgIdx(i);
    const el = trackRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  function onTrackScroll(): void {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== imgIdx) setImgIdx(i);
  }

  async function share(): Promise<void> {
    const url = window.location.href;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: o.name ?? "店舗在庫チェッカー", url });
        setShared(true);
        setTimeout(() => setShared(false), 1200);
        return;
      } catch {
        /* dismissed or failed: fall through to clipboard */
      }
    }
    if (await copyText(url)) {
      setShared(true);
      setTimeout(() => setShared(false), 1200);
    }
  }

  const limit = o.variantQuantityLimit ?? o.maxOrderQuantity;
  const specRows: Array<[string, string | null]> = [
    ["サイズ", o.specs.size],
    ["素材", o.specs.material],
    ["重さ", o.specs.weight],
    ["対象年齢", o.specs.age],
    ["発売日", o.releaseDateTime],
    ["評価", o.rating != null ? `★ ${o.rating}` : null],
    ["お気に入り", o.favorites != null ? `${o.favorites.toLocaleString()}人` : null],
  ].filter((r): r is [string, string] => r[1] != null && r[1] !== "");

  const shipRows: Array<[string, string | null]> = [
    ["配送元", o.shipping.message],
    [
      "送料無料ライン",
      o.shipping.freeThreshold != null ? `${Number(o.shipping.freeThreshold).toLocaleString()}円` : null,
    ],
    ["オンライン入荷", o.inStockDate],
    ["注文上限", limit == null ? null : String(limit)],
    ["ギフト", o.giftWrappable ? "可" : null],
    ["ポイント", o.dscPoint ? "対象" : null],
  ].filter((r): r is [string, string] => r[1] != null && r[1] !== "");

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-2xl bg-white p-3 shadow-sm">
      <div className="flex min-w-0 flex-col gap-3">
        <VerdictBanner report={report} />

        {images.length > 0 && (
          <div className="min-w-0">
            <div
              ref={trackRef}
              onScroll={onTrackScroll}
              className="flex snap-x snap-mandatory overflow-x-auto rounded-xl bg-zinc-100 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {images.map((u) => (
                <a
                  key={u}
                  href={u}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative block w-full shrink-0 snap-center"
                >
                  <Image
                    src={u}
                    alt={o.name ?? ""}
                    width={640}
                    height={640}
                    priority={u === images[0]}
                    className="gallery-main block aspect-square h-auto w-full object-cover"
                  />
                </a>
              ))}
            </div>
            <div className="mt-1.5 flex min-w-0 items-center justify-between gap-2">
              {images.length > 1 ? (
                <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {images.map((u, i) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => goTo(i)}
                      aria-label={`画像 ${i + 1} を表示`}
                      aria-current={i === imgIdx}
                      className="min-h-11 min-w-11 shrink-0"
                    >
                      <Image
                        src={u}
                        alt=""
                        width={50}
                        height={50}
                        className={`h-10 w-10 rounded-lg object-cover ${
                          i === imgIdx ? "opacity-100 ring-2 ring-sky-500" : "opacity-60"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <span className="min-w-0 flex-1" />
              )}
              {images.length > 1 && (
                <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-500 tabular-nums">
                  {imgIdx + 1} / {images.length}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="min-w-0 break-words">
          <p className="text-xs text-zinc-500">
            商品番号:{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs break-all select-all">
              {o.pid}
            </code>
          </p>
          <h2 className="mt-1 text-lg font-extrabold break-words leading-snug">{o.name}</h2>
          {o.price && <p className="mt-1 text-xl font-extrabold">{o.price}</p>}
          <div className="mt-1">
            <OnlineStatus report={report} />
          </div>
          {(o.rating != null || o.favorites != null) && (
            <p className="mt-1 text-sm text-zinc-600">
              {o.rating != null && <span className="font-bold">★ {o.rating}</span>}
              {o.rating != null && o.favorites != null && <span aria-hidden> · </span>}
              {o.favorites != null && (
                <span>お気に入り登録数：{o.favorites.toLocaleString()}人</span>
              )}
            </p>
          )}
          <div className="mt-2 flex min-w-0 gap-1.5">
            <a
              className="flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-full bg-zinc-900 px-3 text-center text-sm font-bold text-white"
              href={o.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="公式商品ページで見る"
            >
              公式で見る ↗
            </a>
            <button
              type="button"
              className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 px-3 text-sm"
              aria-label="この在庫結果を共有する"
              title="この在庫結果を共有する"
              onClick={() => void share()}
            >
              {shared ? "✓" : "🔗"}
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-zinc-400">
            取得: {new Date(report.fetchedAt).toLocaleString()}
          </p>
        </div>
      </div>

      {o.description && (
        <Accordion summary="商品説明・注意">
          <p className="px-3 pb-3 break-words whitespace-pre-line leading-7">{o.description}</p>
          {o.warning && <p className="px-3 pb-3 text-sm break-words text-zinc-500">⚠️ {o.warning}</p>}
        </Accordion>
      )}
      {specRows.length > 0 && (
        <Accordion summary="詳細スペック">
          <table className="w-full table-fixed border-collapse text-[13px]">
            <tbody>
              {specRows.map(([k, v]) => (
                <tr key={k}>
                  <th className="w-[36%] border border-zinc-200 bg-zinc-50 p-1.5 text-left align-top font-normal break-words text-zinc-500">
                    {k}
                  </th>
                  <td className="border border-zinc-200 p-1.5 align-top break-words">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Accordion>
      )}
      {shipRows.length > 0 && (
        <Accordion summary="お届け・送料">
          <table className="w-full table-fixed border-collapse text-[13px]">
            <tbody>
              {shipRows.map(([k, v]) => (
                <tr key={k}>
                  <th className="w-[36%] border border-zinc-200 bg-zinc-50 p-1.5 text-left align-top font-normal break-words text-zinc-500">
                    {k}
                  </th>
                  <td className="border border-zinc-200 p-1.5 align-top break-words">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Accordion>
      )}
    </section>
  );
}
