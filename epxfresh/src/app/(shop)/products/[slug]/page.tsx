import { Metadata } from "next"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { 
  Star, 
  ShoppingCart, 
  Heart, 
  Share2, 
  Truck, 
  Shield, 
  RotateCcw,
  CheckCircle,
  Minus,
  Plus,
  ArrowLeft
} from "lucide-react"
import { formatPrice, BRAND_CONFIG } from "@/lib/utils"
import { generateProductSchema, generateBreadcrumbSchema } from "@/lib/seo/schema"

// Temporary static product data - will be replaced with Sanity CMS
const products: Record<string, {
  name: string
  description: string
  longDescription: string
  price: number
  category: string
  rating: number
  reviewCount: number
  features: string[]
  specifications: { label: string; value: string }[]
  inStock: boolean
}> = {
  "household-fresh-keeping-bags": {
    name: "Household Fresh-Keeping Bags",
    description: "Perfect for everyday home use. Keep fruits and vegetables fresh longer with our signature fresh-keeping technology.",
    longDescription: "Our Household Fresh-Keeping Bags are designed for everyday use in your kitchen. Using advanced micro-environment management technology, these bags create optimal storage conditions that extend the freshness of your fruits and vegetables by 50-200% compared to standard storage methods. Made from FDA and EU certified food-safe materials, these bags are perfect for health-conscious families who want to reduce food waste and save money on groceries.",
    price: 24.99,
    category: "Household",
    rating: 4.8,
    reviewCount: 128,
    features: [
      "Extends freshness 50-200%",
      "FDA & EU certified food-safe",
      "Reusable up to 10 times",
      "Multiple sizes included",
      "BPA-free materials",
      "Easy to use and clean",
    ],
    specifications: [
      { label: "Package Contents", value: "20 bags (mixed sizes)" },
      { label: "Small Bag Size", value: "20 x 30 cm" },
      { label: "Medium Bag Size", value: "25 x 35 cm" },
      { label: "Large Bag Size", value: "30 x 40 cm" },
      { label: "Material", value: "Food-grade PE" },
      { label: "Certifications", value: "FDA, EU, CNAS" },
    ],
    inStock: true,
  },
  "multi-size-pack": {
    name: "Multi-Size Pack",
    description: "Various sizes for different produce types. Great value bundle with small, medium, and large bags.",
    longDescription: "The Multi-Size Pack offers excellent value with a variety of bag sizes to accommodate different types of produce. Whether you're storing berries, leafy greens, or larger vegetables, this pack has the right size for your needs. Each bag features our advanced fresh-keeping technology to maximize produce shelf life.",
    price: 34.99,
    category: "Bundles",
    rating: 4.7,
    reviewCount: 89,
    features: [
      "3 different sizes",
      "30 bags total",
      "Best value pack",
      "Color-coded sizes",
      "Resealable design",
    ],
    specifications: [
      { label: "Package Contents", value: "30 bags (10 each size)" },
      { label: "Small Bag Size", value: "20 x 30 cm" },
      { label: "Medium Bag Size", value: "25 x 35 cm" },
      { label: "Large Bag Size", value: "30 x 40 cm" },
      { label: "Material", value: "Food-grade PE" },
    ],
    inStock: true,
  },
}

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = products[slug]
  
  if (!product) {
    return { title: "Product Not Found" }
  }

  return {
    title: `${product.name} | ${BRAND_CONFIG.brandName}`,
    description: product.description,
    openGraph: {
      title: `${product.name} | ${BRAND_CONFIG.brandName}`,
      description: product.description,
      type: "website",
      images: [`/products/${slug}.png`],
    },
  }
}

export async function generateStaticParams() {
  return Object.keys(products).map((slug) => ({ slug }))
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = products[slug]

  if (!product) {
    notFound()
  }

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            generateProductSchema({
              name: product.name,
              description: product.description,
              image: `/products/${slug}.png`,
              slug: slug,
              price: product.price,
              category: product.category,
              rating: { value: product.rating, count: product.reviewCount },
              inStock: product.inStock,
            }),
            generateBreadcrumbSchema([
              { name: "Home", url: "/" },
              { name: "Shop", url: "/shop" },
              { name: product.name, url: `/products/${slug}` },
            ]),
          ]),
        }}
      />

      <div className="section-padding">
        <div className="container-professional">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <Link href="/shop" className="text-gray-500 hover:text-fresh-600 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Shop
            </Link>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Product Image */}
            <div>
              <div className="aspect-square bg-gradient-to-br from-fresh-50 to-eco-50 rounded-3xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-fresh-500 to-eco-500 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-20 h-20 text-white">
                      <path
                        fill="currentColor"
                        d="M50 5 C25 5 5 25 5 50 C5 75 25 95 50 95 C75 95 95 75 95 50 C95 25 75 5 50 5 Z M50 15 C70 15 85 30 85 50 C85 70 70 85 50 85 C30 85 15 70 15 50 C15 30 30 15 50 15 Z M50 25 L55 45 L75 50 L55 55 L50 75 L45 55 L25 50 L45 45 Z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500">Product Image</p>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div>
              {/* Category */}
              <p className="text-sm text-fresh-600 font-medium mb-2">{product.category}</p>
              
              {/* Title */}
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating)
                          ? "text-warm-500 fill-warm-500"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600">
                  {product.rating} ({product.reviewCount} reviews)
                </span>
              </div>
              
              {/* Price */}
              <div className="text-3xl font-bold text-gray-900 mb-6">
                {formatPrice(product.price)}
              </div>
              
              {/* Description */}
              <p className="text-gray-600 mb-6">
                {product.longDescription}
              </p>

              {/* Features */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Key Features</h3>
                <ul className="grid sm:grid-cols-2 gap-2">
                  {product.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-fresh-600 shrink-0" />
                      <span className="text-gray-600 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Add to Cart */}
              <Card variant="premium" className="p-6 mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button className="p-3 hover:bg-gray-50">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 font-semibold">1</span>
                    <button className="p-3 hover:bg-gray-50">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <Button className="flex-1" size="lg">
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Add to Cart
                  </Button>
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1">
                    <Heart className="w-4 h-4 mr-2" />
                    Wishlist
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </Card>

              {/* Guarantees */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-cream rounded-xl">
                  <Truck className="w-6 h-6 text-fresh-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Free Shipping</p>
                </div>
                <div className="p-4 bg-cream rounded-xl">
                  <Shield className="w-6 h-6 text-fresh-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">FDA Certified</p>
                </div>
                <div className="p-4 bg-cream rounded-xl">
                  <RotateCcw className="w-6 h-6 text-fresh-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">30-Day Returns</p>
                </div>
              </div>
            </div>
          </div>

          {/* Specifications */}
          <Card variant="premium" className="mt-12 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Specifications</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {product.specifications.map((spec) => (
                <div key={spec.label} className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">{spec.label}</span>
                  <span className="font-medium text-gray-900">{spec.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
