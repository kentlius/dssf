import { useState } from "react";
import NumberFlow from "@number-flow/react";
import type { SkuReport, StoreEntry } from "@/lib/disney";
import { EMPTY_FILTER, filterStores } from "@/lib/format";
import type { StoreFilter } from "@/lib/format";
import { statusBadge, toStatusVariant, regionChip } from "@/lib/variants";
import type { StatusVariant } from "@/lib/variants";
import { Accordion } from "./accordion";

const STATUS_ICON: Record<StatusVariant, string> = {
  ari: "✓",
  nashi: "✕",
  toiawase: "?",
  other: "•",
};

const ROW_BG: Record<StatusVariant, string> = {
  ari: "bg-green-50",
  nashi: "bg-red-50",
  toiawase: "bg-amber-50",
  other: "",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={statusBadge({ status: toStatusVariant(status) })}
      role="img"
      aria-label={status}
      title={status}
    >
      {STATUS_ICON[toStatusVariant(status)]}
    </span>
  );
}

export function StoreList({ report }: { report: SkuReport }) {
  const [filter, setFilter] = useState<StoreFilter>(EMPTY_FILTER);
  const set = <K extends keyof StoreFilter>(key: K, value: StoreFilter[K]) =>
    setFilter((f) => ({ ...f, [key]: value }));
  const dirty =
    filter.region !== "" ||
    filter.keyword.trim() !== "" ||
    filter.off.join() !== "なし";

  const visible = filterStores(report, filter);
  // Bar reflects region/keyword scope; status toggles only dim, never remove.
  const scoped = filterStores(report, { ...filter, off: [] });
  const scopedCount = (status: string) => scoped.filter((x) => x.status === status).length;
  const scopedTotal = scoped.length;

  const regionStats = report.regions.map((r) => {
    const stocked = r.stores.filter((x) => !x.isEvent);
    return {
      name: r.name,
      total: stocked.length,
      ari: stocked.filter((x) => x.status === "あり").length,
    };
  });

  const byRegion = new Map<string, StoreEntry[]>();
  for (const st of visible) {
    const arr = byRegion.get(st.region) ?? [];
    arr.push(st);
    byRegion.set(st.region, arr);
  }

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-2xl bg-white p-3 shadow-sm">
      <div
        className="-mx-1 flex w-full min-w-0 snap-x gap-1.5 overflow-x-auto px-1 pb-1"
        role="group"
        aria-label="地域で絞り込む"
      >
        <button
          type="button"
          onClick={() => set("region", "")}
          aria-pressed={filter.region === ""}
          className={regionChip({ selected: filter.region === "" })}
        >
          地域すべて
        </button>
        {regionStats.map((r) => {
          const selected = filter.region === r.name;
          return (
            <button
              key={r.name}
              type="button"
              onClick={() => set("region", selected ? "" : r.name)}
              aria-pressed={selected}
              className={regionChip({ selected })}
            >
              {r.ari > 0 && (
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 rounded-full bg-green-500"
                />
              )}
              {r.name} · {r.total}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex w-full min-w-0 items-center gap-2">
        <input
          type="search"
          enterKeyHint="search"
          value={filter.keyword}
          onChange={(e) => set("keyword", e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          placeholder="店舗名で検索"
          aria-label="店舗名で検索"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          className="min-h-11 min-w-0 flex-1 rounded-xl border-2 border-zinc-300 px-3 text-base"
        />
        {dirty && (
          <button
            type="button"
            onClick={() => setFilter(EMPTY_FILTER)}
            className="min-h-11 shrink-0 rounded-full px-3 text-xs font-bold text-zinc-500 underline underline-offset-4"
          >
            クリア
          </button>
        )}
      </div>

      {(scopedTotal > 0 && (
        <div className="mt-3 flex h-9 w-full min-w-0 overflow-hidden rounded-full" role="group" aria-label="ステータスで絞り込む">
        {(
          [
            { status: "あり", count: scopedCount("あり"), bg: "bg-green-500" },
            { status: "店舗問合せ", count: scopedCount("店舗問合せ"), bg: "bg-amber-500" },
            { status: "なし", count: scopedCount("なし"), bg: "bg-red-500" },
          ] as const
        ).map((item) => {
          const hidden = filter.off.includes(item.status);
          const empty = item.count === 0;
          const toggle = () =>
            set(
              "off",
              hidden ? filter.off.filter((x) => x !== item.status) : [...filter.off, item.status],
            );
          return (
            <button
              key={item.status}
              type="button"
              aria-pressed={!hidden}
              aria-hidden={empty || undefined}
              tabIndex={empty ? -1 : undefined}
              title={`${item.status}の表示切替`}
              onClick={toggle}
              style={{ flexGrow: item.count, flexBasis: 0 }}
              className={`flex min-h-9 items-center justify-center overflow-hidden text-sm font-bold whitespace-nowrap text-white tabular-nums transition-[flex-grow,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${item.bg} ${empty ? "min-w-0 opacity-0" : "min-w-10"} ${!empty && hidden ? "opacity-40" : ""}`}
            >
              <NumberFlow value={item.count} respectMotionPreference />
              <span className="sr-only">{item.status}</span>
            </button>
          );
        })}
        </div>
      ))}
      <div className="mt-1">
        {visible.length === 0 && <p className="text-sm">条件に合う店舗がありません。絞り込みを変えてください。</p>}
        {[...byRegion].map(([region, arr]) => {
          const nAri = arr.filter((x) => x.status === "あり").length;
          return (
            <Accordion
              key={`${report.sku}:${region}`}
              defaultOpen={nAri > 0}
              summary={
                <>
                  {region} · {arr.length}
                  {nAri > 0 && (
                    <span className="ml-1.5 inline-block rounded-full bg-green-600 px-2 py-0.5 text-xs font-bold text-white">
                      {nAri}
                    </span>
                  )}
                </>
              }
            >
              {arr.map((x) => (
                <div
                  key={x.name}
                  className={`flex min-h-12 w-full min-w-0 items-center justify-between gap-2 border-t border-zinc-100 px-3 py-2 ${ROW_BG[toStatusVariant(x.status)]}`}
                >
                  <a
                    href={x.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1 wrap-break-word text-[15px] text-sky-600"
                  >
                    {x.name}
                  </a>
                  <span className="shrink-0">
                    <StatusBadge status={x.status} />
                  </span>
                </div>
              ))}
            </Accordion>
          );
        })}
      </div>
    </section>
  );
}
