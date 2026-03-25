import { Metadata } from "next"
import { ProductCard, Product } from "@/components/shop/product-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ShoppingCart, Filter, ArrowRight } from "lucide-react"
import { shopMetadata } from "@/lib/seo/metadata"
import { generateOrganizationSchema, generateBreadcrumbSchema } from "@/lib/seo/schema"

export const metadata: Metadata = shopMetadata

// Temporary static products - will be replaced with Sanity CMS
const products: Product[] = [
  {
    id: "1",
    name: "Household Fresh-Keeping Bags",
    slug: "household-fresh-keeping-bags",
    description: "Perfect for everyday home use. Keep fruits and vegetables fresh longer with our signature fresh-keeping technology.",
    price: 24.99,
    category: "Household",
    rating: 4.8,
    reviewCount: 128,
    badge: "Best Seller",
    inStock: true,
  },
  {
    id: "2",
    name: "Multi-Size Pack",
    slug: "multi-size-pack",
    description: "Various sizes for different produce types. Great value bundle with small, medium, and large bags.",
    price: 34.99,
    category: "Bundles",
    rating: 4.7,
    reviewCount: 89,
    inStock: true,
  },
  {
    id: "3",
    name: "Family Freshness Set",
    slug: "family-freshness-set",
    description: "Complete solution for family produce storage needs. Includes bags in multiple sizes and storage containers.",
    price: 49.99,
    category: "Sets",
    rating: 4.9,
    reviewCount: 156,
    badge: "Popular",
    inStock: true,
  },
  {
    id: "4",
    name: "Starter Pack",
    slug: "starter-pack",
    description: "Try our fresh-keeping bags with this affordable starter kit. Perfect for first-time users.",
    price: 14.99,
    category: "Starter",
    rating: 4.6,
    reviewCount: 234,
    inStock: true,
  },
  {
    id: "5",
    name: "Professional Kitchen Set",
    slug: "professional-kitchen-set",
    description: "Designed for serious home cooks and small commercial kitchens. Heavy-duty bags with extended freshness technology.",
    price: 59.99,
    category: "Professional",
    rating: 4.8,
    reviewCount: 67,
    inStock: true,
  },
  {
    id: "6",
    name: "Berry Keeper Set",
    slug: "berry-keeper-set",
    description: "Specially designed for berries and delicate fruits. Optimal humidity control for maximum freshness.",
    price: 29.99,
    category: "Specialty",
    rating: 4.7,
    reviewCount: 112,
    badge: "New",
    inStock: true,
  },
  {
    id: "7",
    name: "Leafy Greens Pack",
    slug: "leafy-greens-pack",
    description: "Optimized for lettuce, spinach, and other leafy greens. Prevents wilting and extends crispness.",
    price: 27.99,
    category: "Specialty",
    rating: 4.8,
    reviewCount: 94,
    inStock: true,
  },
  {
    id: "8",
    name: "Eco-Friendly Bundle",
    slug: "eco-friendly-bundle",
    description: "Reusable and eco-conscious packaging. Made with sustainable materials without compromising performance.",
    price: 39.99,
    category: "Eco",
    rating: 4.9,
    reviewCount: 78,
    badge: "Eco Choice",
    inStock: true,
  },
]

const categories = [
  { name: "All Products", slug: "all" },
  { name: "Household", slug: "household" },
  { name: "Bundles", slug: "bundles" },
  { name: "Sets", slug: "sets" },
  { name: "Specialty", slug: "specialty" },
  { name: "Eco-Friendly", slug: "eco" },
]

export default function ShopPage() {
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            generateOrganizationSchema(),
            generateBreadcrumbSchema([
              { name: "Home", url: "/" },
              { name: "Shop", url: "/shop" },
            ]),
          ]),
        }}
      />

      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 bg-gradient-to-br from-fresh-600 to-eco-600 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        
        <div className="container-professional relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Shop Fresh-Keeping Products
            </h1>
            <p className="text-xl text-white/80">
              FDA & EU certified fresh-keeping solutions for your home. 
              Keep your fruits and vegetables fresh for longer.
            </p>
          </div>
        </div>
      </section>

      {/* Shop Content */}
      <section className="section-padding bg-cream">
        <div className="container-professional">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="lg:w-64 shrink-0">
              <div className="bg-white rounded-2xl p-6 sticky top-24">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Categories
                </h2>
                <ul className="space-y-2">
                  {categories.map((category) => (
                    <li key={category.slug}>
                      <button className="w-full text-left px-3 py-2 rounded-lg text-gray-600 hover:bg-fresh-50 hover:text-fresh-600 transition-colors">
                        {category.name}
                      </button>
                    </li>
                  ))}
                </ul>

                <hr className="my-6" />

                <div className="bg-fresh-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Need Bulk Orders?</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    We offer wholesale pricing for businesses and bulk buyers.
                  </p>
                  <Link href="/wholesale">
                    <Button variant="outline" size="sm" className="w-full">
                      View Wholesale
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600">
                  Showing <span className="font-semibold">{products.length}</span> products
                </p>
                <select className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm">
                  <option>Sort by: Featured</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Rating</option>
                </select>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wholesale CTA */}
      <section className="py-12 bg-white border-t border-gray-100">
        <div className="container-professional">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-eco-50 rounded-2xl p-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Looking for wholesale or custom solutions?
              </h3>
              <p className="text-gray-600">
                We offer bulk pricing, OEM services, and custom packaging for businesses.
              </p>
            </div>
            <Link href="/wholesale">
              <Button variant="secondary" className="whitespace-nowrap">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Wholesale Inquiries
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
