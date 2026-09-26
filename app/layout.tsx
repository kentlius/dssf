import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ディズニーストア 店舗在庫チェッカー",
    template: "%s | Disney Store Stock Finder",
  },
  description:
    "商品URLか商品番号を貼るだけ。公式では隠される店舗在庫・全店舗の売切証明まで。",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f6f6fa] text-zinc-900">{children}</body>
    </html>
  );
}
