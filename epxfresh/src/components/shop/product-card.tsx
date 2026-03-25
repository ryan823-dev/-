import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatPrice } from "@/lib/utils"
import { Star, ShoppingCart, Leaf } from "lucide-react"

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  image?: string
  category: string
  rating?: number
  reviewCount?: number
  badge?: string
  inStock?: boolean
}

interface ProductCardProps {
  product: Product
  variant?: "default" | "featured"
}

export function ProductCard({ product, variant = "default" }: ProductCardProps) {
  const isFeatured = variant === "featured"

  return (
    <Card variant="premium" className={`group overflow-hidden ${isFeatured ? "ring-2 ring-fresh-500" : ""}`}>
      {/* Image */}
      <div className="relative aspect-square bg-gradient-to-br from-fresh-50 to-eco-50 overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Leaf className="w-16 h-16 text-fresh-300" />
          </div>
        )}
        
        {/* Badge */}
        {product.badge && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-fresh-600 text-white text-xs font-semibold rounded-full">
            {product.badge}
          </div>
        )}
        
        {/* Quick Actions */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" className="w-10 h-10 rounded-full shadow-lg">
            <ShoppingCart className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Category */}
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
          {product.category}
        </p>
        
        {/* Name */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-fresh-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        
        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-1 mb-3">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(product.rating!)
                      ? "text-warm-500 fill-warm-500"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">
              ({product.reviewCount || 0})
            </span>
          </div>
        )}
        
        {/* Price & CTA */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>
          <Link href={`/products/${product.slug}`}>
            <Button size="sm" variant="ghost">
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}
