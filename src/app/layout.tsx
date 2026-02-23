import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SD Prompt Analyzer | Stable Diffusion プロンプト解析ツール",
  description: "xAI (Grok) のAPIを利用したStable Diffusionプロンプト解析・デバッグ用Webアプリケーション。Visionモデル対応。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        {children}
      </body>
    </html>
  );
}
