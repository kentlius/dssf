/**
 * Kana + romaji readings for store / region names.
 *
 * The upstream API returns kanji/katakana names only, so keyword search
 * would require users to type exact kanji. This table lets hiragana,
 * katakana, and romaji queries match too ("shibuya", "しぶや", "シブヤ",
 * "渋谷" all find 渋谷公園通り店).
 *
 * Coverage is best-effort: unknown or renamed stores fall back to plain
 * kanji substring matching, so search never breaks — it just needs kanji
 * for stores missing here. Keep in sync when the store list changes.
 */

export interface Reading {
  /** Hiragana, no spaces (katakana names converted). */
  kana: string;
  /** Lowercase space-joined romaji + common aliases. */
  romaji: string;
}

export const REGION_READINGS: Record<string, Reading> = {
  "北海道": { kana: "ほっかいどう", romaji: "hokkaido" },
  "東北地方": { kana: "とうほくちほう", romaji: "tohoku" },
  "東京都": { kana: "とうきょうと", romaji: "tokyo" },
  "関東地方": { kana: "かんとうちほう", romaji: "kanto" },
  "関東地方(東京除く)": { kana: "かんとうちほうとうきょうのぞく", romaji: "kanto" },
  "中部地方": { kana: "ちゅうぶちほう", romaji: "chubu" },
  "近畿地方": { kana: "きんきちほう", romaji: "kinki" },
  "中国地方": { kana: "ちゅうごくちほう", romaji: "chugoku" },
  "九州地方": { kana: "きゅうしゅうちほう", romaji: "kyushu" },
  "その他": { kana: "ほか", romaji: "other" },
};

export const STORE_READINGS: Record<string, Reading> = {
  "札幌ステラプレイス店": { kana: "さっぽろすてらぷれいすてん", romaji: "sapporo sutera pureisu stella place" },
  "仙台東映プラザ店": { kana: "せんだいとうえいぷらざてん", romaji: "sendai touei puraza" },
  "仙台ザ・モール長町店": { kana: "せんだいざもーるながまちてん", romaji: "sendai za mooru nagamachi mall" },
  "渋谷公園通り店": { kana: "しぶやこうえんどおりてん", romaji: "shibuya kouen doori" },
  "昭島モリタウン店": { kana: "あきしまもりたうんてん", romaji: "akishima mori taun town" },
  "ららぽーと立川立飛店": { kana: "ららぽーとたちかわたちひてん", romaji: "lalaport rarapooto tachikawa tachihi" },
  "フラッグシップ東京": { kana: "ふらっぐしっぷとうきょう", romaji: "furaggushippu tokyo flagship" },
  "東京スカイツリータウン・ソラマチ店": {
    kana: "とうきょうすかいつりーたうんそらまちてん",
    romaji: "tokyo sukaitsurii taun soramachi skytree town",
  },
  "町田モディ店": { kana: "まちだもでぃてん", romaji: "machida modi" },
  "お台場アクアシティ店": { kana: "おだいばあくあしてぃてん", romaji: "odaiba akua shiti aquacity aqua city" },
  "池袋サンシャインシティアルパ店": {
    kana: "いけぶくろさんしゃいんしてぃあるぱてん",
    romaji: "ikebukuro sanshain shiti arupa sunshine city" },
  "新宿高島屋店": { kana: "しんじゅくたかしまやてん", romaji: "shinjuku takashimaya" },
  "土浦イオンモール店": { kana: "つちうらいおんもーるてん", romaji: "tsuchiura ion mooru aeon mall" },
  "宇都宮福田屋ショッピングプラザ店": {
    kana: "うつのみやふくだやしょっぴんぐぷらざてん",
    romaji: "utsunomiya fukudaya shoppingu puraza shopping plaza",
  },
  "太田イオンモール店": { kana: "おおたいおんもーるてん", romaji: "ota ion mooru aeon mall" },
  "大宮アルシェ店": { kana: "おおみやあるしぇてん", romaji: "omiya arushe" },
  "越谷イオンレイクタウン店": {
    kana: "こしがやいおんれいくたうんてん",
    romaji: "koshigaya ion reiku taun aeon lake town",
  },
  "羽生イオンモール店": { kana: "はにゅういおんもーるてん", romaji: "hanyu hanyuu ion mooru aeon mall" },
  "川口アリオ店": { kana: "かわぐちありおてん", romaji: "kawaguchi ario" },
  "三井アウトレットパーク木更津": {
    kana: "みついあうとれっとぱーくきさらづてん",
    romaji: "mitsui autoretto paaku kisarazu outlet park",
  },
  "船橋ららぽーとTOKYO-BAY店": {
    kana: "ふなばしららぽーととうきょうべいてん",
    romaji: "funabashi lalaport rarapooto tokyo bay",
  },
  "東京ディズニーリゾート店": {
    kana: "とうきょうでぃずにーりぞーとてん",
    romaji: "tokyo disney resort tdr disne resort",
  },
  "横浜そごう店": { kana: "よこはまそごうてん", romaji: "yokohama sogou sogo" },
  "ららぽーと横浜店": { kana: "ららぽーとよこはまてん", romaji: "lalaport rarapooto yokohama" },
  "クイーンズスクエア横浜店": {
    kana: "くいーんずすくえあよこはまてん",
    romaji: "queens kuinzu sukuea square yokohama",
  },
  "新潟万代ビルボードプレイス店": {
    kana: "にいがたばんだいびるぼーどぷれいすてん",
    romaji: "niigata bandai biruboodo pureisu billboard place",
  },
  "軽井沢・プリンスショッピングプラザ店": {
    kana: "かるいざわぷりんすしょっぴんぐぷらざてん",
    romaji: "karuizawa purinsu shoppingu puraza prince shopping plaza",
  },
  "岐阜マーサ店": { kana: "ぎふまーさてん", romaji: "gifu maasa" },
  "浜松遠鉄店": { kana: "はままつえんてつてん", romaji: "hamamatsu entetsu" },
  "ららぽーと沼津店": { kana: "ららぽーとぬまづてん", romaji: "lalaport rarapooto numazu" },
  "岡崎イオンモール店": { kana: "おかざきいおんもーるてん", romaji: "okazaki ion mooru aeon mall" },
  "名古屋ゲートタワーモール店": {
    kana: "なごやげーとたわーもーるてん",
    romaji: "nagoya geeto tawaa mooru gate tower mall",
  },
  "大高イオンモール店": { kana: "おおだかいおんもーるてん", romaji: "odaka oodaka ion mooru aeon mall" },
  "草津イオンモール店": { kana: "くさついおんもーるてん", romaji: "kusatsu ion mooru aeon mall" },
  "京都四条河原町店": { kana: "きょうとしじょうかわらまちてん", romaji: "kyoto shijou kawaramachi" },
  "あべのキューズモール店": { kana: "あべのきゅーずもーるてん", romaji: "abeno kyuuzu mooru qs mall" },
  "ルクア大阪店": { kana: "るくあおおさかてん", romaji: "rukua osaka lucua" },
  "梅田HEP FIVE店": { kana: "うめだへっぷふぁいぶてん", romaji: "umeda heppu faibu hep five" },
  "三宮クレフィ店": { kana: "さんのみやくれふぃてん", romaji: "sannomiya sannomiya kurefi" },
  "橿原イオンモール店": { kana: "かしはらいおんもーるてん", romaji: "kashihara ion mooru aeon mall" },
  "岡山イオンモール店": { kana: "おかやまいおんもーるてん", romaji: "okayama ion mooru aeon mall" },
  "ミナモア広島店": { kana: "みなもあひろしまてん", romaji: "minamoa hiroshima" },
  "アミュプラザ博多店": { kana: "あみゅぷらざはかたてん", romaji: "amyu puraza hakata amu plaza" },
  "福岡パルコ店": { kana: "ふくおかぱるこてん", romaji: "fukuoka paruko parco" },
  "博多キャナルシティ店": {
    kana: "はかたきゃなるしてぃてん",
    romaji: "hakata kyanaru shiti canal city",
  },
};

