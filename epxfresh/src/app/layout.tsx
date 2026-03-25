import type { Metadata } from "next"
import "./globals.css"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { AIAssistant } from "@/components/ai/chat-widget"
import { BRAND_CONFIG } from "@/lib/utils"

export const metadata: Metadata = {
  metadataBase: new URL("https://epxfresh.com"),
  title: {
    default: `${BRAND_CONFIG.brandName} - Advanced Fresh-Keeping Packaging Solutions`,
    template: `%s | ${BRAND_CONFIG.brandName}`,
  },
  description: `${BRAND_CONFIG.brandName} offers FDA & EU certified fresh-keeping packaging solutions for produce businesses and households. Reduce food waste with our innovative technology.`,
  keywords: [
    "fresh-keeping bags",
    "produce packaging",
    "food preservation",
    "FDA certified bags",
    "EU food contact packaging",
    "household fresh-keeping",
    "commercial produce storage",
    "wholesale packaging",
    "OEM packaging",
    "EPXFresh",
    "亿品鲜",
  ],
  authors: [{ name: BRAND_CONFIG.brandName }],
  creator: BRAND_CONFIG.brandName,
  publisher: BRAND_CONFIG.legalCompanyName,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://epxfresh.com",
    siteName: BRAND_CONFIG.brandName,
    title: `${BRAND_CONFIG.brandName} - Advanced Fresh-Keeping Packaging Solutions`,
    description: "FDA & EU certified fresh-keeping packaging for produce businesses and households.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${BRAND_CONFIG.brandName} - Fresh-Keeping Packaging Solutions`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_CONFIG.brandName} - Fresh-Keeping Packaging`,
    description: "FDA & EU certified fresh-keeping packaging for businesses and homes.",
    images: ["/og-image.png"],
    creator: "@EPXFresh",
  },
  alternates: {
    canonical: "https://epxfresh.com",
  },
  verification: {
    google: "your-google-verification-code",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Theme Color */}
        <meta name="theme-color" content="#16a34a" />
      </head>
      <body className="min-h-full flex flex-col bg-cream font-sans">
        <Header />
        <main className="flex-1 pt-16 lg:pt-20">
          {children}
        </main>
        <Footer />
        <AIAssistant />
      </body>
    </html>
  )
}
