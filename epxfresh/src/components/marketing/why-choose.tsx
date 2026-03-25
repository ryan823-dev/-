import { Cpu, Shield, Settings, Truck, HeadphonesIcon, Globe } from "lucide-react"

const reasons = [
  {
    icon: Cpu,
    title: "Advanced Technology",
    description: "Innovative micro-environment management for optimal produce storage conditions.",
  },
  {
    icon: Shield,
    title: "Tested & Certified",
    description: "FDA & EU food-contact certified. Third-party tested by CNAS accredited labs.",
  },
  {
    icon: Settings,
    title: "Flexible Solutions",
    description: "Custom sizes, materials, and OEM/Private Label options available.",
  },
  {
    icon: Truck,
    title: "Supply Chain Ready",
    description: "Designed for cold chain, logistics, retail display, and warehouse storage.",
  },
  {
    icon: HeadphonesIcon,
    title: "Application Support",
    description: "Expert guidance for your specific produce categories and storage needs.",
  },
  {
    icon: Globe,
    title: "Global Service",
    description: "Serving 50+ countries with reliable international shipping and support.",
  },
]

export function WhyChoose() {
  return (
    <section className="section-padding bg-white">
      <div className="container-professional">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-section text-gray-900 mb-4">
            Why Choose EPXFresh?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We combine advanced technology with proven expertise to deliver 
            fresh-keeping solutions that make a real difference.
          </p>
        </div>

        {/* Reasons Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {reasons.map((reason, index) => (
            <div
              key={reason.title}
              className="group p-6 rounded-2xl bg-cream hover:bg-fresh-50 transition-colors duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-fresh-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg shadow-fresh-600/20">
                <reason.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {reason.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {reason.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
