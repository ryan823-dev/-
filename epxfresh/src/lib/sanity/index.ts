import { sanityClient, queries } from './client'

// Types
export interface Product {
  _id: string
  name: string
  slug: { current: string }
  description: string
  longDescription?: string
  price: number
  category: string
  categorySlug?: string
  rating?: number
  reviewCount?: number
  badge?: string
  inStock?: boolean
  image?: string
  features?: string[]
  specifications?: { label: string; value: string }[]
}

export interface Category {
  _id: string
  name: string
  slug: { current: string }
  description?: string
}

export interface FAQ {
  _id: string
  question: string
  answer: string
  category: string
}

export interface Testimonial {
  _id: string
  name: string
  company?: string
  role?: string
  quote: string
  rating?: number
  image?: string
}

export interface Certification {
  _id: string
  name: string
  standard?: string
  description?: string
  reportId?: string
  status: string
  tests?: string[]
}

// Data fetching functions
export async function getProducts(): Promise<Product[]> {
  try {
    return await sanityClient.fetch(queries.allProducts)
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    return await sanityClient.fetch(queries.productBySlug, { slug })
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    return await sanityClient.fetch(queries.featuredProducts)
  } catch (error) {
    console.error('Error fetching featured products:', error)
    return []
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    return await sanityClient.fetch(queries.allCategories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

export async function getFAQs(): Promise<FAQ[]> {
  try {
    return await sanityClient.fetch(queries.allFAQs)
  } catch (error) {
    console.error('Error fetching FAQs:', error)
    return []
  }
}

export async function getTestimonials(): Promise<Testimonial[]> {
  try {
    return await sanityClient.fetch(queries.allTestimonials)
  } catch (error) {
    console.error('Error fetching testimonials:', error)
    return []
  }
}

export async function getCertifications(): Promise<Certification[]> {
  try {
    return await sanityClient.fetch(queries.allCertifications)
  } catch (error) {
    console.error('Error fetching certifications:', error)
    return []
  }
}

export async function getSiteSettings() {
  try {
    return await sanityClient.fetch(queries.siteSettings)
  } catch (error) {
    console.error('Error fetching site settings:', error)
    return null
  }
}
