"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { 
  Menu, 
  X, 
  ShoppingCart, 
  Search,
  Leaf
} from "lucide-react"
import { useState } from "react"

const navigation = [
  { name: "Shop", href: "/shop" },
  { name: "Products", href: "/products" },
  { name: "Wholesale", href: "/wholesale" },
  { name: "Solutions", href: "/solutions" },
  { name: "Technology", href: "/technology" },
  { name: "About", href: "/about" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <nav className="container-professional flex items-center justify-between h-14 lg:h-20 px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br from-fresh-500 to-eco-500 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
            <Leaf className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
          </div>
          <span className="text-lg lg:text-xl font-bold text-gray-900">
            EPX<span className="text-fresh-600">Fresh</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-gray-600 hover:text-fresh-600 transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Search - 移动端隐藏 */}
          <button className="hidden sm:block p-2 text-gray-500 hover:text-fresh-600 transition-colors">
            <Search className="w-5 h-5" />
          </button>

          {/* Cart */}
          <Link
            href="/cart"
            className="p-2 text-gray-500 hover:text-fresh-600 transition-colors relative"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-fresh-600 text-white text-xs rounded-full flex items-center justify-center">
              0
            </span>
          </Link>

          {/* CTA Button - 移动端隐藏 */}
          <div className="hidden md:block">
            <Button size="sm">Get a Quote</Button>
          </div>

          {/* Mobile Menu Toggle - 触摸目标优化 */}
          <button
            className="lg:hidden p-2 -mr-2 text-gray-600 hover:text-fresh-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={cn(
          "lg:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-lg transition-all duration-300 max-h-[80vh] overflow-y-auto",
          mobileMenuOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"
        )}
      >
        <div className="container-professional py-4 px-4">
          <div className="flex flex-col gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="px-4 py-3 text-base text-gray-700 hover:text-fresh-600 hover:bg-fresh-50 rounded-lg transition-colors font-medium min-h-[48px] flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4 mt-2 border-t border-gray-100">
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full text-base min-h-[48px]">Get a Quote</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 -z-10 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </header>
  )
}
