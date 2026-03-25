import { Shield, FileCheck, Trophy, Cpu, Package, Globe2 } from "lucide-react"

const trustItems = [
  {
    icon: Shield,
    title: "Food-Contact Tested",
    description: "FDA & EU certified materials",
  },
  {
    icon: FileCheck,
    title: "Third-Party Reports",
    description: "CNAS accredited testing",
  },
  {
    icon: Trophy,
    title: "Award Winning",
    description: "Innovation recognized",
  },
  {
    icon: Cpu,
    title: "Technology-Driven",
    description: "Advanced R&D",
  },
  {
    icon: Package,
    title: "Custom Solutions",
    description: "OEM & Private Label",
  },
  {
    icon: Globe2,
    title: "Global Supply",
    description: "50+ countries served",
  },
]

export function TrustStrip() {
  return (
    <section className="py-8 bg-white border-b border-gray-100">
      <div className="container-professional">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {trustItems.map((item, index) => (
            <div
              key={item.title}
              className="flex flex-col items-center text-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-fresh-50 flex items-center justify-center mb-3 group-hover:bg-fresh-100 transition-colors">
                <item.icon className="w-6 h-6 text-fresh-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                {item.title}
              </h3>
              <p className="text-xs text-gray-500 hidden sm:block">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
