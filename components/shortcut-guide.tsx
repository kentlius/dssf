"use client";

import { useEffect, useState } from "react";
import { copyText } from "@/lib/format";

/**
 * iPhone Shortcut recipe: run it from the share sheet on an official
 * Disney Store product page and it deep-links here with `?url=<official>`.
 * iOS has no Web Share Target, so a 2-action Shortcut is the practical
 * bridge (Android gets a native share target via the web manifest).
 */
export function ShortcutGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  async function copyTemplate(): Promise<void> {
    const template = `${window.location.origin}/?url=`;
    if (await copyText(template)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="iPhoneショートカットの作り方"
      onClick={onClose}
    >
      <div
        className="max-h-[88dvh] w-full min-w-0 max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex min-w-0 items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 text-base font-extrabold break-words">
            📲 公式ページの「共有」から開く
          </h3>
          <button
            type="button"
            aria-label="閉じる"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg"
          >
            ✕
          </button>
        </div>
        <p className="mt-1 text-sm break-words text-zinc-600">
          iPhoneのショートカットを1つ作ると、公式ストアの商品ページで「共有」→
          ショートカット実行の2タップでこのアプリに飛べます。
        </p>
        <ol className="mt-3 flex min-w-0 list-none flex-col gap-2 p-0">
          {[
            "「ショートカット」アプリで ＋ → 新規ショートカットを作成",
            "下部の ⓘ →「共有シートに表示」をON（受け取る内容は URL）",
            "アクションを追加：「URL」（下のテンプレート＋「ショートカット入力」変数）→ 次に「URLを開く」",
            "名前を「在庫チェッカーで開く」にして完了",
            "公式商品ページで「共有」→ このショートカット → 在庫が自動表示",
          ].map((step, i) => (
            <li key={step} className="flex min-w-0 gap-2 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white tabular-nums">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 break-words text-zinc-700">{step}</span>
            </li>
          ))}
        </ol>
        <div className="mt-3 rounded-2xl bg-zinc-50 p-3">
          <p className="text-xs font-bold text-zinc-500">URLテンプレート（コピーして手順3に貼付け）</p>
          <p className="mt-1 font-mono text-xs break-all text-zinc-700">
            このアプリのURL + /?url=
          </p>
          <div className="mt-2 flex min-w-0 gap-1.5">
            <button
              type="button"
              onClick={() => void copyTemplate()}
              className="flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-full bg-zinc-900 px-3 text-sm font-bold text-white"
            >
              {copied ? "✓ コピー済み" : "テンプレートをコピー"}
            </button>
            <a
              href="shortcuts://"
              className="flex min-h-11 shrink-0 items-center justify-center rounded-full bg-slate-100 px-3 text-sm font-bold"
            >
              アプリを開く
            </a>
          </div>
        </div>
        <p className="mt-2 text-xs break-words text-zinc-400">
          Androidは共有先にこのアプリが直接表示されます（共有ターゲット対応）。
        </p>
      </div>
    </div>
  );
}
