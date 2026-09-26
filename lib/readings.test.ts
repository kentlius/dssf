import { describe, expect, it } from "vitest";
import { normalizeKana, normalizeRomaji, storeMatchesKeyword } from "./readings";

describe("normalizeKana", () => {
  it("converts katakana to hiragana and strips separators", () => {
    expect(normalizeKana("シブヤ")).toBe("しぶや");
    expect(normalizeKana("ららぽーと・沼津")).toBe("ららぽーと沼津");
    expect(normalizeKana("渋谷")).toBe("渋谷");
  });
});

describe("normalizeRomaji", () => {
  it("keeps lowercase latin only", () => {
    expect(normalizeRomaji("Shi-BuYa")).toBe("shibuya");
  });
});

describe("storeMatchesKeyword", () => {
  it("matches kanji substrings (existing behavior)", () => {
    expect(storeMatchesKeyword("渋谷公園通り店", "東京都", "渋谷")).toBe(true);
    expect(storeMatchesKeyword("渋谷公園通り店", "東京都", "梅田")).toBe(false);
  });
  it("matches hiragana, katakana, and romaji", () => {
    expect(storeMatchesKeyword("渋谷公園通り店", "東京都", "しぶや")).toBe(true);
    expect(storeMatchesKeyword("渋谷公園通り店", "東京都", "シブヤ")).toBe(true);
    expect(storeMatchesKeyword("渋谷公園通り店", "東京都", "shibuya")).toBe(true);
    expect(storeMatchesKeyword("渋谷公園通り店", "東京都", "SHIBUYA")).toBe(true);
  });
  it("matches aliases and regions", () => {
    expect(storeMatchesKeyword("東京ディズニーリゾート店", "関東地方(東京除く)", "tdr")).toBe(true);
    expect(storeMatchesKeyword("土浦イオンモール店", "関東地方(東京除く)", "aeon")).toBe(true);
    expect(storeMatchesKeyword("草津イオンモール店", "近畿地方", "kinki")).toBe(true);
    expect(storeMatchesKeyword("草津イオンモール店", "近畿地方", "きんき")).toBe(true);
    expect(storeMatchesKeyword("ららぽーと沼津店", "中部地方", "numazu")).toBe(true);
    expect(storeMatchesKeyword("ららぽーと沼津店", "中部地方", "ぬまづ")).toBe(true);
    expect(storeMatchesKeyword("ららぽーと沼津店", "中部地方", "ぬまず")).toBe(true);
  });
  it("falls back gracefully for unknown stores", () => {
    expect(storeMatchesKeyword("新店テスト店", "東京都", "新店")).toBe(true);
    expect(storeMatchesKeyword("新店テスト店", "東京都", "shinten")).toBe(false);
  });
  it("empty keyword matches everything", () => {
    expect(storeMatchesKeyword("渋谷公園通り店", "東京都", "  ")).toBe(true);
  });
});
