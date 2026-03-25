import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format price to USD
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

/**
 * Generate slug from string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Truncate text
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

/**
 * Get absolute URL
 */
export function getAbsoluteUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://epxfresh.com'
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Brand configuration
 */
export const BRAND_CONFIG = {
  brandName: 'EPXFresh',
  brandTagline: 'Advanced Fresh-Keeping Packaging Solutions',
  legalCompanyName: 'Guangzhou EPXFresh Technology Co., LTD',
  chineseCompanyName: '广州亿品鲜技术有限公司',
  contact: {
    email: 'info@epxfresh.com',
    phone: '+86-XXX-XXXX-XXXX',
    whatsapp: '+86-XXX-XXXX-XXXX',
    address: '1604, Building F, No. 98, Xiangxue Eight Road, Huangpu District, Guangzhou City, China'
  }
} as const
