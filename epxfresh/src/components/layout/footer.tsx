import Link from "next/link"
import { Leaf, Mail, Phone, MapPin } from "lucide-react"
import { BRAND_CONFIG } from "@/lib/utils"

const footerLinks = {
  shop: [
    { name: "All Products", href: "/shop" },
    { name: "Household Bags", href: "/shop?category=household" },
    { name: "Multi-Size Packs", href: "/shop?category=packs" },
    { name: "Family Sets", href: "/shop?category=sets" },
    { name: "Starter Packs", href: "/shop?category=starter" },
  ],
  business: [
    { name: "Wholesale & Bulk Orders", href: "/wholesale" },
    { name: "OEM / Private Label", href: "/wholesale/oem" },
    { name: "Custom Packaging", href: "/solutions" },
    { name: "Request a Quote", href: "/contact" },
    { name: "Sample Service", href: "/contact?type=sample" },
  ],
  company: [
    { name: "About Us", href: "/about" },
    { name: "Technology", href: "/technology" },
    { name: "Certifications", href: "/certifications" },
    { name: "Contact Us", href: "/contact" },
  ],
  support: [
    { name: "FAQ", href: "/faq" },
    { name: "Shipping Info", href: "/shipping" },
    { name: "Returns Policy", href: "/returns" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ],
}

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-slate-900 text-white">
      {/* Main Footer */}
      <div className="container-professional py-8 md:py-12 lg:py-16 px-4">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-6 gap-6 lg:gap-12">
          {/* Brand Column - 移动端全宽 */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4 lg:mb-6">
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br from-fresh-500 to-eco-500 flex items-center justify-center">
                <Leaf className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <span className="text-lg lg:text-xl font-bold">
                EPX<span className="text-fresh-400">Fresh</span>
              </span>
            </Link>
            <p className="text-gray-400 text-xs lg:text-sm mb-4 lg:mb-6 max-w-sm leading-relaxed">
              {BRAND_CONFIG.brandTagline}. FDA & EU certified fresh-keeping packaging.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 lg:space-y-3 text-xs lg:text-sm">
              <a 
                href={`mailto:${BRAND_CONFIG.contact.email}`}
                className="flex items-center gap-2 text-gray-400 hover:text-fresh-400 transition-colors"
              >
                <Mail className="w-3 h-3 lg:w-4 lg:h-4" />
                {BRAND_CONFIG.contact.email}
              </a>
              <div className="flex items-start gap-2 text-gray-400">
                <MapPin className="w-3 h-3 lg:w-4 lg:h-4 mt-0.5 shrink-0" />
                <span className="text-xs">{BRAND_CONFIG.contact.address}</span>
              </div>
            </div>
          </div>

          {/* Mobile: 所有链接合并为2列 */}
          {/* Shop Links */}
          <div className="col-span-1">
            <h3 className="font-semibold mb-3 text-white text-sm">Shop</h3>
            <ul className="space-y-1.5">
              {footerLinks.shop.slice(0, 3).map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-xs text-gray-400 hover:text-fresh-400 transition-colors block py-1"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Business Links */}
          <div className="col-span-1">
            <h3 className="font-semibold mb-3 text-white text-sm">Business</h3>
            <ul className="space-y-1.5">
              {footerLinks.business.slice(0, 3).map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-xs text-gray-400 hover:text-fresh-400 transition-colors block py-1"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div className="col-span-1">
            <h3 className="font-semibold mb-3 text-white text-sm">Company</h3>
            <ul className="space-y-1.5">
              {footerLinks.company.slice(0, 3).map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-xs text-gray-400 hover:text-fresh-400 transition-colors block py-1"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div className="col-span-1">
            <h3 className="font-semibold mb-3 text-white text-sm">Support</h3>
            <ul className="space-y-1.5">
              {footerLinks.support.slice(0, 3).map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-xs text-gray-400 hover:text-fresh-400 transition-colors block py-1"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="container-professional py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {currentYear} {BRAND_CONFIG.brandName}. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-fresh-400 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-fresh-400 transition-colors">
              Terms of Service
            </Link>
            <Link href="/shipping" className="hover:text-fresh-400 transition-colors">
              Shipping Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
