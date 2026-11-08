import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "무한 영어 학원 도우미",
  description: "영어 시험 자동 채점, 성적 분석, 유사 문항 생성 서비스",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><SiteHeader />{children}</body>
    </html>
  );
}
