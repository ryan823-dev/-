import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { 
  Cpu,
  Droplets,
  Wind,
  Thermometer,
  Leaf,
  ArrowRight,
  CheckCircle
} from "lucide-react"
import { technologyMetadata } from "@/lib/seo/metadata"
import { generateOrganizationSchema, generateBreadcrumbSchema } from "@/lib/seo/schema"

export const metadata: Metadata = technologyMetadata

const technologyFeatures = [
  {
    icon: Wind,
    title: "Gas Exchange Optimization",
    description: "Controlled permeability allows optimal oxygen and carbon dioxide exchange, maintaining the ideal respiration rate for different produce types.",
  },
  {
    icon: Droplets,
    title: "Moisture Management",
    description: "Advanced material properties manage humidity levels inside the package, preventing condensation while maintaining optimal moisture for freshness.",
  },
  {
    icon: Thermometer,
    title: "Temperature Adaptation",
    description: "Our materials adapt to different storage temperatures, maintaining performance from refrigerated to ambient conditions.",
  },
  {
    icon: Leaf,
    title: "Natural Preservation",
    description: "Physical preservation method without chemicals or additives. Safe for all food types and environmentally responsible.",
  },
]

const howItWorks = [
  {
    step: 1,
    title: "Micro-Environment Creation",
    description: "Our bags create a controlled micro-environment around produce, managing the key factors that affect freshness.",
  },
  {
    step: 2,
    title: "Respiration Control",
    description: "The material&apos;s selective permeability slows down produce respiration, extending shelf life naturally.",
  },
  {
    step: 3,
    title: "Moisture Balance",
    description: "Excess moisture is managed while maintaining the humidity needed to prevent dehydration.",
  },
  {
    step: 4,
    title: "Extended Freshness",
    description: "The result is significantly extended freshness - 50-200% longer compared to standard storage methods.",
  },
]

const applications = [
  { name: "Leafy Greens", examples: "Lettuce, Spinach, Kale, Cabbage" },
  { name: "Berries", examples: "Strawberries, Blueberries, Raspberries" },
  { name: "Root Vegetables", examples: "Carrots, Potatoes, Onions" },
  { name: "Fruits", examples: "Apples, Pears, Citrus, Stone Fruits" },
  { name: "Cruciferous", examples: "Broccoli, Cauliflower, Brussels Sprouts" },
  { name: "Tropical Fruits", examples: "Bananas, Mangoes, Papayas" },
]

export default function TechnologyPage() {
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
              { name: "Technology", url: "/technology" },
            ]),
          ]),
        }}
      />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fresh-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-eco-600/20 rounded-full blur-3xl" />
        
        <div className="container-professional relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-fresh-200 text-sm mb-6">
              <Cpu className="w-4 h-4" />
              Advanced Technology
            </div>
            
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6">
              Fresh-Keeping{" "}
              <span className="text-fresh-400">Technology</span>
            </h1>
            
            <p className="text-xl text-gray-300">
              Our innovative micro-environment management technology extends produce 
              freshness by 50-200% compared to standard storage methods.
            </p>
          </div>
        </div>
      </section>

      {/* Core Technology */}
      <section className="section-padding bg-white">
        <div className="container-professional">
          <div className="text-center mb-12">
            <h2 className="text-section text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our technology creates optimal storage conditions through advanced material science.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {technologyFeatures.map((feature) => (
              <Card key={feature.title} variant="premium" className="p-6 text-center">
                <div className="w-14 h-14 rounded-xl bg-fresh-100 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-fresh-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="section-padding bg-cream">
        <div className="container-professional">
          <div className="text-center mb-12">
            <h2 className="text-section text-gray-900 mb-4">
              The Preservation Process
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Understanding how EPXFresh technology extends produce freshness.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-fresh-200 hidden sm:block" />
              
              <div className="space-y-8">
                {howItWorks.map((item, index) => (
                  <div key={item.step} className="flex gap-6">
                    <div className="w-16 h-16 rounded-full bg-fresh-600 flex items-center justify-center text-white font-bold text-xl shrink-0 relative z-10">
                      {item.step}
                    </div>
                    <Card variant="premium" className="flex-1 p-6">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {item.description}
                      </p>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Applications */}
      <section className="section-padding bg-white">
        <div className="container-professional">
          <div className="text-center mb-12">
            <h2 className="text-section text-gray-900 mb-4">
              Suitable Produce Types
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our technology works effectively with a wide range of fruits and vegetables.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {applications.map((app) => (
              <div
                key={app.name}
                className="bg-cream rounded-xl p-6 hover:bg-fresh-50 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{app.name}</h3>
                <p className="text-gray-600 text-sm">{app.examples}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-padding bg-fresh-600 text-white">
        <div className="container-professional">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                Proven Results
              </h2>
              <p className="text-fresh-100 mb-8">
                Our technology has been tested and proven effective across various 
                produce types and storage conditions.
              </p>
              
              <ul className="space-y-4">
                {[
                  "50-200% extension in freshness duration",
                  "Reduced spoilage rates by up to 67%",
                  "Maintained nutritional quality longer",
                  "No chemicals or additives required",
                  "Suitable for organic produce",
                  "Works with existing storage infrastructure",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-fresh-200 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6 text-center">
                <div className="text-4xl font-bold mb-2">50-200%</div>
                <div className="text-fresh-200 text-sm">Freshness Extension</div>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6 text-center">
                <div className="text-4xl font-bold mb-2">67%</div>
                <div className="text-fresh-200 text-sm">Spoilage Reduction</div>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6 text-center">
                <div className="text-4xl font-bold mb-2">0</div>
                <div className="text-fresh-200 text-sm">Chemicals Used</div>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6 text-center">
                <div className="text-4xl font-bold mb-2">100%</div>
                <div className="text-fresh-200 text-sm">Food Safe</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-slate-900 text-white">
        <div className="container-professional text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Experience the Technology
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto mb-8">
            Try EPXFresh products and see the difference in your produce freshness. 
            Available for both household and commercial applications.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop">
              <Button size="lg" className="bg-fresh-600 hover:bg-fresh-700">
                Shop Products
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/contact?type=sample">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Request Samples
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
