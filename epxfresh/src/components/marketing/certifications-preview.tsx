import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, FileText, Award, Download, ArrowRight } from "lucide-react"

const certifications = [
  {
    name: "FDA Compliance",
    description: "21 CFR Part 177.1520",
    icon: Shield,
    status: "Passed",
    reportId: "TST20250304303E",
  },
  {
    name: "EU Compliance",
    description: "Regulation EU 10/2011",
    icon: FileText,
    status: "Passed",
    reportId: "TST20240305021-6EN",
  },
  {
    name: "CNAS Accredited",
    description: "Third-party testing",
    icon: Award,
    status: "Verified",
  },
]

export function CertificationsPreview() {
  return (
    <section className="section-padding bg-gradient-to-b from-white to-cream">
      <div className="container-professional">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-section text-gray-900 mb-4">
            Certifications & Compliance
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our products meet the highest international standards for food contact safety. 
            All testing performed by accredited third-party laboratories.
          </p>
        </div>

        {/* Certifications Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
          {certifications.map((cert) => (
            <div
              key={cert.name}
              className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100"
            >
              <div className="w-14 h-14 rounded-xl bg-eco-100 flex items-center justify-center mb-4">
                <cert.icon className="w-7 h-7 text-eco-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {cert.name}
              </h3>
              <p className="text-sm text-gray-500 mb-3">{cert.description}</p>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-fresh-100 text-fresh-700">
                  ✓ {cert.status}
                </span>
                {cert.reportId && (
                  <span className="text-xs text-gray-400">#{cert.reportId}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/certifications">
            <Button variant="outline" size="lg">
              <Download className="w-4 h-4 mr-2" />
              View Test Reports
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
