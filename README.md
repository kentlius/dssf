# 🏰 Disney Store Stock Finder (ディズニーストア店舗在庫チェッカー)

商品URLかJANを貼るだけ。**公式ページではできないこと**をするツールです。
Paste a product URL or JAN — does what the official page can't.

Built on **Next.js 16 (App Router) + TypeScript + Tailwind + zod**, per the
[official docs](https://nextjs.org/docs) (`create-next-app` defaults, Route
Handlers, self-hosting guide). See `AGENTS.md` for agent-facing notes.

## 公式ページにない機能 (why this exists)

サンプル `https://store.disney.co.jp/goods/4550586333055.html` (FAIRY POOH) を深掘りして判明:

| 公式ページ | このツール |
|---|---|
| 店舗在庫ボタン自体が非表示 (`data-is-find-in-store="false"`)。何も分からない | 裏API (`Product-FindInStore`) を直接叩き、**隠された全店舗の在庫を表示** |
| 売切か不明か区別できない | **全店舗なしを証明** (全店なし → 売切確定)。推測不要 |
| 商品情報がタブに分散 (説明・サイズ・素材・送料…) | **要点を1画面に**: 画像、サイズ/素材/重さ/対象年齢、発売日、評価★、お気に入り数 |
| オンライン在庫と店舗在庫が別々 | 両方統合表示 (オンラインATS＋全店舗ステータス) |
| 店舗リストはモーダルのみ・絞り込み不可 | 地域・店舗名・ステータスで絞り込み、結果コピー＆共有リンク |
| 日本語のみ | **日英切替** |
| 店舗在庫は09:00 JST更新の日次データ | UIもその前提でシンプルに: 開くたび最新取得、見張り機能なし |

実測例 (どの商品にも使えます。URLかJANを貼るだけ):

| SKU | オンライン | 店舗 |
|---|---|---|
| `4550586333697` | あり (ATS 198) | あり4店＋問合せ23 |
| `4550586333055` | なし (ATS 0) | 45店すべてなし |

## 開発 (development)

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## デプロイ (deploy)

- **Vercel (推奨)**: リポジトリを import するだけ (zero-config)。
  pnpm は lockfileVersion (9.0) から自動で 9/10 が選ばれる。
  環境変数は任意: `NEXT_TELEMETRY_DISABLED=1` + `DSSF_*` (`.env.example` 参照)。
  Node は `engines` (22.x) で固定。
- **Docker / VPS**: `Dockerfile` (公式パターン, `output: standalone` は
  Docker ビルド時のみ有効)
  ```bash
  docker build -t dssf . && docker run -p 3000:3000 dssf
  ```

API + routes:

```
GET /                        ツール本体 (モバイルファースト、lgで2カラム結果)
GET /api/check?sku=4550586333055                  -> 単品レポート
GET /api/check?skus=<JAN>,<JAN>                   -> 複数レポート ({ results }, 最大4件)
```

## 仕組み (how it works)

`store.disney.co.jp` は Salesforce Commerce Cloud (Demandware) 製:

```
GET .../ja_JP/Product-Variation?pid=<SKU>&quantity=1
 -> product.available / availability.ATS / price / images / rating /
    favoritesCountHtml / releaseDateTime / descriptionFor{Size,Material,…} /
    enableStoreStock (falseでも店舗データは存在する!) / addToCartButtonState

GET .../ja_JP/Product-FindInStore?sku=<SKU>
 -> { templateContent: "#findInStoreListAccordion" のHTML, error }
 -> 地域9区分 × 各行 <a class="store-name">＋<span class="inventory-stock-status">
 -> あり / なし / 店舗問合せ (それ以外は催事などのイベント行として分離)
```

`app/api/check/route.ts` が同一生成元プロキシとして中継
(Disney は CORS ヘッダーを返さないためブラウザ直叩き不可)。
`lib/disney.ts` は framework-free (vitest で単体テスト) → `lib/disney.test.ts`。

## 構成

```
app/                  App Router (page, layout, error, api/check/route)
components/           stock-finder (client boundary) + dossier/store-list/accordion
lib/                  disney.ts (scrape) / config.ts (env) / readings.ts / format.ts / variants.ts
Dockerfile            公式 with-docker パターン準拠 (standalone, Docker時のみ)
.github/workflows/ci.yml  lint → typecheck → test → build
```

- 店舗案内 (公式): https://www.disney.co.jp/store/storeinfo.html
- 再入荷 (公式): https://store.disney.co.jp/restock/
- ゲストセンター: 0570-01-3932 (平日 9:00–17:00 / 土 9:00–13:00)

非公式ツールです。在庫は変動します。最終確認は必ず店舗へ。
Unofficial tool. Stock changes constantly — always confirm with the store.
