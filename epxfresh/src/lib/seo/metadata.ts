import { Metadata } from "next"
import { BRAND_CONFIG, getAbsoluteUrl } from "@/lib/utils"

interface PageSEO {
  title: string
  description: string
  path: string
  image?: string
}

export function generatePageMetadata({ title, description, path, image }: PageSEO): Metadata {
  const url = getAbsoluteUrl(path)
  const ogImage = image || "/og-image.png"
  
  return {
    title: `${title} | ${BRAND_CONFIG.brandName}`,
    description,
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
    ],
    authors: [{ name: BRAND_CONFIG.brandName }],
    creator: BRAND_CONFIG.brandName,
    publisher: BRAND_CONFIG.legalCompanyName,
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: BRAND_CONFIG.brandName,
      title: `${title} | ${BRAND_CONFIG.brandName}`,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${BRAND_CONFIG.brandName} - ${title}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${BRAND_CONFIG.brandName}`,
      description,
      images: [ogImage],
      creator: "@EPXFresh",
    },
    alternates: {
      canonical: url,
    },
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
  }
}

export const homeMetadata: Metadata = generatePageMetadata({
  title: "Advanced Fresh-Keeping Packaging Solutions",
  description: "EPXFresh offers FDA & EU certified fresh-keeping packaging solutions for produce businesses and households. Reduce food waste with our innovative technology.",
  path: "/",
})

export const aboutMetadata: Metadata = generatePageMetadata({
  title: "About Us",
  description: "Learn about EPXFresh - a leading provider of advanced fresh-keeping packaging solutions. FDA & EU certified, serving customers in 50+ countries.",
  path: "/about",
})

export const wholesaleMetadata: Metadata = generatePageMetadata({
  title: "Wholesale & Bulk Orders",
  description: "Get wholesale pricing on fresh-keeping packaging for your business. OEM/Private Label services available. Request a quote today.",
  path: "/wholesale",
})

export const technologyMetadata: Metadata = generatePageMetadata({
  title: "Our Technology",
  description: "Discover EPXFresh's innovative fresh-keeping technology. Micro-environment management for optimal produce storage and extended freshness.",
  path: "/technology",
})

export const certificationsMetadata: Metadata = generatePageMetadata({
  title: "Certifications & Compliance",
  description: "EPXFresh products are FDA & EU certified for food contact safety. View our test reports and compliance documentation.",
  path: "/certifications",
})

export const contactMetadata: Metadata = generatePageMetadata({
  title: "Contact Us",
  description: "Get in touch with EPXFresh for wholesale inquiries, OEM services, or product questions. We respond within 1-2 business days.",
  path: "/contact",
})

export const shopMetadata: Metadata = generatePageMetadata({
  title: "Shop Fresh-Keeping Products",
  description: "Shop EPXFresh household fresh-keeping bags and storage solutions. FDA certified, eco-friendly packaging for your kitchen.",
  path: "/shop",
})

export const faqMetadata: Metadata = generatePageMetadata({
  title: "Frequently Asked Questions",
  description: "Find answers to common questions about EPXFresh products, orders, shipping, and fresh-keeping technology.",
  path: "/faq",
})
