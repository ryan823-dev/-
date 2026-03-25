import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'your-project-id',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: true,
  apiVersion: '2024-01-01',
})

const builder = imageUrlBuilder(sanityClient)

export function urlFor(source: any) {
  return builder.image(source)
}

// GROQ queries
export const queries = {
  // Products
  allProducts: `*[_type == "product"] | order(_createdAt desc) {
    _id,
    name,
    slug,
    description,
    price,
    "category": category->name,
    "categorySlug": category->slug,
    rating,
    reviewCount,
    badge,
    inStock,
    "image": image.asset->url,
    features,
  }`,
  
  productBySlug: `*[_type == "product" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    description,
    longDescription,
    price,
    "category": category->name,
    rating,
    reviewCount,
    badge,
    inStock,
    "image": image.asset->url,
    features,
    specifications,
  }`,
  
  featuredProducts: `*[_type == "product" && featured == true] | order(_createdAt desc)[0...8] {
    _id,
    name,
    slug,
    description,
    price,
    "category": category->name,
    rating,
    reviewCount,
    badge,
    inStock,
    "image": image.asset->url,
  }`,
  
  // Categories
  allCategories: `*[_type == "category"] | order(name asc) {
    _id,
    name,
    slug,
    description,
  }`,
  
  // FAQs
  allFAQs: `*[_type == "faq"] | order(order asc) {
    _id,
    question,
    answer,
    category,
  }`,
  
  // Testimonials
  allTestimonials: `*[_type == "testimonial"] | order(_createdAt desc) {
    _id,
    name,
    company,
    role,
    quote,
    rating,
    "image": image.asset->url,
  }`,
  
  // Certifications
  allCertifications: `*[_type == "certification"] | order(order asc) {
    _id,
    name,
    standard,
    description,
    reportId,
    status,
  }`,
  
  // Site Settings
  siteSettings: `*[_type == "siteSettings"][0] {
    siteName,
    siteDescription,
    contactEmail,
    contactPhone,
    address,
    socialLinks,
  }`,
}
