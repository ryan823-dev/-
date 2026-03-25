import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { 
  Leaf,
  Target,
  Eye,
  Heart,
  Shield,
  Globe,
  Users,
  Award,
  ArrowRight
} from "lucide-react"
import { aboutMetadata } from "@/lib/seo/metadata"
import { generateOrganizationSchema, generateBreadcrumbSchema } from "@/lib/seo/schema"
import { BRAND_CONFIG } from "@/lib/utils"

export const metadata: Metadata = aboutMetadata

const values = [
  {
    icon: Leaf,
    title: "Innovation",
    description: "Continuously advancing fresh-keeping technology through R&D and scientific research.",
  },
  {
    icon: Shield,
    title: "Quality",
    description: "Rigorous testing and certification to ensure food safety and product reliability.",
  },
  {
    icon: Heart,
    title: "Sustainability",
    description: "Committed to reducing food waste and environmental impact through better preservation.",
  },
  {
    icon: Users,
    title: "Partnership",
    description: "Building long-term relationships with customers and distributors worldwide.",
  },
]

const milestones = [
  { year: "2010", event: "Company founded in Guangzhou, China" },
  { year: "2013", event: "First FDA certification obtained" },
  { year: "2016", event: "EU compliance certification achieved" },
  { year: "2018", event: "Expanded to 25+ countries" },
  { year: "2020", event: "Launched household product line" },
  { year: "2024", event: "Serving 50+ countries with 500+ partners" },
]

export default function AboutPage() {
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
              { name: "About Us", url: "/about" },
            ]),
          ]),
        }}
      />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fresh-600/20 rounded-full blur-3xl" />
        
        <div className="container-professional relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6">
              About{" "}
              <span className="text-fresh-400">EPXFresh</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8">
              A leading provider of advanced fresh-keeping packaging solutions, 
              serving businesses and households worldwide since 2010.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section-padding bg-white">
        <div className="container-professional">
          <div className="grid lg:grid-cols-2 gap-12">
            <Card variant="premium" className="p-8">
              <div className="w-14 h-14 rounded-xl bg-fresh-100 flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-fresh-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-gray-600 leading-relaxed">
                To reduce global food waste by providing innovative, certified fresh-keeping 
                packaging solutions that extend produce shelf life, maintain nutritional quality, 
                and support sustainable food systems for businesses and consumers worldwide.
              </p>
            </Card>
            
            <Card variant="premium" className="p-8">
              <div className="w-14 h-14 rounded-xl bg-eco-100 flex items-center justify-center mb-6">
                <Eye className="w-7 h-7 text-eco-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h2>
              <p className="text-gray-600 leading-relaxed">
                To become the global leader in fresh-keeping technology, making advanced 
                preservation accessible to every household and business, contributing to 
                a world where fresh produce stays fresh longer and food waste is minimized.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-cream">
        <div className="container-professional">
          <div className="text-center mb-12">
            <h2 className="text-section text-gray-900 mb-4">
              Our Core Values
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div key={value.title} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-fresh-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-fresh-600/20">
                  <value.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company Info */}
      <section className="section-padding bg-white">
        <div className="container-professional">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-section text-gray-900 mb-6">
                Who We Are
              </h2>
              <p className="text-gray-600 mb-6">
                Guangzhou EPXFresh Technology Co., LTD is a technology-driven company specializing 
                in fresh-keeping packaging solutions. Based in Guangzhou, China, we combine 
                advanced material science with practical applications to help businesses and 
                consumers extend produce freshness.
              </p>
              <div className="bg-fresh-50 rounded-xl p-6 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Headquarters</h4>
                <p className="text-gray-600 text-sm">
                  1604, Building F, No. 98<br />
                  Xiangxue Eight Road, Huangpu District<br />
                  Guangzhou City, China
                </p>
              </div>
              <p className="text-gray-600 mb-6">
                Our products are developed through continuous research and testing, 
                certified by FDA and EU standards for food contact safety. We serve 
                customers in over 50 countries, from multinational supermarket chains 
                to individual households seeking better food storage solutions.
              </p>
              
              <div className="grid grid-cols-2 gap-6 mt-8">
                <div className="flex items-center gap-3">
                  <Globe className="w-6 h-6 text-fresh-600" />
                  <div>
                    <div className="font-semibold text-gray-900">50+ Countries</div>
                    <div className="text-sm text-gray-500">Global presence</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-fresh-600" />
                  <div>
                    <div className="font-semibold text-gray-900">500+ Partners</div>
                    <div className="text-sm text-gray-500">Business network</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="w-6 h-6 text-fresh-600" />
                  <div>
                    <div className="font-semibold text-gray-900">FDA & EU Certified</div>
                    <div className="text-sm text-gray-500">Food safety</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-fresh-600" />
                  <div>
                    <div className="font-semibold text-gray-900">CNAS Tested</div>
                    <div className="text-sm text-gray-500">Third-party verified</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-fresh-50 to-eco-50 rounded-3xl p-8">
              <h3 className="font-semibold text-gray-900 mb-6">Company Journey</h3>
              <div className="space-y-4">
                {milestones.map((milestone, index) => (
                  <div key={milestone.year} className="flex gap-4">
                    <div className="w-16 text-fresh-600 font-semibold shrink-0">
                      {milestone.year}
                    </div>
                    <div className="flex-1 pb-4 border-b border-gray-200 last:border-0">
                      {milestone.event}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-fresh-600 text-white">
        <div className="container-professional text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Let&apos;s Work Together
          </h2>
          <p className="text-fresh-100 max-w-2xl mx-auto mb-8">
            Whether you&apos;re a business looking for wholesale solutions or interested 
            in partnership opportunities, we&apos;d love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-white text-fresh-700 hover:bg-gray-100">
                Contact Us
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/wholesale">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Wholesale Inquiries
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
