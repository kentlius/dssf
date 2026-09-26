import { useState } from "react";
import Image from "next/image";
import type { SkuReport } from "@/lib/disney";
import { copyText } from "@/lib/format";
import { Accordion } from "./accordion";

function OnlineStatus({ report }: { report: SkuReport }) {
  const o = report.online;
  const inStock = o.availableOnline === true;
  if (!inStock) {
    return <p className="text-xs font-bold text-red-600">オンライン在庫なし</p>;
  }
  return (
    <p className="flex items-baseline gap-1.5">
      <span className="text-xs font-bold text-green-600">オンライン在庫あり</span>
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
    ["オンライン入荷", o.inStockDate],
    ["評価", o.rating != null ? `★ ${o.rating}` : null],
    ["お気に入り", o.favorites != null ? `${o.favorites.toLocaleString()}人` : null],
    ["注文上限", limit == null ? null : String(limit)],
    [
      "送料無料ライン",
      o.shipping.freeThreshold != null ? `${Number(o.shipping.freeThreshold).toLocaleString()}円` : null,
    ],
    ["ギフト", o.giftWrappable ? "可" : null],
    ["ポイント", o.dscPoint ? "対象" : null],
  ].filter((r): r is [string, string] => r[1] != null && r[1] !== "");

  return (
    <section className="rounded-2xl bg-white p-3 shadow-sm">
      <div className="flex gap-3">
        <div className="w-26 shrink-0 sm:w-55">
          {o.image && (
            <a href={o.image} target="_blank" rel="noopener noreferrer">
              <Image
                id="mainImg"
                key={o.images[imgIdx] ?? o.image}
                src={o.images[imgIdx] ?? o.image}
                alt={o.name ?? ""}
                width={220}
                height={220}
                className="gallery-main block h-26 w-26 rounded-xl bg-zinc-100 object-cover sm:h-55 sm:w-55"
              />
            </a>
          )}
          {o.images.length > 1 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {o.images.map((u, i) => (
                <button key={u} type="button" onClick={() => setImgIdx(i)} aria-label={`image ${i + 1}`} className="min-h-11 min-w-11">
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
          )}
        </div>
        <div className="min-w-0 flex-1">
          <OnlineStatus report={report} />
          <h2 className="mt-0.5 text-base font-bold leading-snug">{o.name}</h2>
          <p className="mt-0.5 text-sm">
            商品番号: <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs select-all">{o.pid}</code>
          </p>
          <p className="mt-0.5 font-bold">{o.price}</p>
          <p className="mt-1.5 flex gap-1.5">
            <a
              className="min-h-9 min-w-9 content-center rounded-full bg-slate-100 px-2.5 text-center text-xs"
              href={o.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="公式商品ページ"
              title="公式商品ページ"
            >
              ↗
            </a>
            <button
              type="button"
              className="min-h-9 min-w-9 rounded-full bg-slate-100 px-2.5 text-xs"
              aria-label="共有する"
              title="共有する"
              onClick={() => void share()}
            >
              {shared ? "✓" : "🔗"}
            </button>
          </p>
          <p className="mt-1 text-[11px] text-zinc-400">
            取得: {new Date(report.fetchedAt).toLocaleString()}
          </p>
        </div>
      </div>
      {o.description && (
        <Accordion summary="商品説明・注意">
          <p className="whitespace-pre-line px-3 pb-3 leading-7">{o.description}</p>
          {o.warning && <p className="px-3 pb-3 text-sm text-zinc-500">⚠️ {o.warning}</p>}
        </Accordion>
      )}
      {specRows.length > 0 && (
        <Accordion summary="詳細スペック">
          <table className="w-full border-collapse text-[13px]">
            <tbody>
              {specRows.map(([k, v]) => (
                <tr key={k}>
                  <th className="w-[36%] border border-zinc-200 bg-zinc-50 p-1.5 text-left align-top font-normal text-zinc-500">
                    {k}
                  </th>
                  <td className="border border-zinc-200 p-1.5 align-top">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Accordion>
      )}
    </section>
  );
}
