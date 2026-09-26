import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ディズニーストア 店舗在庫チェッカー",
    short_name: "在庫チェッカー",
    description:
      "商品URLか商品番号を貼るだけ。公式では隠される店舗在庫・全店舗の売切証明まで。",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f6fa",
    theme_color: "#f6f6fa",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
    // Android/ChromeOS: this app appears directly in the share sheet.
    // iOS has no Web Share Target — use the in-app iPhone Shortcut guide.
    share_target: {
      action: "/",
      method: "GET",
      params: {
        title: "title",
        text: "text",
        url: "url",
      },
    },
  };
}
