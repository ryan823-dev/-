import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

// 配置 Inter 字体，添加 display swap 并捕获错误
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: false, // 禁用预加载避免构建时网络问题
});

// 主域名 SEO/GEO 优化配置
export const metadata: Metadata = {
  // 基础 SEO
  title: {
    default: "VertaX · AI 驱动的企业出海增长引擎",
    template: "%s | VertaX",
  },
  description: "VertaX 是 AI 驱动的企业出海获客与增长引擎，帮助 B2B 企业通过智能客户画像、全球渠道发现、自动化外联实现海外业务增长。",
  
  // 搜索引擎收录控制
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
    },
  },
  
  // 规范化 URL
  metadataBase: new URL('https://vertax.top'),
  alternates: {
    canonical: '/',
  },
  
  // Open Graph (社交媒体分享)
  openGraph: {
    title: "VertaX · AI 驱动的企业出海增长引擎",
    description: "帮助 B2B 企业通过智能客户画像、全球渠道发现、自动化外联实现海外业务增长",
    url: "https://vertax.top",
    siteName: "VertaX",
    locale: 'zh_CN',
    type: 'website',
  },
  
  // Twitter Cards
  twitter: {
    card: 'summary_large_image',
    title: "VertaX · AI 驱动的企业出海增长引擎",
    description: "帮助 B2B 企业通过智能客户画像、全球渠道发现、自动化外联实现海外业务增长",
  },
  
  // 其他 SEO 标签
  keywords: [
    'B2B 获客',
    '企业出海',
    'AI 营销',
    '客户画像',
    '海外获客',
    '外贸获客',
    '智能营销',
    '销售自动化',
    'CRM',
    '营销自动化',
  ].join(', '),
  
  // 作者信息
  authors: [
    {
      name: 'VertaX Team',
      url: 'https://vertax.top',
    },
  ],
  
  // 创建者和发布者
  creator: 'VertaX',
  publisher: 'VertaX',
  
  // 格式检测
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  
  // 图标
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
