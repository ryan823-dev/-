import { Metadata } from "next"
import { Card } from "@/components/ui/card"
import { Truck, Globe, Clock, Package, DollarSign, Shield } from "lucide-react"

export const metadata: Metadata = {
  title: "Shipping & Delivery",
  description: "Learn about EPXFresh shipping options, delivery times, international shipping, and tracking information.",
}

const shippingDestinations = [
  {
    region: "North America",
    countries: "USA, Canada",
    seaFreight: "15-25 days",
    airFreight: "5-7 days",
    note: "Major ports: Los Angeles, New York, Houston, Vancouver"
  },
  {
    region: "Europe",
    countries: "UK, Germany, France, Italy, Spain, Netherlands",
    seaFreight: "20-30 days",
    airFreight: "7-10 days",
    note: "All EU destinations covered"
  },
  {
    region: "Asia-Pacific",
    countries: "Japan, South Korea, Singapore, Australia, New Zealand",
    seaFreight: "10-20 days",
    airFreight: "5-7 days",
    note: "Fastest routes via major Asian hubs"
  },
  {
    region: "Southeast Asia",
    countries: "Vietnam, Thailand, Malaysia, Indonesia, Philippines",
    seaFreight: "7-15 days",
    airFreight: "3-5 days",
    note: "Regional distribution center available"
  },
  {
    region: "Middle East",
    countries: "UAE, Saudi Arabia, Qatar, Oman",
    seaFreight: "20-25 days",
    airFreight: "5-7 days",
    note: "DDP service available for major markets"
  },
  {
    region: "South America",
    countries: "Brazil, Mexico, Argentina, Chile",
    seaFreight: "25-35 days",
    airFreight: "7-10 days",
    note: "Special import handling available"
  },
]

const shippingTerms = [
  {
    icon: Truck,
    title: "FOB (Free on Board)",
    description: "We deliver goods to the port of shipment. You bear the cost and risk of loss from that point. Ideal if you have your own freight forwarder."
  },
  {
    icon: Globe,
    title: "CIF (Cost, Insurance, Freight)",
    description: "We pay for costs, insurance, and freight to bring goods to the port of destination. You bear the risk once goods are unloaded."
  },
  {
    icon: Shield,
    title: "DDP (Delivered Duty Paid)",
    description: "We handle all transportation costs and duties. Goods are delivered to your doorstep ready for import. Most convenient option."
  },
  {
    icon: Package,
    title: "EXW (Ex Works)",
    description: "You pick up goods at our warehouse. We provide minimal assistance. Best for local buyers or those with extensive logistics capabilities."
  },
]

export default function ShippingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative py-20 lg:py-28 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 bg-grid opacity-10" />
        
        <div className="container-professional relative z-10 text-center">
          <div className="w-16 h-16 rounded-full bg-fresh-600/20 flex items-center justify-center mx-auto mb-6">
            <Truck className="w-8 h-8 text-fresh-400" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Shipping & Delivery
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Comprehensive shipping solutions to 50+ countries worldwide. Find the best option for your business.
          </p>
        </div>
      </section>

      {/* Shipping Terms */}
      <section className="section-padding bg-white">
        <div className="container-professional">
          <div className="text-center mb-12">
            <h2 className="text-section text-gray-900 mb-4">
              Shipping Terms
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose the shipping term that best suits your import capabilities and preferences.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {shippingTerms.map((term) => (
              <Card key={term.title} variant="premium" className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-fresh-100 flex items-center justify-center shrink-0">
                    <term.icon className="w-6 h-6 text-fresh-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{term.title}</h3>
                    <p className="text-gray-600 text-sm">{term.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery Times */}
      <section className="section-padding bg-cream">
        <div className="container-professional">
          <div className="text-center mb-12">
            <h2 className="text-section text-gray-900 mb-4">
              Delivery Times by Region
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Estimated delivery times from our warehouse in Guangzhou, China.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-4 font-semibold text-gray-900">Region</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Countries</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Sea Freight</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Air Freight</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Notes</th>
                </tr>
              </thead>
              <tbody>
                {shippingDestinations.map((dest, index) => (
                  <tr key={dest.region} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="p-4 font-medium text-gray-900">{dest.region}</td>
                    <td className="p-4 text-gray-600">{dest.countries}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        <Clock className="w-4 h-4" />
                        {dest.seaFreight}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-fresh-600 font-medium">
                        <Clock className="w-4 h-4" />
                        {dest.airFreight}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 text-sm">{dest.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Packaging */}
      <section className="section-padding bg-white">
        <div className="container-professional">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-section text-gray-900 mb-4">
                Packaging Standards
              </h2>
              <p className="text-gray-600">
                All orders are carefully packaged to ensure safe delivery.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card variant="premium" className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-fresh-100 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-6 h-6 text-fresh-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Retail Packaging</h3>
                <p className="text-gray-600 text-sm">
                  Individual bags sealed in plastic with barcode labels and usage instructions.
                </p>
              </Card>

              <Card variant="premium" className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-eco-100 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-6 h-6 text-eco-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Inner Cartons</h3>
                <p className="text-gray-600 text-sm">
                  cartons protect products during handling. Quantity varies by product line.
                </p>
              </Card>

              <Card variant="premium" className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-warm-100 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-6 h-6 text-warm-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Outer Cartons</h3>
                <p className="text-gray-600 text-sm">
                  corrugated boxes with moisture barriers. Palletized for sea freight.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Shipping Costs */}
      <section className="section-padding bg-fresh-600 text-white">
        <div className="container-professional">
          <div className="max-w-4xl mx-auto text-center">
            <DollarSign className="w-12 h-12 mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl font-bold mb-4">
              Shipping Cost Estimation
            </h2>
            <p className="text-fresh-100 mb-8 max-w-2xl mx-auto">
              Shipping costs vary based on destination, weight, volume, and chosen shipping method. 
              Contact us for accurate quotes tailored to your order.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="bg-white/10 rounded-xl p-6">
                <h3 className="font-semibold mb-2">Small Orders (Sample)</h3>
                <p className="text-sm text-fresh-100">
                  Air freight: $29-59 USD<br />
                  Door-to-door delivery available<br />
                  5-7 business days
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-6">
                <h3 className="font-semibold mb-2">Medium Orders (1-5 cbm)</h3>
                <p className="text-sm text-fresh-100">
                  Sea freight recommended<br />
                  $2-5 USD per kg<br />
                  15-30 business days
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-6">
                <h3 className="font-semibold mb-2">Large Orders (10+ cbm)</h3>
                <p className="text-sm text-fresh-100">
                  Full container (20GP/40HQ)<br />
                  Most economical option<br />
                  Significant cost savings
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="section-padding bg-cream">
        <div className="container-professional text-center">
          <h2 className="text-section text-gray-900 mb-4">
            Need a Shipping Quote?
          </h2>
          <p className="text-gray-600 mb-6">
            Contact our logistics team for personalized shipping quotes and delivery solutions.
          </p>
          <a 
            href="/contact?type=shipping" 
            className="inline-block bg-fresh-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-fresh-700 transition-colors"
          >
            Get Shipping Quote
          </a>
        </div>
      </section>
    </>
  )
}
