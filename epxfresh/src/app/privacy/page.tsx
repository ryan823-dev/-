import { Metadata } from "next"
import { Shield, Lock, Eye, Users, FileText } from "lucide-react"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "EPXFresh Privacy Policy - Learn how we collect, use, and protect your personal information.",
}

export default function PrivacyPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative py-20 lg:py-28 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 bg-grid opacity-10" />
        
        <div className="container-professional relative z-10 text-center">
          <div className="w-16 h-16 rounded-full bg-fresh-600/20 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-fresh-400" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-300">
            Last updated: March 23, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding bg-white">
        <div className="container-professional">
          <div className="max-w-4xl mx-auto prose prose-lg">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <Lock className="w-6 h-6 text-fresh-600" />
                  Information We Collect
                </h2>
                <div className="text-gray-600 space-y-4">
                  <p>
                    We collect information you provide directly to us, such as when you:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Create an account or place an order</li>
                    <li>Fill out a contact form or request a quote</li>
                    <li>Subscribe to our newsletter</li>
                    <li>Participate in surveys or promotions</li>
                    <li>Communicate with us via email, phone, or chat</li>
                  </ul>
                  <p>
                    This information may include: name, email address, phone number, company name, 
                    shipping address, billing address, and any other information you choose to provide.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <Eye className="w-6 h-6 text-fresh-600" />
                  How We Use Your Information
                </h2>
                <div className="text-gray-600 space-y-4">
                  <p>We use the information we collect to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Process and fulfill your orders</li>
                    <li>Send order confirmations and shipping updates</li>
                    <li>Respond to your inquiries and provide customer support</li>
                    <li>Send promotional communications (with your consent)</li>
                    <li>Improve our products and services</li>
                    <li>Comply with legal obligations</li>
                    <li>Detect and prevent fraud</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <FileText className="w-6 h-6 text-fresh-600" />
                  Information Sharing
                </h2>
                <div className="text-gray-600 space-y-4">
                  <p>
                    We do not sell, trade, or rent your personal information to third parties. 
                    We may share your information with:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Service providers who assist in our operations (payment processors, shipping carriers)</li>
                    <li>Legal authorities when required by law</li>
                    <li>Business partners with your explicit consent</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <Users className="w-6 h-6 text-fresh-600" />
                  Data Security
                </h2>
                <div className="text-gray-600 space-y-4">
                  <p>
                    We implement appropriate technical and organizational measures to protect your 
                    personal information, including:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>SSL encryption for data transmission</li>
                    <li>Secure servers with access controls</li>
                    <li>Regular security assessments</li>
                    <li>Limited employee access to personal data</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Your Rights
                </h2>
                <div className="text-gray-600 space-y-4">
                  <p>You have the right to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Access your personal information</li>
                    <li>Correct inaccurate information</li>
                    <li>Request deletion of your information</li>
                    <li>Opt out of marketing communications</li>
                    <li>Withdraw consent at any time</li>
                  </ul>
                  <p>
                    To exercise these rights, please contact us at privacy@epxfresh.com.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Cookies and Tracking
                </h2>
                <div className="text-gray-600 space-y-4">
                  <p>
                    Our website uses cookies and similar technologies to enhance your browsing experience. 
                    These include essential cookies (required for site functionality) and analytics cookies 
                    (to understand how visitors use our site).
                  </p>
                  <p>
                    You can control cookie settings through your browser preferences.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Contact Us
                </h2>
                <div className="text-gray-600 space-y-4">
                  <p>
                    If you have any questions about this Privacy Policy, please contact us:
                  </p>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <p className="font-semibold text-gray-900">Guangzhou EPXFresh Technology Co., LTD</p>
                    <p>1604, Building F, No. 98, Xiangxue Eight Road</p>
                    <p>Huangpu District, Guangzhou City, China</p>
                    <p>Email: privacy@epxfresh.com</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Changes to This Policy
                </h2>
                <div className="text-gray-600">
                  <p>
                    We may update this Privacy Policy from time to time. We will notify you of any 
                    changes by posting the new policy on this page and updating the "Last updated" date. 
                    We encourage you to review this policy periodically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
