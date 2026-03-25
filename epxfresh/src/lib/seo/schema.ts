import { BRAND_CONFIG, getAbsoluteUrl } from "@/lib/utils"

/**
 * Organization Schema
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": getAbsoluteUrl("#organization"),
    name: BRAND_CONFIG.brandName,
    alternateName: BRAND_CONFIG.legalCompanyName,
    description: BRAND_CONFIG.brandTagline,
    url: getAbsoluteUrl(""),
    logo: getAbsoluteUrl("/logo.png"),
    contactPoint: {
      "@type": "ContactPoint",
      email: BRAND_CONFIG.contact.email,
      contactType: "customer service",
      availableLanguage: ["English", "Chinese"],
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: BRAND_CONFIG.contact.address,
      addressLocality: "Guangzhou",
      addressRegion: "Guangdong",
      addressCountry: "CN",
    },
    sameAs: [
      "https://www.linkedin.com/company/epxfresh",
      "https://www.facebook.com/epxfresh",
      "https://www.instagram.com/epxfresh",
    ],
  }
}

/**
 * WebSite Schema
 */
export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND_CONFIG.brandName,
    url: getAbsoluteUrl(""),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: getAbsoluteUrl("/search?q={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  }
}

/**
 * Product Schema
 */
export interface ProductSchemaData {
  name: string
  description: string
  image: string
  slug: string
  price: number
  currency?: string
  inStock?: boolean
  category?: string
  sku?: string
  rating?: {
    value: number
    count: number
  }
}

export function generateProductSchema(product: ProductSchemaData) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": getAbsoluteUrl(`/products/${product.slug}#product`),
    name: product.name,
    description: product.description,
    image: product.image,
    brand: {
      "@type": "Brand",
      name: BRAND_CONFIG.brandName,
    },
    category: product.category,
    sku: product.sku,
    aggregateRating: product.rating
      ? {
          "@type": "AggregateRating",
          ratingValue: product.rating.value,
          reviewCount: product.rating.count,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
    offers: {
      "@type": "Offer",
      url: getAbsoluteUrl(`/products/${product.slug}`),
      priceCurrency: product.currency || "USD",
      price: product.price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: BRAND_CONFIG.brandName,
      },
    },
  }
}

/**
 * FAQ Schema
 */
export interface FAQItem {
  question: string
  answer: string
}

export function generateFAQSchema(faqs: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }
}

/**
 * Breadcrumb Schema
 */
export interface BreadcrumbItem {
  name: string
  url: string
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: getAbsoluteUrl(item.url),
    })),
  }
}

/**
 * LocalBusiness Schema
 */
export function generateLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": getAbsoluteUrl("#business"),
    name: BRAND_CONFIG.brandName,
    description: BRAND_CONFIG.brandTagline,
    url: getAbsoluteUrl(""),
    telephone: BRAND_CONFIG.contact.phone,
    email: BRAND_CONFIG.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: BRAND_CONFIG.contact.address,
      addressLocality: "Guangzhou",
      addressRegion: "Guangdong",
      addressCountry: "CN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "23.1291",
      longitude: "113.2644",
    },
    openingHours: "Mo-Fr 09:00-18:00",
    priceRange: "$$",
  }
}

/**
 * Combine multiple schemas into a script tag content
 */
export function combineSchemas(...schemas: object[]) {
  return JSON.stringify(schemas.length === 1 ? schemas[0] : schemas)
}
