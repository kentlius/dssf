import type { Metadata } from "next";
import { StockFinder } from "@/components/stock-finder";

export const metadata: Metadata = {
  title: "ディズニーストア 店舗在庫チェッカー | Disney Store Stock Finder",
  description:
    "商品URLか商品番号を貼るだけ。公式では隠される店舗在庫・全店舗の売切証明まで。",
};

export default function Home() {
  return <StockFinder />;
}
