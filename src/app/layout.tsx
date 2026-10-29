import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

// 英文與數字使用 Geist，中文則交給 globals.css 中設定的系統字型
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AI 智慧記帳｜聰明管理你的每一筆收支",
    template: "%s｜AI 智慧記帳",
  },
  description:
    "AI 智慧記帳幫你輕鬆記錄收入與支出、自動統計消費分類，並透過 AI 分析消費習慣，提供個人化理財建議。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-Hant-TW" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
