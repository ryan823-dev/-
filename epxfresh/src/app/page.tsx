import { Hero } from "@/components/marketing/hero"
import { TrustStrip } from "@/components/marketing/trust-strip"
import { DualEntry } from "@/components/marketing/dual-entry"
import { WhyChoose } from "@/components/marketing/why-choose"
import { CertificationsPreview } from "@/components/marketing/certifications-preview"
import { ProductCard, Product } from "@/components/shop/product-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, MessageCircle } from "lucide-react"
import { homeMetadata } from "@/lib/seo/metadata"
import { generateOrganizationSchema, generateWebSiteSchema } from "@/lib/seo/schema"

export const metadata = homeMetadata

// Temporary static products - will be replaced with Sanity CMS
const featuredProducts: Product[] = [
  {
    id: "1",
    name: "Household Fresh-Keeping Bags",
    slug: "household-fresh-keeping-bags",
    description: "Perfect for everyday home use. Keep fruits and vegetables fresh longer.",
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
    description: "Various sizes for different produce types. Great value bundle.",
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
    description: "Complete solution for family produce storage needs.",
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
    description: "Try our fresh-keeping bags with this affordable starter kit.",
    price: 14.99,
    category: "Starter",
    rating: 4.6,
    reviewCount: 234,
    inStock: true,
  },
]

export default function HomePage() {
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            generateOrganizationSchema(),
            generateWebSiteSchema(),
          ]),
        }}
      />

      {/* Hero Section */}
      <Hero />

      {/* Trust Strip */}
      <TrustStrip />

      {/* Dual Entry */}
      <DualEntry />

      {/* Why Choose */}
      <WhyChoose />

      {/* Featured Products */}
      <section className="section-padding bg-cream">
        <div className="container-professional">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
            <div>
              <h2 className="text-section text-gray-900 mb-2">
                Best Sellers
              </h2>
              <p className="text-gray-600">
                Our most popular household fresh-keeping solutions
              </p>
            </div>
            <Link href="/shop" className="mt-4 sm:mt-0">
              <Button variant="outline">
                View All Products
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Certifications Preview */}
      <CertificationsPreview />

      {/* Wholesale CTA */}
      <section className="section-padding bg-gradient-to-r from-eco-600 to-eco-700 text-white">
        <div className="container-professional text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Looking for Bulk Orders or Custom Packaging?
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto mb-8">
            We offer wholesale pricing, OEM/Private Label services, and custom solutions 
            for businesses of all sizes. Request a quote today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/wholesale">
              <Button size="lg" className="bg-white text-eco-700 hover:bg-gray-100">
                Request a Quote
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Talk to Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="section-padding bg-white">
        <div className="container-professional">
          <div className="text-center mb-10">
            <h2 className="text-section text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600">
              Find answers to common questions about our products
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-cream rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                How do EPXFresh bags work?
              </h3>
              <p className="text-gray-600 text-sm">
                Our bags use advanced micro-environment management technology to create 
                optimal storage conditions, managing moisture and gas exchange for extended freshness.
              </p>
            </div>
            <div className="bg-cream rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Are the bags food-safe?
              </h3>
              <p className="text-gray-600 text-sm">
                Yes! All our products are FDA & EU certified for food contact safety. 
                Test reports are available upon request.
              </p>
            </div>
            <div className="bg-cream rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Do you offer wholesale pricing?
              </h3>
              <p className="text-gray-600 text-sm">
                Absolutely! We offer competitive wholesale pricing, OEM services, and 
                custom solutions for businesses. Contact us for a quote.
              </p>
            </div>
            <div className="bg-cream rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                What produce can I store?
              </h3>
              <p className="text-gray-600 text-sm">
                Our bags are suitable for most fruits and vegetables including leafy greens, 
                berries, citrus, root vegetables, and more.
              </p>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/faq">
              <Button variant="outline">
                View All FAQs
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding bg-slate-900 text-white">
        <div className="container-professional">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Ready to Extend Freshness?
              </h2>
              <p className="text-gray-300 mb-6">
                Join thousands of households and businesses who trust EPXFresh 
                for their fresh-keeping needs. Start reducing food waste today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/shop">
                  <Button size="lg" className="w-full sm:w-auto">
                    Shop Household Products
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/wholesale">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10">
                    Request Bulk Quote
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="w-64 h-64 rounded-full bg-gradient-to-br from-fresh-500/20 to-eco-500/20 flex items-center justify-center">
                <MessageCircle className="w-32 h-32 text-fresh-400/50" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
