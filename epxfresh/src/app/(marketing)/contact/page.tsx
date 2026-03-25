"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send,
  MessageSquare,
  Building2,
  CheckCircle
} from "lucide-react"
import { BRAND_CONFIG } from "@/lib/utils"

const inquiryTypes = [
  { value: "general", label: "General Inquiry" },
  { value: "wholesale", label: "Wholesale / Bulk Orders" },
  { value: "oem", label: "OEM / Private Label" },
  { value: "sample", label: "Sample Request" },
  { value: "support", label: "Product Support" },
  { value: "partnership", label: "Partnership / Distribution" },
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    inquiryType: "general",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (isSubmitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Card variant="premium" className="max-w-md p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-fresh-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-fresh-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Message Sent!
          </h2>
          <p className="text-gray-600 mb-6">
            Thank you for contacting us. We&apos;ll respond within 1-2 business days.
          </p>
          <Button onClick={() => setIsSubmitted(false)}>
            Send Another Message
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="section-padding">
      <div className="container-professional">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Contact Us
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Have questions about our products or services? We&apos;re here to help. 
            Fill out the form below and we&apos;ll get back to you within 1-2 business days.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card variant="premium" className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-fresh-500 focus:ring-2 focus:ring-fresh-500/20 outline-none transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-fresh-500 focus:ring-2 focus:ring-fresh-500/20 outline-none transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-fresh-500 focus:ring-2 focus:ring-fresh-500/20 outline-none transition-all"
                      placeholder="Your Company"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-fresh-500 focus:ring-2 focus:ring-fresh-500/20 outline-none transition-all"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inquiry Type *
                  </label>
                  <select
                    name="inquiryType"
                    value={formData.inquiryType}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-fresh-500 focus:ring-2 focus:ring-fresh-500/20 outline-none transition-all bg-white"
                  >
                    {inquiryTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-fresh-500 focus:ring-2 focus:ring-fresh-500/20 outline-none transition-all resize-none"
                    placeholder="Tell us about your inquiry..."
                  />
                </div>

                <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <Card variant="premium" className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-fresh-100 flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6 text-fresh-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                  <a 
                    href={`mailto:${BRAND_CONFIG.contact.email}`}
                    className="text-fresh-600 hover:underline"
                  >
                    {BRAND_CONFIG.contact.email}
                  </a>
                  <p className="text-sm text-gray-500 mt-1">
                    We respond within 1-2 business days
                  </p>
                </div>
              </div>
            </Card>

            <Card variant="premium" className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-eco-100 flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6 text-eco-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Office Address</h3>
                  <p className="text-gray-600 text-sm">
                    {BRAND_CONFIG.contact.address}
                  </p>
                </div>
              </div>
            </Card>

            <Card variant="premium" className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-warm-100 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-6 h-6 text-warm-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Business Hours</h3>
                  <p className="text-gray-600 text-sm">
                    Monday - Friday: 9:00 AM - 6:00 PM (CST)
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    GMT+8, Guangzhou, China
                  </p>
                </div>
              </div>
            </Card>

            {/* Quick Links */}
            <div className="bg-cream rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <a href="/wholesale" className="text-gray-600 hover:text-fresh-600 transition-colors">
                    → Wholesale Inquiries
                  </a>
                </li>
                <li>
                  <a href="/faq" className="text-gray-600 hover:text-fresh-600 transition-colors">
                    → Frequently Asked Questions
                  </a>
                </li>
                <li>
                  <a href="/certifications" className="text-gray-600 hover:text-fresh-600 transition-colors">
                    → Certifications & Test Reports
                  </a>
                </li>
                <li>
                  <a href="/technology" className="text-gray-600 hover:text-fresh-600 transition-colors">
                    → Our Technology
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
