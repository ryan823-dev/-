import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Building2, Home, ArrowRight, Package, Factory, Users, ShoppingBag, Heart, Sparkles } from "lucide-react"

const b2bFeatures = [
  { icon: Package, text: "Bulk supply & wholesale pricing" },
  { icon: Factory, text: "OEM / Private Label services" },
  { icon: Users, text: "Distributor partnerships" },
]

const b2cFeatures = [
  { icon: ShoppingBag, text: "Household fresh-keeping bags" },
  { icon: Heart, text: "Family & starter packs" },
  { icon: Sparkles, text: "Easy to use, effective results" },
]

export function DualEntry() {
  return (
    <section className="section-padding bg-gradient-to-b from-cream to-white">
      <div className="container-professional">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-section text-gray-900 mb-4">
            Solutions for Every Need
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Whether you&apos;re a business looking for wholesale solutions or a household 
            seeking better food storage, we have the right products for you.
          </p>
        </div>

        {/* Dual Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* B2B Card */}
          <div className="group relative bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl hover:border-eco-200 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-eco-50 rounded-bl-full opacity-50" />
            
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-eco-500 to-eco-600 flex items-center justify-center mb-6 shadow-lg group-hover:scale-105 transition-transform">
                <Building2 className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">For Business</h3>
              <p className="text-gray-600 mb-6">
                Wholesale, OEM, and custom packaging solutions for produce businesses worldwide.
              </p>

              <ul className="space-y-3 mb-8">
                {b2bFeatures.map((feature) => (
                  <li key={feature.text} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-eco-100 flex items-center justify-center shrink-0">
                      <feature.icon className="w-3 h-3 text-eco-600" />
                    </div>
                    <span className="text-gray-700">{feature.text}</span>
                  </li>
                ))}
              </ul>

              <Link href="/wholesale">
                <Button variant="secondary" className="w-full">
                  Request a Quote
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* B2C Card */}
          <div className="group relative bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl hover:border-fresh-200 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-fresh-50 rounded-bl-full opacity-50" />
            
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fresh-500 to-fresh-600 flex items-center justify-center mb-6 shadow-lg group-hover:scale-105 transition-transform">
                <Home className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">For Home Use</h3>
              <p className="text-gray-600 mb-6">
                Keep your fruits and vegetables fresher for longer with our household solutions.
              </p>

              <ul className="space-y-3 mb-8">
                {b2cFeatures.map((feature) => (
                  <li key={feature.text} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-fresh-100 flex items-center justify-center shrink-0">
                      <feature.icon className="w-3 h-3 text-fresh-600" />
                    </div>
                    <span className="text-gray-700">{feature.text}</span>
                  </li>
                ))}
              </ul>

              <Link href="/shop">
                <Button className="w-full">
                  Shop Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
