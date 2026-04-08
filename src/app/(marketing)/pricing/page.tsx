import { Metadata } from 'next';
import Link from 'next/link';
import { Check, ArrowRight, Building2, Rocket, Handshake } from 'lucide-react';
import { BreadcrumbSchema, breadcrumbPaths } from '@/components/seo/breadcrumb-schema';
import { colors } from '@/lib/design-tokens';
import { MarketingNav, MarketingFooter, SectionHeader, Card, GoldButton, OutlineButton, GoldBadge } from '@/components/marketing/design-system';

export const metadata: Metadata = {
  title: '合作方案 - VertaX GTM Intelligence OS',
  description: 'VertaX 提供标准化的企业级 GTM 系统，采用商务洽谈制。根据企业规模、行业特性、部署需求定制方案。',
  keywords: ['企业版 GTM', '定制方案', '商务洽谈', '私有部署', '企业获客系统'],
  openGraph: {
    title: '合作方案 - VertaX GTM Intelligence OS',
    description: '企业级 GTM 系统，采用商务洽谈制。根据企业需求定制方案与报价。',
    type: 'website',
  },
};

const tiers = [
  {
    icon: Rocket,
    name: '快速上车版',
    description: '标准模板，即刻跑通',
    bestFor: '初次尝试 GTM 数字化的企业',
    features: [
      '标准 GTM 模板配置',
      '基础 ICP 画像分析',
      '获客雷达（限额线索）',
      'AI 内容生成（基础额度）',
      '邮箱发现（基础额度）',
      '基础数据看板',
      '邮件支持',
      '数据随时导出',
      '无需 IT 团队，注册即用',
    ],
    note: '适合快速验证 GTM 数字化价值',
    highlight: false,
  },
  {
    icon: Building2,
    name: '企业标准版',
    description: '完整功能，深度赋能',
    bestFor: '有稳定海外业务团队的企业',
    features: [
      '知识引擎完整功能',
      '获客雷达（高额度线索）',
      'AI 内容生成（高额度）',
      '邮箱发现（高额度）',
      '社交媒体自动化',
      '决策驾驶舱',
      '团队协作权限',
      '优先技术支持',
      'API 访问能力',
      '季度业务复盘',
    ],
    note: '最受欢迎的企业选择',
    highlight: true,
  },
  {
    icon: Handshake,
    name: '企业定制版',
    description: '私有部署，深度定制',
    bestFor: '大型企业与集团客户',
    features: [
      '全部企业标准版功能',
      '无限线索与内容生成',
      '权限 / 审批 / 数据隔离',
      '私有知识库定制',
      '自定义工作流',
      'SSO 单点登录集成',
      '专属客户成功经理',
      '现场培训与实施',
      'SLA 服务保障',
      '7x24 技术支持',
    ],
    note: '适合有合规与定制化需求的大型企业',
    highlight: false,
  },
];

const processSteps = [
  {
    step: '01',
    title: '需求沟通',
    description: '了解您的行业、目标市场、团队规模与业务目标',
  },
  {
    step: '02',
    title: '方案演示',
    description: '为您定制行业 GTM 路径样板与 ICP 示例演示',
  },
  {
    step: '03',
    title: '商务洽谈',
    description: '根据企业需求定制配置方案与报价',
  },
  {
    step: '04',
    title: '签约实施',
    description: '合同签订后，快速部署与团队培训',
  },
];

