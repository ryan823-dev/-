import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { 
  Package, 
  Factory, 
  Users, 
  Truck, 
  Shield, 
  FileText,
  ArrowRight,
  CheckCircle,
  Building2,
  Globe
} from "lucide-react"
import { wholesaleMetadata } from "@/lib/seo/metadata"
import { generateOrganizationSchema, generateBreadcrumbSchema } from "@/lib/seo/schema"

export const metadata: Metadata = wholesaleMetadata

const wholesaleFeatures = [
  {
    icon: Package,
    title: "Bulk Supply",
    description: "Competitive wholesale pricing for large volume orders. Flexible MOQ options.",
  },
  {
    icon: Factory,
    title: "OEM / Private Label",
    description: "Custom branding, sizes, and specifications. Full product customization available.",
  },
  {
    icon: Users,
    title: "Distributor Partnerships",
    description: "Exclusive territory rights and marketing support for qualified distributors.",
  },
  {
    icon: Truck,
    title: "Supply Chain Ready",
    description: "Designed for cold chain, logistics, retail display, and warehouse storage.",
  },
]

const productLines = [
  {
    name: "Fresh-Keeping Bags - Professional Series",
    description: "Industrial-grade bags for supermarkets, distribution centers, and food processing.",
    applications: ["Supermarkets", "Distribution Centers", "Food Processing", "Cold Chain Logistics"],
  },
  {
    name: "Fresh-Keeping Film",
    description: "High-barrier film for commercial packaging applications.",
    applications: ["Retail Packaging", "Food Service", "Industrial Wrapping"],
  },
  {
    name: "Fresh-Keeping Trays",
    description: "Modified atmosphere packaging trays for premium produce presentation.",
    applications: ["Premium Retail", "Export Packaging", "Gift Packaging"],
  },
  {
    name: "Fresh-Keeping Paper",
    description: "Specialty paper for individual produce wrapping and protection.",
    applications: ["Individual Wrapping", "Export Quality", "Extended Storage"],
  },
]

const certifications = [
  { name: "FDA Compliance", id: "21 CFR Part 177.1520" },
  { name: "EU Compliance", id: "Regulation EU 10/2011" },
  { name: "CNAS Testing", id: "Third-party verified" },
  { name: "ISO 9001", id: "Quality Management" },
]

export default function WholesalePage() {
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
              { name: "Wholesale", url: "/wholesale" },
            ]),
          ]),
        }}
      />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-br from-eco-900 via-eco-800 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-eco-500/20 rounded-full blur-3xl" />
        
        <div className="container-professional relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-eco-200 text-sm mb-6">
              <Building2 className="w-4 h-4" />
              B2B Solutions
            </div>
            
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6">
              Wholesale &{" "}
              <span className="text-eco-300">Bulk Orders</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-2xl">
              Partner with EPXFresh for reliable fresh-keeping packaging solutions. 
              Competitive pricing, OEM services, and global supply capabilities.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/contact?type=wholesale">
                <Button size="lg" className="bg-white text-eco-700 hover:bg-gray-100">
                  Request a Quote
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="#products">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  View Product Lines
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-8 bg-eco-600 text-white">
        <div className="container-professional">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold">50+</div>
              <div className="text-eco-200 text-sm">Countries Served</div>
            </div>
            <div>
              <div className="text-3xl font-bold">500+</div>
              <div className="text-eco-200 text-sm">Business Partners</div>
            </div>
            <div>
              <div className="text-3xl font-bold">10M+</div>
              <div className="text-eco-200 text-sm">Units Delivered</div>
            </div>
            <div>
              <div className="text-3xl font-bold">15+</div>
              <div className="text-eco-200 text-sm">Years Experience</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding bg-white">
        <div className="container-professional">
          <div className="text-center mb-12">
            <h2 className="text-section text-gray-900 mb-4">
              Why Partner With Us?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We offer comprehensive B2B solutions backed by certified quality and reliable supply.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wholesaleFeatures.map((feature) => (
              <Card key={feature.title} variant="premium" className="p-6 text-center">
                <div className="w-14 h-14 rounded-xl bg-eco-100 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-eco-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Product Lines */}
      <section id="products" className="section-padding bg-cream">
        <div className="container-professional">
          <div className="text-center mb-12">
            <h2 className="text-section text-gray-900 mb-4">
              B2B Product Lines
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Professional-grade fresh-keeping solutions for commercial applications.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {productLines.map((product) => (
              <Card key={product.name} variant="premium" className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {product.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {product.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.applications.map((app) => (
                    <span
                      key={app}
                      className="px-3 py-1 bg-eco-50 text-eco-700 text-xs rounded-full"
                    >
                      {app}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* OEM Services */}
      <section className="section-padding bg-white">
        <div className="container-professional">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-section text-gray-900 mb-6">
                OEM / Private Label Services
              </h2>
              <p className="text-gray-600 mb-6">
                Create your own branded fresh-keeping products with our comprehensive 
                OEM and private label services. We handle everything from design to production.
              </p>
              
              <ul className="space-y-4 mb-8">
                {[
                  "Custom branding and packaging design",
                  "Custom sizes and specifications",
                  "Material customization options",
                  "Quality control and testing",
                  "Flexible production scheduling",
                  "Confidentiality agreements",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-eco-600 shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              
              <Link href="/contact?type=oem">
                <Button>
                  Discuss Your Project
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            
            <div className="bg-gradient-to-br from-eco-50 to-eco-100 rounded-3xl p-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-6 text-center">
                  <Factory className="w-10 h-10 text-eco-600 mx-auto mb-3" />
                  <div className="font-semibold text-gray-900">Custom Manufacturing</div>
                </div>
                <div className="bg-white rounded-2xl p-6 text-center">
                  <Shield className="w-10 h-10 text-eco-600 mx-auto mb-3" />
                  <div className="font-semibold text-gray-900">Certified Quality</div>
                </div>
                <div className="bg-white rounded-2xl p-6 text-center">
                  <Globe className="w-10 h-10 text-eco-600 mx-auto mb-3" />
                  <div className="font-semibold text-gray-900">Global Shipping</div>
                </div>
                <div className="bg-white rounded-2xl p-6 text-center">
                  <FileText className="w-10 h-10 text-eco-600 mx-auto mb-3" />
                  <div className="font-semibold text-gray-900">Documentation</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="section-padding bg-eco-50">
        <div className="container-professional">
          <div className="text-center mb-12">
            <h2 className="text-section text-gray-900 mb-4">
              Certifications & Compliance
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              All our products meet international food contact safety standards.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {certifications.map((cert) => (
              <div
                key={cert.name}
                className="bg-white rounded-2xl p-6 text-center shadow-sm"
              >
                <Shield className="w-10 h-10 text-eco-600 mx-auto mb-3" />
                <div className="font-semibold text-gray-900 mb-1">{cert.name}</div>
                <div className="text-xs text-gray-500">{cert.id}</div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/certifications">
              <Button variant="outline">
                View Test Reports
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-slate-900 text-white">
        <div className="container-professional text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to Partner With EPXFresh?
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto mb-8">
            Contact our sales team to discuss your wholesale or OEM requirements. 
            We respond within 1-2 business days.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact?type=wholesale">
              <Button size="lg" className="bg-fresh-600 hover:bg-fresh-700">
                Request a Quote
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="mailto:info@epxfresh.com">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                info@epxfresh.com
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
