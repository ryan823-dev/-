"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Building2, Home, Shield, Award, Globe, Sparkles, Send, Bot } from "lucide-react"

const trustBadges = [
  { icon: Shield, label: "FDA Certified" },
  { icon: Award, label: "EU Compliant" },
  { icon: Globe, label: "50+ Countries" },
]

const quickQuestions = [
  "What products are FDA certified?",
  "MOQ for wholesale orders?",
  "Shipping time to USA?",
  "Bulk pricing available?",
]

const demoResponses = {
  "What products are FDA certified?": "All our fresh-keeping bags and films are FDA 21 CFR compliant and EU 10/2011 certified. This includes our entire B2B product line for food contact safety.",
  "MOQ for wholesale orders?": "Our standard MOQ is 500 units for most products. For custom packaging solutions, MOQ starts at 1,000 units. We also offer sample packs for evaluation.",
  "Shipping time to USA?": "Standard shipping to USA ports takes 15-25 days. We offer FOB, CIF, and DDP options. Express air freight available in 5-7 days for urgent orders.",
  "Bulk pricing available?": "Yes! Volume discounts start at 1,000 units (5% off), 5,000 units (12% off), and 10,000+ units (20% off). Contact us for custom quotes.",
}

export function Hero() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [showResponse, setShowResponse] = useState(false)

  useEffect(() => {
    const cycleQuestions = async () => {
      // Hide response
      setShowResponse(false)
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Change question
      setCurrentQuestion(prev => (prev + 1) % quickQuestions.length)
      setIsTyping(true)
      
      // Show response after typing delay
      await new Promise(resolve => setTimeout(resolve, 800))
      setIsTyping(false)
      setShowResponse(true)
    }

    const interval = setInterval(cycleQuestions, 6000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative min-h-[100vh] md:min-h-[90vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid opacity-20" />
        
        {/* Gradient Orbs - 移动端隐藏或缩小 */}
        <div className="absolute top-1/4 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-fresh-600/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-56 md:w-80 h-56 md:h-80 bg-eco-600/20 rounded-full blur-3xl animate-float animate-delay-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-fresh-600/10 rounded-full blur-3xl" />
        
        {/* Noise Texture */}
        <div className="absolute inset-0 bg-noise" />
      </div>

      {/* Content */}
      <div className="container-professional relative z-10 py-16 md:py-20 lg:py-32 px-4">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-12 items-start">
          {/* Left Content - 2/3 width */}
          <div className="lg:col-span-2 text-center lg:text-left">
            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-2 md:gap-4 mb-6 md:mb-8">
              {trustBadges.map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1 md:py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-xs md:text-sm"
                >
                  <badge.icon className="w-3 h-3 md:w-4 md:h-4 text-fresh-400" />
                  {badge.label}
                </div>
              ))}
            </div>

            {/* Headline - 移动端优化字体大小 */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-hero text-white mb-4 md:mb-6 animate-fade-up leading-tight">
              Advanced{" "}
              <span className="text-gradient">Fresh-Keeping</span>{" "}
              Packaging Solutions
            </h1>

            {/* Subheadline */}
            <p className="text-base md:text-lg lg:text-xl text-gray-300 mb-6 md:mb-8 max-w-xl mx-auto lg:mx-0 animate-fade-up animate-delay-100 leading-relaxed">
              FDA & EU certified packaging for produce businesses and modern homes. 
              Extend freshness, reduce waste, and deliver quality.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row justify-center lg:justify-start animate-fade-up animate-delay-200">
              <Link href="/wholesale">
                <Button size="lg" className="w-full sm:w-auto text-base">
                  <Building2 className="w-5 h-5 mr-2" />
                  For Business
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/shop">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base border-white/30 text-white hover:bg-white/10">
                  <Home className="w-5 h-5 mr-2" />
                  Shop Now
                </Button>
              </Link>
            </div>

            {/* Stats - 移动端优化 */}
            <div className="grid grid-cols-3 gap-4 md:gap-6 mt-8 md:mt-12 pt-6 md:pt-8 border-t border-white/10 animate-fade-up animate-delay-300">
              <div className="text-center lg:text-left">
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">50+</div>
                <div className="text-xs md:text-sm text-gray-400">Countries</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">500+</div>
                <div className="text-xs md:text-sm text-gray-400">Partners</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">200%</div>
                <div className="text-xs md:text-sm text-gray-400">Fresher</div>
              </div>
            </div>
          </div>

          {/* Right Content - AI Assistant Preview - 1/3 width */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="relative">
              {/* AI Assistant Demo Card */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-2xl">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fresh-500 to-eco-500 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">EPXFresh AI Assistant</div>
                    <div className="text-green-400 text-xs flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      Online & Ready
                    </div>
                  </div>
                  <Sparkles className="w-4 h-4 text-fresh-400 ml-auto" />
                </div>

                {/* Chat Preview Area */}
                <div className="space-y-3 mb-4 min-h-[180px]">
                  {/* User Question */}
                  <div className="bg-white/10 rounded-lg p-3 animate-fade-up">
                    <div className="text-white text-xs leading-relaxed">
                      {quickQuestions[currentQuestion]}
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className={`transition-all duration-500 ${showResponse ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                    {isTyping ? (
                      <div className="bg-gradient-to-br from-fresh-600/20 to-eco-600/20 rounded-lg p-3 border border-fresh-500/30">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-fresh-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-fresh-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-fresh-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-fresh-600/20 to-eco-600/20 rounded-lg p-3 border border-fresh-500/30">
                        <div className="text-white/90 text-xs leading-relaxed">
                          {demoResponses[quickQuestions[currentQuestion] as keyof typeof demoResponses]}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  {quickQuestions.slice(0, 4).map((question, index) => (
                    <button
                      key={question}
                      className={`text-xs px-3 py-2 rounded-lg border transition-all text-left truncate ${
                        index === currentQuestion && showResponse
                          ? 'bg-fresh-600/30 border-fresh-500/50 text-white'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {question}
                    </button>
                  ))}
                </div>

                {/* Input Area */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                    <input
                      type="text"
                      placeholder="Ask about products, pricing..."
                      className="flex-1 bg-transparent text-white text-xs placeholder:text-gray-500 focus:outline-none"
                      readOnly
                    />
                    <button className="p-1.5 bg-fresh-600 rounded-md hover:bg-fresh-500 transition-colors">
                      <Send className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-3 text-center">
                  <Link href="/contact">
                    <div className="text-xs text-fresh-400 hover:text-fresh-300 transition-colors cursor-pointer">
                      Chat with our team →
                    </div>
                  </Link>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -top-3 -right-3 bg-white rounded-xl px-3 py-2 shadow-xl animate-float">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-fresh-600" />
                  <div className="text-xs font-semibold text-gray-900">AI-Powered</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile AI Assistant Entry - 只在移动端显示 */}
        <div className="lg:hidden mt-8">
          <Link href="/contact" className="block">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-fresh-500 to-eco-500 flex items-center justify-center shrink-0">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-white font-semibold text-base">Need help?</div>
                  <div className="text-gray-400 text-sm">Chat with our AI assistant →</div>
                </div>
                <ArrowRight className="w-5 h-5 text-fresh-400" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  )
}
