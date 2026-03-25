import { Metadata } from "next"
import { Card } from "@/components/ui/card"
import { ChevronDown, HelpCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Find answers to common questions about EPXFresh fresh-keeping bags, wholesale orders, shipping, and certifications.",
}

const faqCategories = [
  {
    category: "Product Information",
    questions: [
      {
        q: "What are fresh-keeping bags and how do they work?",
        a: "Fresh-keeping bags use advanced moisture regulation technology to extend produce freshness. They absorb excess moisture while maintaining optimal humidity levels, preventing both dehydration and rot. This technology can extend freshness by 50-200% compared to standard storage methods."
      },
      {
        q: "Are EPXFresh bags safe for food contact?",
        a: "Yes, all EPXFresh products are FDA 21 CFR 177.1520 certified and EU Regulation 10/2011 compliant. They are tested and approved for direct food contact, ensuring safety for storing fruits, vegetables, and other produce."
      },
      {
        q: "How long do the bags extend freshness?",
        a: "Our fresh-keeping bags can extend produce freshness by 50-200% depending on the type of produce and storage conditions. For example, leafy greens can stay fresh for up to 2 weeks (vs. 3-5 days normally), while fruits like strawberries can last 10+ days (vs. 3-5 days normally)."
      },
      {
        q: "Can the bags be reused?",
        a: "Yes! EPXFresh bags are designed for multiple uses. Simply wash with mild soap and water, air dry completely, and reuse. With proper care, each bag can be used 50+ times. Avoid using hot water (>60°C) or harsh chemicals."
      },
      {
        q: "What types of produce work best with fresh-keeping bags?",
        a: "Our bags work excellently with all types of produce including: leafy greens (lettuce, spinach, kale), berries (strawberries, blueberries, raspberries), fruits (apples, pears, peaches), vegetables (broccoli, carrots, celery), and herbs (basil, cilantro, parsley)."
      },
    ]
  },
  {
    category: "Wholesale & Business",
    questions: [
      {
        q: "What is the minimum order quantity (MOQ) for wholesale?",
        a: "Our standard MOQ is 500 units for most products. For custom packaging solutions or private label orders, MOQ starts at 1,000 units. We also offer sample packs (50 units) for evaluation before placing bulk orders."
      },
      {
        q: "Do you offer OEM/Private label services?",
        a: "Yes, we offer comprehensive OEM and private label services. We can customize bags with your brand logo, packaging design, and size specifications. Our team will work with you from product development to final production. MOQ for custom branding is 1,000 units."
      },
      {
        q: "What payment methods do you accept?",
        a: "For wholesale orders, we accept T/T (Telegraphic Transfer), L/C (Letter of Credit), and PayPal (for sample orders). Payment terms: 30% deposit, 70% balance before shipment. For established partners, we offer flexible payment options."
      },
      {
        q: "Do you provide samples?",
        a: "Yes! We offer sample packs (50 units mixed sizes) at $29.99 USD including shipping. This allows you to evaluate product quality before placing bulk orders. Sample orders can be placed through our shop or by contacting sales directly."
      },
      {
        q: "What are your bulk pricing tiers?",
        a: "Volume discounts start at: 1,000+ units (5% off), 5,000+ units (12% off), 10,000+ units (20% off). Contact us for custom quotes on larger orders or special requirements."
      },
    ]
  },
  {
    category: "Shipping & Delivery",
    questions: [
      {
        q: "Where do you ship?",
        a: "We ship to 50+ countries worldwide. Major markets include: USA, Canada, UK, EU countries, Australia, Japan, South Korea, Singapore, and Southeast Asia. Contact us to confirm shipping to your specific location."
      },
      {
        q: "How long does shipping take?",
        a: "Shipping times vary by destination: USA/Canada: 15-25 days (sea freight), 5-7 days (air freight); Europe: 20-30 days (sea freight), 7-10 days (air freight); Asia-Pacific: 7-15 days. Express options available for urgent orders."
      },
      {
        q: "What shipping terms do you offer?",
        a: "We offer multiple shipping terms: FOB (Free on Board), CIF (Cost, Insurance, Freight), DDP (Delivered Duty Paid), and EXW (Ex Works). Choose the term that best suits your import capabilities and preferences."
      },
      {
        q: "How are orders packaged for shipping?",
        a: "All orders are carefully packaged to ensure safe delivery. Wholesale orders include: sealed plastic bags, inner cartons, outer cartons with moisture barriers, and palletization for sea freight. Custom packaging available for private label orders."
      },
    ]
  },
  {
    category: "Certifications & Compliance",
    questions: [
      {
        q: "What certifications do your products have?",
        a: "EPXFresh products are certified: FDA 21 CFR 177.1520 (USA food contact), EU Regulation 10/2011 (Europe food contact), CNAS tested (China quality verification). All products undergo rigorous third-party testing."
      },
      {
        q: "Can you provide test reports?",
        a: "Yes, we provide comprehensive test reports including: FDA test reports, EU compliance reports, CNAS test certificates, and material safety data sheets (MSDS). Reports are available in English and can be shared upon order confirmation."
      },
      {
        q: "Are your products BPA-free and non-toxic?",
        a: "Yes, all EPXFresh products are BPA-free, phthalate-free, and made from food-grade materials. They do not contain any toxic substances and are completely safe for storing food products."
      },
    ]
  },
]

export default function FAQPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 bg-grid opacity-10" />
        
        <div className="container-professional relative z-10 text-center">
          <div className="w-16 h-16 rounded-full bg-fresh-600/20 flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="w-8 h-8 text-fresh-400" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Find answers to common questions about our products, wholesale orders, shipping, and certifications.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="section-padding bg-cream">
        <div className="container-professional">
          <div className="max-w-4xl mx-auto space-y-12">
            {faqCategories.map((category) => (
              <div key={category.category}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <span className="w-2 h-8 bg-fresh-600 rounded-full" />
                  {category.category}
                </h2>
                
                <div className="space-y-4">
                  {category.questions.map((item, index) => (
                    <Card key={index} variant="premium" className="p-6">
                      <details className="group">
                        <summary className="flex items-start justify-between gap-4 cursor-pointer list-none">
                          <h3 className="font-semibold text-gray-900 flex-1">
                            {item.q}
                          </h3>
                          <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-gray-600 leading-relaxed">
                            {item.a}
                          </p>
                        </div>
                      </details>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="section-padding bg-fresh-600 text-white">
        <div className="container-professional text-center">
          <h2 className="text-3xl font-bold mb-4">
            Still have questions?
          </h2>
          <p className="text-fresh-100 max-w-2xl mx-auto mb-6">
            Our team is here to help. Contact us and we&apos;ll get back to you within 1-2 business days.
          </p>
          <a 
            href="/contact" 
            className="inline-block bg-white text-fresh-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </section>
    </>
  )
}
