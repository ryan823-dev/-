import { Metadata } from "next"
import { Scale, FileText, AlertTriangle } from "lucide-react"

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "EPXFresh Terms & Conditions - Read our terms of sale, service agreements, and legal policies.",
}

export default function TermsPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative py-20 lg:py-28 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 bg-grid opacity-10" />
        
        <div className="container-professional relative z-10 text-center">
          <div className="w-16 h-16 rounded-full bg-fresh-600/20 flex items-center justify-center mx-auto mb-6">
            <Scale className="w-8 h-8 text-fresh-400" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Terms & Conditions
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
                  <FileText className="w-6 h-6 text-fresh-600" />
                  1. Agreement to Terms
                </h2>
                <div className="text-gray-600 space-y-4">
                  <p>
                    By accessing or using the EPXFresh website and services, you agree to be bound 
                    by these Terms and Conditions. If you do not agree to these terms, please do 
                    not use our services.
                  </p>
                  <p>
                    These terms apply to all visitors, users, and customers who access or use the 
                    EPXFresh website and related services.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <FileText className="w-6 h-6 text-fresh-600" />
                  2. Products and Pricing
                </h2>
                <div className="text-gray-600 space-y-4">
                  <p>
                    All product descriptions, specifications, and pricing are subject to change without 
                    notice. We make every effort to display accurate information, but we reserve the 
                    right to correct any errors.
                  </p>
                  <p>
                    Product availability is confirmed at the time of order processing. Lead times may 
                    vary based on product type and order quantity.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900 mb-2">Pricing Terms:</p>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li>Prices are quoted in USD unless otherwise specified</li>
                      <li>Bulk pricing applies to orders meeting minimum quantity requirements</li>
                      <li>Payment must be received in full before shipment</li>
                      <li>Currency conversion fees are the responsibility of the buyer</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <FileText className="w-6 h-6 text-fresh-600" />
                  3. Orders and Payment
                </h2>
                <div className="text-gray-600 space-y-4">
                  <p>
                    <strong>Order Process:</strong>
                  </p>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>Submit order inquiry via website, email, or contact form</li>
                    <li>Receive quotation and confirm order details</li>
                    <li>Pay 30% deposit to confirm order</li>
                    <li>Production begins (7-14 days for standard orders)</li>
                    <li>Quality inspection and final payment</li>
                    <li>Shipment and delivery</li>
                  </ol>
                  
                  <p className="mt-4">
                    <strong>Payment Methods:</strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>T/T (Telegraphic Transfer) - preferred for wholesale orders</li>
                    <li>L/C (Letter of Credit) - available for orders over $10,000</li>
                    <li>PayPal - available for sample orders (4.4% fee applies)</li>
                    <li>Western Union - available for sample orders</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <FileText className="w-6 h-6 text-fresh-600" />
                  4. Shipping and Delivery
                </h2>
                <div className="text-gray-600 space-y-4">
                  <p>
                    Shipping costs are calculated based on destination, weight, volume, and chosen 
                    shipping method. All risk of loss transfers to the buyer upon delivery to the 
                    designated port or location.
                  </p>
                  <p>
                    Delivery times are estimates and may vary due to factors outside our control, 
                    including customs clearance, weather conditions, and carrier delays.
                  </p>
                  <p>
                    Buyers are responsible for all import duties, taxes, and customs clearance fees.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-fresh-600" />
                  5. Product Warranty and Returns
                </h2>
                <div className="text-gray-600 space-y-4">
                  <p>
                    <strong>Warranty Coverage:</strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>All products are warranted to be free from defects in materials and workmanship</li>
                    <li>Warranty period: 6 months from date of delivery</li>
                    <li>Warranty covers manufacturing defects only</li>
                    <li>Warranty does not cover damage caused by misuse, improper storage, or normal wear</li>
                  </ul>
                  
                  <p className="mt-4">
                    <strong>Return Policy:</strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Returns accepted within 14 days of delivery for unused items in original packaging</li>
                    <li>Customer bears return shipping costs</li>
                    <li>Refunds processed within 30 days of receiving returned goods</li>
                    <li>Custom/private label orders are non-returnable</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  6. Intellectual Property
                </h2>
                <div className="text-gray-600 space-y-4">
                  <p>
                    All content on the EPXFresh website, including text, graphics, logos, images, 
                    and software, is the property of Guangzhou EPXFresh Technology Co., LTD and is 
                    protected by intellectual property laws.
                  </p>
                  <p>
                    Customers may not use our trademarks, product images, or proprietary information 
                    for commercial purposes without prior written consent.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  7. Limitation of Liability
                </h2>
                <div className="text-gray-600 space-y-4">
                  <p>
                    EPXFresh shall not be liable for any indirect, incidental, special, or consequential 
                    damages arising from the use of our products or services.
                  </p>
                  <p>
                    Our total liability shall not exceed the purchase price of the products ordered.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  8. Privacy and Data Protection
                </h2>
                <div className="text-gray-600">
                  <p>
                    Your privacy is important to us. Please review our{' '}
                    <a href="/privacy" className="text-fresh-600 hover:underline">
                      Privacy Policy
                    </a>{' '}
                    to understand how we collect, use, and protect your personal information.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  9. Governing Law
                </h2>
                <div className="text-gray-600">
                  <p>
                    These Terms and Conditions shall be governed by and construed in accordance with 
                    the laws of the People&apos;s Republic of China. Any disputes shall be resolved 
                    through friendly negotiation or through the competent courts located in Guangzhou, 
                    Guangdong Province, China.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  10. Contact Information
                </h2>
                <div className="text-gray-600">
                  <p>For questions regarding these Terms and Conditions, please contact us:</p>
                  <div className="bg-gray-50 p-6 rounded-lg mt-4">
                    <p className="font-semibold text-gray-900">Guangzhou EPXFresh Technology Co., LTD</p>
                    <p>1604, Building F, No. 98, Xiangxue Eight Road</p>
                    <p>Huangpu District, Guangzhou City, China</p>
                    <p>Email: legal@epxfresh.com</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  11. Changes to Terms
                </h2>
                <div className="text-gray-600">
                  <p>
                    We reserve the right to modify these terms at any time. Changes will be effective 
                    immediately upon posting on the website. Your continued use of our services 
                    constitutes acceptance of the modified terms.
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
