'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, X, CheckCircle2, Shield, Users, Zap, Globe, Menu } from 'lucide-react';
import { colors } from '@/lib/design-tokens';

// Re-export colors for convenience
export { colors };

/* ── Marketing Navigation Component ── */
export function MarketingNav({ showEnLink = true }: { showEnLink?: boolean }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        background: 'rgba(11,18,32,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid rgba(${colors.brand.goldRgb},0.12)`,
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black"
            style={{
              background: colors.brand.gold,
              color: colors.bg.dark,
              boxShadow: `0 0 20px rgba(${colors.brand.goldRgb},0.3)`,
            }}
          >
            V
          </div>
          <div>
            <span className="text-lg font-bold text-white tracking-tight">VertaX</span>
            <span className="hidden sm:inline text-[9px] ml-2 px-2 py-0.5 rounded font-bold uppercase tracking-widest" style={{ color: colors.brand.gold, background: `rgba(${colors.brand.goldRgb},0.1)` }}>
              Growth Chamber
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 text-sm">
          <Link href="/features" className="text-gray-300 hover:text-white transition-colors">产品功能</Link>
          <Link href="/solutions" className="text-gray-300 hover:text-white transition-colors">解决方案</Link>
          <Link href="/cases" className="text-gray-300 hover:text-white transition-colors">客户案例</Link>
          <Link href="/about/what-is-vertax" className="text-gray-300 hover:text-white transition-colors">关于我们</Link>
          <Link href="/faq" className="text-gray-300 hover:text-white transition-colors">FAQ</Link>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          {showEnLink && (
            <Link
              href="/en"
              className="hidden sm:flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm px-3 py-1.5"
            >
              <Globe className="w-4 h-4" /> EN
            </Link>
          )}
          <Link
            href="/contact"
            className="font-semibold px-5 py-2 rounded-lg transition-all text-sm"
            style={{
              background: colors.brand.gold,
              color: colors.bg.dark,
            }}
          >
            预约演示
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2"
            aria-label="菜单"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 px-4 py-4 space-y-1" style={{ background: colors.bg.dark }}>
          <Link href="/features" className="block text-sm text-gray-300 hover:text-white py-3 px-3 rounded-lg hover:bg-white/5">产品功能</Link>
          <Link href="/solutions" className="block text-sm text-gray-300 hover:text-white py-3 px-3 rounded-lg hover:bg-white/5">解决方案</Link>
          <Link href="/cases" className="block text-sm text-gray-300 hover:text-white py-3 px-3 rounded-lg hover:bg-white/5">客户案例</Link>
          <Link href="/about/what-is-vertax" className="block text-sm text-gray-300 hover:text-white py-3 px-3 rounded-lg hover:bg-white/5">关于我们</Link>
          <Link href="/faq" className="block text-sm text-gray-300 hover:text-white py-3 px-3 rounded-lg hover:bg-white/5">FAQ</Link>
          {showEnLink && (
            <div className="pt-3 border-t border-white/5 mt-3">
              <Link href="/en" className="block text-sm text-gray-400 py-3 px-3 rounded-lg hover:bg-white/5 flex items-center gap-2">
                <Globe className="w-4 h-4" /> English Version
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

/* ── Marketing Footer Component ── */
export function MarketingFooter() {
  return (
    <footer
      className="py-12 px-4 sm:px-6"
      style={{
        background: colors.bg.dark,
        borderTop: `1px solid rgba(${colors.brand.goldRgb},0.1)`,
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-start justify-between gap-8">
          {/* Logo & Copyright */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
                style={{
                  background: colors.brand.gold,
                  color: colors.bg.dark,
                }}
              >
                V
              </div>
              <span className="text-base font-bold text-white">VertaX</span>
            </Link>
            <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} VERTAX LIMITED</p>
          </div>

          {/* Navigation */}
          <div className="flex gap-12 text-sm">
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.brand.gold }}>产品</span>
              <Link href="/features" className="text-gray-400 hover:text-white transition-colors">产品功能</Link>
              <Link href="/features/modules" className="text-gray-400 hover:text-white transition-colors">六大模块</Link>
              <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">价格</Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.brand.gold }}>解决方案</span>
              <Link href="/solutions" className="text-gray-400 hover:text-white transition-colors">解决方案</Link>
              <Link href="/cases" className="text-gray-400 hover:text-white transition-colors">客户案例</Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.brand.gold }}>关于</span>
              <Link href="/about/what-is-vertax" className="text-gray-400 hover:text-white transition-colors">关于我们</Link>
              <Link href="/faq" className="text-gray-400 hover:text-white transition-colors">常见问题</Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.brand.gold }}>联系</span>
              <span className="text-gray-500">contact@vertax.top</span>
              <Link href="/en" className="text-gray-400 hover:text-white transition-colors">English</Link>
            </div>
          </div>

          {/* QR Codes */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <img src="/wechat-qr.jpg" alt="微信公众号" className="w-16 h-16 rounded-lg" />
              <span className="text-[10px] text-gray-600">微信公众号</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <img src="/contact-wechat.jpg" alt="业务联系人微信" className="w-16 h-16 rounded-lg" />
              <span className="text-[10px] text-gray-600">业务联系</span>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden space-y-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black"
                style={{
                  background: colors.brand.gold,
                  color: colors.bg.dark,
                }}
              >
                V
              </div>
              <span className="text-sm font-bold text-white">VertaX</span>
            </Link>
            <span className="text-xs text-gray-600">&copy; {new Date().getFullYear()} VERTAX LIMITED</span>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Link href="/features" className="text-gray-400 py-2">产品功能</Link>
            <Link href="/solutions" className="text-gray-400 py-2">解决方案</Link>
            <Link href="/cases" className="text-gray-400 py-2">客户案例</Link>
            <Link href="/pricing" className="text-gray-400 py-2">价格</Link>
            <Link href="/about/what-is-vertax" className="text-gray-400 py-2">关于我们</Link>
            <Link href="/faq" className="text-gray-400 py-2">常见问题</Link>
          </div>

          {/* Contact & QR */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <span className="text-xs text-gray-500">contact@vertax.top</span>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <img src="/wechat-qr.jpg" alt="微信公众号" className="w-12 h-12 rounded" />
                <span className="text-[10px] text-gray-600">公众号</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <img src="/contact-wechat.jpg" alt="业务联系人微信" className="w-12 h-12 rounded" />
                <span className="text-[10px] text-gray-600">业务联系</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ── Page Wrapper with Standard Layout ── */
export function MarketingPageWrapper({
  children,
  showEnLink = true,
}: {
  children: React.ReactNode;
  showEnLink?: boolean;
}) {
  return (
    <div
      className="min-h-screen"
      style={{
        background: colors.bg.primary,
        fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
      }}
    >
      <MarketingNav showEnLink={showEnLink} />
      {children}
      <MarketingFooter />
    </div>
  );
}

/* ── Dark Section Wrapper ── */
export function DarkSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`py-16 sm:py-20 px-4 sm:px-6 ${className}`}
      style={{ background: colors.bg.darkGradient }}
    >
      {children}
    </section>
  );
}