export default function PricingPage() {
  return (
    <>
      <BreadcrumbSchema items={breadcrumbPaths.pricing} />
      <div className="min-h-screen" style={{ background: colors.bg.primary, fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif' }}>
        <MarketingNav />

        {/* Hero Section */}
        <section
          className="pt-16 pb-20 px-4 sm:px-6"
          style={{ background: 'linear-gradient(180deg, #0B1220 0%, #0D1526 50%, #F7F3EA 100%)' }}
        >
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6 text-white">
              企业级<span style={{ color: colors.brand.gold }}>合作方案</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              VertaX 采用商务洽谈制，根据企业规模、行业特性、部署需求定制方案与报价。
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <GoldButton href="/contact" size="large" icon={<ArrowRight className="w-4 h-4" />}>
                预约演示
              </GoldButton>
              <OutlineButton href="#process">
                了解合作流程
              </OutlineButton>
            </div>
          </div>
        </section>

        {/* Tiers */}
        <section className="py-16 sm:py-20 px-4 sm:px-6" style={{ background: colors.bg.primary }}>
          <div className="max-w-6xl mx-auto">
            <SectionHeader
              badge="服务层级"
              title="三种服务层级"
              subtitle="根据企业需求灵活选择，支持升级与定制"
              align="center"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tiers.map((tier) => (
                <div
                  key={tier.name}
                  className="rounded-2xl p-8 transition-all hover:-translate-y-1"
                  style={{
                    background: tier.highlight ? `linear-gradient(180deg, rgba(${colors.brand.goldRgb},0.1) 0%, rgba(${colors.brand.goldRgb},0.02) 100%)` : colors.bg.secondary,
                    border: `1px solid ${tier.highlight ? colors.border.medium : colors.border.light}`,
                    boxShadow: tier.highlight ? `0 0 30px rgba(${colors.brand.goldRgb},0.1)` : '0 4px 20px rgba(0,0,0,0.03)',
                  }}
                >
                  <tier.icon className="w-10 h-10 mb-6" style={{ color: colors.brand.gold }} />
                  <h3 className="text-xl font-bold mb-2" style={{ color: colors.text.primary }}>{tier.name}</h3>
                  <p className="text-sm mb-2" style={{ color: colors.text.secondary }}>{tier.description}</p>
                  <p className="text-xs mb-6" style={{ color: colors.brand.gold }}>{tier.bestFor}</p>
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm" style={{ color: colors.text.primary }}>
                        <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: colors.brand.gold }} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div
                    className="rounded-lg p-3 mb-6"
                    style={{
                      background: `rgba(${colors.brand.goldRgb},0.08)`,
                      border: `1px solid rgba(${colors.brand.goldRgb},0.15)`,
                    }}
                  >
                    <p className="text-xs text-center" style={{ color: colors.brand.gold }}>{tier.note}</p>
                  </div>
                  <Link
                    href="/contact"
                    className="block w-full py-3 rounded-lg text-center font-semibold transition-colors"
                    style={{
                      background: tier.highlight ? colors.brand.gold : 'transparent',
                      color: tier.highlight ? colors.bg.dark : colors.text.primary,
                      border: tier.highlight ? 'none' : `1px solid ${colors.border.medium}`,
                    }}
                  >
                    咨询该方案
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Note */}
        <section className="py-16 sm:py-20 px-4 sm:px-6" style={{ background: colors.bg.secondary }}>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: colors.text.primary }}>关于报价</h2>
            <Card>
              <p className="text-lg leading-relaxed mb-6" style={{ color: colors.text.primary }}>
                VertaX 是企业级 GTM 基础设施，我们采用<span style={{ color: colors.brand.gold, fontWeight: 600 }}>商务洽谈制</span>，
                而非标准化订阅价格。这是因为每家企业的行业特性、目标市场、团队规模、合规需求都不同，
                需要定制配置方案。
              </p>
              <p className="text-sm leading-relaxed" style={{ color: colors.text.secondary }}>
                我们建议您预约演示，在了解您的具体需求后，我们会提供详细的配置方案与报价。
                全功能企业版首年投入约在<span style={{ color: colors.brand.gold, fontWeight: 500 }}>20 万元左右</span>，
                具体价格根据配置与服务范围浮动。
              </p>
            </Card>
          </div>
        </section>

        {/* Process */}
        <section id="process" className="py-16 sm:py-20 px-4 sm:px-6" style={{ background: colors.bg.primary }}>
          <div className="max-w-4xl mx-auto">
            <SectionHeader
              badge="合作流程"
              title="合作流程"
              align="center"
            />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {processSteps.map((step) => (
                <div key={step.step} className="text-center">
                  <div
                    className="text-4xl font-bold mb-4"
                    style={{ color: `rgba(${colors.brand.goldRgb},0.3)` }}
                  >
                    {step.step}
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: colors.text.primary }}>{step.title}</h3>
                  <p className="text-sm" style={{ color: colors.text.secondary }}>{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Deployment Options */}
        <section className="py-16 sm:py-20 px-4 sm:px-6" style={{ background: colors.bg.secondary }}>
          <div className="max-w-4xl mx-auto">
            <SectionHeader
              badge="部署方式"
              title="部署方式"
              align="center"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-bold mb-2" style={{ color: colors.text.primary }}>SaaS 云端版</h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: colors.text.secondary }}>
                  快速部署，免运维。数据加密存储，支持随时导出。
                </p>
                <ul className="space-y-2 text-sm" style={{ color: colors.text.muted }}>
                  <li>• 云端托管，自动更新</li>
                  <li>• 按需配置，灵活扩展</li>
                  <li>• 企业级安全防护</li>
                </ul>
              </Card>
              <Card>
                <h3 className="text-lg font-bold mb-2" style={{ color: colors.text.primary }}>私有部署版</h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: colors.text.secondary }}>
                  数据本地化，完全自主可控。适合有合规要求的企业。
                </p>
                <ul className="space-y-2 text-sm" style={{ color: colors.text.muted }}>
                  <li>• 本地服务器部署</li>
                  <li>• 数据完全自主</li>
                  <li>• 深度定制集成</li>
                </ul>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section
          className="py-20 sm:py-24 px-4 sm:px-6"
          style={{ background: colors.bg.darkGradient }}
        >
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              准备好开始了吗？
            </h2>
            <p className="text-gray-400 mb-8">
              预约演示，了解 VertaX 如何帮助您的企业实现海外增长。
              <br />
              <span className="text-sm text-gray-500">
                我们会为您准备行业 GTM 路径样板与 ICP 示例。
              </span>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <GoldButton href="/contact" size="large" icon={<ArrowRight className="w-4 h-4" />}>
                预约演示
              </GoldButton>
              <OutlineButton href="/features">
                了解功能
              </OutlineButton>
            </div>
          </div>
        </section>

        <MarketingFooter />
      </div>
    </>
  );
}