import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { 
  Shield, 
  FileText, 
  CheckCircle,
  Download,
  Award,
  AlertCircle
} from "lucide-react"
import { certificationsMetadata } from "@/lib/seo/metadata"
import { generateOrganizationSchema, generateBreadcrumbSchema } from "@/lib/seo/schema"

export const metadata: Metadata = certificationsMetadata

const certifications = [
  {
    name: "FDA Food Contact Compliance",
    standard: "21 CFR Part 177.1520",
    description: "U.S. Food and Drug Administration certification for food contact materials. Our products meet all requirements for safe food contact.",
    reportId: "TST20250304303E",
    status: "Passed",
    tests: [
      "Total Migration Test",
      "Potassium Permanganate Consumption",
      "Heavy Metals (Pb)",
      "N-Hexane Extraction",
      "Xylene Extraction",
    ],
  },
  {
    name: "EU Food Contact Compliance",
    standard: "Regulation EU 10/2011",
    description: "European Union compliance for food contact materials. Certified for use in EU markets.",
    reportId: "TST20240305021-6EN",
    status: "Passed",
    tests: [
      "Overall Migration Test",
      "Specific Migration Test",
      "Sensory Analysis",
      "Heavy Metals Migration",
    ],
  },
]

const qualityAssurances = [
  {
    icon: Shield,
    title: "Third-Party Testing",
    description: "All tests performed by CNAS-accredited independent laboratories.",
  },
  {
    icon: FileText,
    title: "Full Documentation",
    description: "Complete test reports available upon request for qualified buyers.",
  },
  {
    icon: Award,
    title: "Continuous Compliance",
    description: "Regular retesting to ensure ongoing compliance with standards.",
  },
  {
    icon: CheckCircle,
    title: "Batch Traceability",
    description: "Full traceability from raw materials to finished products.",
  },
]

export default function CertificationsPage() {
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
              { name: "Certifications", url: "/certifications" },
            ]),
          ]),
        }}
      />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-br from-eco-900 via-eco-800 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-eco-500/20 rounded-full blur-3xl" />
        
        <div className="container-professional relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-eco-200 text-sm mb-6">
              <Shield className="w-4 h-4" />
              Food Safety First
            </div>
            
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6">
              Certifications &{" "}
              <span className="text-eco-300">Compliance</span>
            </h1>
            
            <p className="text-xl text-gray-300">
              Our products meet the highest international standards for food contact safety. 
              All testing performed by accredited third-party laboratories.
            </p>
          </div>
        </div>
      </section>

      {/* Quality Assurance */}
      <section className="section-padding bg-white">
        <div className="container-professional">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {qualityAssurances.map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-14 h-14 rounded-xl bg-eco-100 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-eco-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications Detail */}
      <section className="section-padding bg-cream">
        <div className="container-professional">
          <div className="text-center mb-12">
            <h2 className="text-section text-gray-900 mb-4">
              Certification Details
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Detailed information about our compliance certifications and test results.
            </p>
          </div>

          <div className="space-y-8">
            {certifications.map((cert) => (
              <Card key={cert.name} variant="premium" className="p-8">
                <div className="flex flex-col lg:flex-row lg:items-start gap-8">
                  <div className="lg:w-2/3">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-eco-100 flex items-center justify-center shrink-0">
                        <Shield className="w-6 h-6 text-eco-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {cert.name}
                        </h3>
                        <p className="text-eco-600 font-medium">{cert.standard}</p>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-6">
                      {cert.description}
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {cert.tests.map((test) => (
                        <div key={test} className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-fresh-600 shrink-0" />
                          <span className="text-gray-700 text-sm">{test}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:w-1/3 lg:border-l lg:border-gray-200 lg:pl-8">
                    <div className="bg-eco-50 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="w-5 h-5 text-eco-600" />
                        <span className="font-semibold text-eco-700">
                          Status: {cert.status}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-4">
                        <div className="font-medium text-gray-900">Report ID:</div>
                        <div className="font-mono">{cert.reportId}</div>
                      </div>

                      <Button variant="outline" className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Request Report
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="section-padding bg-white">
        <div className="container-professional">
          <Card className="bg-warm-50 border-warm-200 p-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-warm-600 shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Important Information
                </h3>
                <ul className="text-gray-600 text-sm space-y-2">
                  <li>• Test reports are available upon request for qualified business customers.</li>
                  <li>• Certification applies to products manufactured after the test date.</li>
                  <li>• Regular retesting ensures ongoing compliance with standards.</li>
                  <li>• Custom formulations may require additional testing.</li>
                  <li>• Contact us for specific compliance documentation requests.</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-slate-900 text-white">
        <div className="container-professional text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Need Compliance Documentation?
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto mb-8">
            Contact our team to request test reports, compliance certificates, 
            or discuss specific regulatory requirements for your market.
          </p>
          <Link href="/contact?type=compliance">
            <Button size="lg" className="bg-fresh-600 hover:bg-fresh-700">
              Request Documentation
            </Button>
          </Link>
        </div>
      </section>
    </>
  )
}