/* ── Light Section Wrapper ── */
export function LightSection({ children, className = '', bg = 'primary' }: { children: React.ReactNode; className?: string; bg?: 'primary' | 'secondary' }) {
  return (
    <section
      className={`py-16 sm:py-20 px-4 sm:px-6 ${className}`}
      style={{ background: bg === 'primary' ? colors.bg.primary : colors.bg.secondary }}
    >
      {children}
    </section>
  );
}

/* ── Section Header Component ── */
export function SectionHeader({
  badge,
  title,
  subtitle,
  align = 'center',
  dark = false,
}: {
  badge: string;
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
  dark?: boolean;
}) {
  const textAlign = align === 'center' ? 'text-center' : 'text-left';
  const titleColor = dark ? 'text-white' : colors.text.primary;
  const subtitleColor = dark ? 'text-gray-500' : colors.text.muted;

  return (
    <div className={`${textAlign} mb-12`}>
      <span
        className="text-xs font-bold uppercase tracking-widest mb-3 inline-block"
        style={{ color: colors.brand.gold }}
      >
        {badge}
      </span>
      <h2 className={`text-2xl sm:text-3xl font-bold ${dark ? 'text-white' : ''}`} style={!dark ? { color: titleColor } : undefined}>
        {title}
      </h2>
      {subtitle && (
        <p className={`text-sm mt-2 ${dark ? 'text-gray-500' : ''}`} style={!dark ? { color: subtitleColor } : undefined}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ── Gold CTA Button ── */
export function GoldButton({
  children,
  href,
  onClick,
  className = '',
  size = 'default',
  icon,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  size?: 'default' | 'large';
  icon?: React.ReactNode;
}) {
  const sizeClasses = size === 'large' ? 'px-8 py-4 text-base' : 'px-5 py-2 text-sm';
  const Component = href ? 'a' : 'button';
  const props = href ? { href } : { onClick };

  return (
    <Component
      {...props}
      className={`font-semibold rounded-xl transition-all inline-flex items-center justify-center gap-2 ${sizeClasses} ${className}`}
      style={{
        background: colors.brand.gold,
        color: colors.bg.dark,
        boxShadow: size === 'large' ? `0 0 30px rgba(${colors.brand.goldRgb},0.3)` : undefined,
      }}
    >
      {children}
      {icon}
    </Component>
  );
}

/* ── Outline Button ── */
export function OutlineButton({
  children,
  href,
  onClick,
  className = '',
  dark = true,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  dark?: boolean;
}) {
  const Component = href ? 'a' : 'button';
  const props = href ? { href } : { onClick };

  return (
    <Component
      {...props}
      className={`border px-5 py-2 rounded-lg transition-colors font-medium text-sm ${className}`}
      style={{
        borderColor: dark ? 'rgba(255,255,255,0.15)' : colors.border.medium,
        color: dark ? 'white' : colors.text.primary,
      }}
    >
      {children}
    </Component>
  );
}

/* ── Card Component ── */
export function Card({
  children,
  className = '',
  dark = false,
  goldBorder = false,
}: {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
  goldBorder?: boolean;
}) {
  const bgColor = dark ? 'rgba(255,255,255,0.03)' : colors.bg.secondary;
  const borderColor = goldBorder ? colors.border.medium : (dark ? colors.border.white : colors.border.light);

  return (
    <div
      className={`rounded-2xl p-6 transition-all ${className}`}
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        boxShadow: dark ? undefined : '0 4px 20px rgba(0,0,0,0.03)',
      }}
    >
      {children}
    </div>
  );
}

/* ── Gold Badge Component ── */
export function GoldBadge({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium"
      style={{
        background: `rgba(${colors.brand.goldRgb},0.1)`,
        border: `1px solid rgba(${colors.brand.goldRgb},0.3)`,
        color: colors.brand.gold,
      }}
    >
      {icon}
      {children}
    </div>
  );
}

/* ── Trust Indicators ── */
export function TrustIndicators() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
      <span className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4" style={{ color: colors.brand.gold }} />
        面向制造业、工业品企业
      </span>
      <span className="flex items-center gap-2">
        <Shield className="w-4 h-4" style={{ color: colors.brand.gold }} />
        数据安全合规
      </span>
      <span className="flex items-center gap-2">
        <Users className="w-4 h-4" style={{ color: colors.brand.gold }} />
        100+ 企业信赖
      </span>
    </div>
  );
}