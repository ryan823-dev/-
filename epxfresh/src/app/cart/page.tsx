import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ShoppingCart, ArrowLeft, Trash2, Plus, Minus } from "lucide-react"

export const metadata: Metadata = {
  title: "Shopping Cart",
  description: "Review your selected EPXFresh products before checkout.",
}

// Mock cart data - in production, this would come from cart state/context
const mockCartItems = [
  {
    id: "household-fresh-keeping-bags",
    name: "Household Fresh-Keeping Bags",
    price: 12.99,
    quantity: 2,
    image: "/images/products/微信图片_20260318105940_132_907.jpg",
  },
  {
    id: "multi-size-pack",
    name: "Multi-Size Pack (Value Bundle)",
    price: 39.99,
    quantity: 1,
    image: "/images/products/微信图片_20260318105944_134_907.jpg",
  },
]

export default function CartPage() {
  const subtotal = mockCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal > 50 ? 0 : 9.99
  const total = subtotal + shipping

  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
        <div className="container-professional">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-fresh-600/20 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-fresh-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Shopping Cart</h1>
              <p className="text-gray-400">Review your items before checkout</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cart Content */}
      <section className="section-padding bg-cream">
        <div className="container-professional">
          {mockCartItems.length === 0 ? (
            <Card variant="premium" className="p-12 text-center max-w-2xl mx-auto">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">
                Looks like you haven&apos;t added any products to your cart yet.
              </p>
              <Link href="/shop">
                <Button size="lg">
                  Continue Shopping
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {mockCartItems.map((item) => (
                  <Card key={item.id} variant="premium" className="p-6">
                    <div className="flex gap-6">
                      {/* Product Image */}
                      <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {item.name}
                        </h3>
                        <p className="text-fresh-600 font-bold mb-4">
                          ${item.price.toFixed(2)}
                        </p>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center border border-gray-200 rounded-lg">
                            <button className="p-2 hover:bg-gray-50 transition-colors">
                              <Minus className="w-4 h-4 text-gray-600" />
                            </button>
                            <span className="px-4 font-medium">{item.quantity}</span>
                            <button className="p-2 hover:bg-gray-50 transition-colors">
                              <Plus className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                          
                          <button className="text-red-500 hover:text-red-600 transition-colors">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Item Total */}
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {/* Continue Shopping */}
                <Link href="/shop" className="inline-flex items-center gap-2 text-gray-600 hover:text-fresh-600 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  Continue Shopping
                </Link>
              </div>

              {/* Order Summary */}
              <div>
                <Card variant="premium" className="p-6 sticky top-24">
                  <h2 className="font-bold text-gray-900 mb-6">Order Summary</h2>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span>
                        {shipping === 0 ? (
                          <span className="text-fresh-600 font-medium">FREE</span>
                        ) : (
                          `$${shipping.toFixed(2)}`
                        )}
                      </span>
                    </div>
                    {shipping > 0 && (
                      <p className="text-sm text-gray-500 bg-fresh-50 p-2 rounded">
                        Free shipping on orders over $50!
                      </p>
                    )}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between font-bold text-gray-900 text-lg">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <Button size="lg" className="w-full mb-4">
                    Proceed to Checkout
                  </Button>
                  
                  <p className="text-xs text-gray-500 text-center">
                    Shipping calculated at checkout. Taxes may apply.
                  </p>
                </Card>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="section-padding bg-white">
        <div className="container-professional">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-fresh-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Secure Checkout</h3>
              <p className="text-sm text-gray-600">Your payment information is safe</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-fresh-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🚚</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Fast Shipping</h3>
              <p className="text-sm text-gray-600">5-7 days to most locations</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-fresh-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">↩️</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Easy Returns</h3>
              <p className="text-sm text-gray-600">30-day return policy</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