/** Katakana → hiragana, づ→ず / ぢ→じ, strip separators. Keeps kanji as-is. */
export function normalizeKana(input: string): string {
  return String(input ?? "")
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/づ/g, "ず")
    .replace(/ぢ/g, "じ")
    .replace(/[\s・･\-_．.、。〈〉＜＞()（）「」『』〜～]/g, "");
}

/** Lowercase latin letters only (for romaji matching). */
export function normalizeRomaji(input: string): string {
  return String(input ?? "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function readingMatches(reading: Reading | undefined, kwKana: string, kwRomaji: string): boolean {
  if (!reading) return false;
  if (kwKana && normalizeKana(reading.kana).includes(kwKana)) return true;
  if (kwRomaji && normalizeRomaji(reading.romaji).includes(kwRomaji)) return true;
  return false;
}

/**
 * Keyword match for one store: raw kanji substring always works;
 * hiragana/katakana matches the kana reading; latin matches romaji.
 * Region names match too, so "tokyo" / "きんき" filter whole regions.
 */
export function storeMatchesKeyword(name: string, region: string, keyword: string): boolean {
  const raw = String(keyword ?? "").trim();
  if (!raw) return true;
  if (name.includes(raw) || region.includes(raw)) return true;
  const kwKana = normalizeKana(raw);
  const kwRomaji = normalizeRomaji(raw);
  if (readingMatches(STORE_READINGS[name], kwKana, kwRomaji)) return true;
  const regionBase = region.replace(/\(.*\)/, "");
  if (
    readingMatches(REGION_READINGS[region] ?? REGION_READINGS[regionBase], kwKana, kwRomaji)
  ) {
    return true;
  }
  return false;
}
