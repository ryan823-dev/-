import { Metadata } from 'next';
import { Check, ArrowRight, Building2, Rocket, Handshake } from 'lucide-react';

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
    <div className="min-h-screen bg-[#0a0a14] text-gray-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a14]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-cyan-500 rounded-md flex items-center justify-center">
              <span className="text-black font-bold text-xs">V</span>
            </div>
            <span className="text-lg font-bold tracking-tight">VertaX</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a href="/" className="text-gray-400 hover:text-white transition-colors">首页</a>
            <a href="/features" className="text-gray-400 hover:text-white transition-colors">功能</a>
            <a href="/pricing" className="text-white font-medium">合作方案</a>
            <a href="/about" className="text-gray-400 hover:text-white transition-colors">关于</a>
            <a href="/contact" className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-4 py-1.5 rounded-lg transition-colors">
              预约演示
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            企业级<span className="text-cyan-400">合作方案</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            VertaX 采用商务洽谈制，根据企业规模、行业特性、部署需求定制方案与报价。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/contact"
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8 py-3 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              预约演示 <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#process"
              className="border border-white/10 text-gray-300 hover:bg-white/5 px-8 py-3 rounded-lg transition-colors font-medium"
            >
              了解合作流程
            </a>
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">三种服务层级</h2>
          <p className="text-gray-500 text-center mb-12 text-sm">根据企业需求灵活选择，支持升级与定制</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 hover:border-cyan-500/20 transition-colors"
              >
                <tier.icon className="w-10 h-10 text-cyan-400 mb-6" />
                <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                <p className="text-sm text-gray-400 mb-2">{tier.description}</p>
                <p className="text-xs text-cyan-500/70 mb-6">{tier.bestFor}</p>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 mb-6">
                  <p className="text-xs text-cyan-400 text-center">{tier.note}</p>
                </div>
                <a
                  href="/contact"
                  className="block w-full py-3 rounded-lg text-center font-semibold border border-white/10 hover:bg-white/5 text-gray-300 transition-colors"
                >
                  咨询该方案
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Note */}
      <section className="py-20 px-6 bg-white/[0.02]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">关于报价</h2>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8">
            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              VertaX 是企业级 GTM 基础设施，我们采用<span className="text-cyan-400 font-semibold">商务洽谈制</span>，
              而非标准化订阅价格。这是因为每家企业的行业特性、目标市场、团队规模、合规需求都不同，
              需要定制配置方案。
            </p>
            <p className="text-gray-400 text-sm leading-relaxed">
              我们建议您预约演示，在了解您的具体需求后，我们会提供详细的配置方案与报价。
              全功能企业版首年投入约在<span className="text-cyan-400 font-medium">20 万元左右</span>，
              具体价格根据配置与服务范围浮动。
            </p>
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="process" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">合作流程</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {processSteps.map((step) => (
              <div key={step.step} className="text-center">
                <div className="text-4xl font-bold text-cyan-500/30 mb-4">{step.step}</div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deployment Options */}
      <section className="py-20 px-6 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">部署方式</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-8">
              <h3 className="text-lg font-bold mb-2">SaaS 云端版</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                快速部署，免运维。数据加密存储，支持随时导出。
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>• 云端托管，自动更新</li>
                <li>• 按需配置，灵活扩展</li>
                <li>• 企业级安全防护</li>
              </ul>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-8">
              <h3 className="text-lg font-bold mb-2">私有部署版</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                数据本地化，完全自主可控。适合有合规要求的企业。
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>• 本地服务器部署</li>
                <li>• 数据完全自主</li>
                <li>• 深度定制集成</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
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
            <a
              href="/contact"
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8 py-3 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              预约演示 <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/features"
              className="border border-white/10 text-gray-300 hover:bg-white/5 px-8 py-3 rounded-lg transition-colors font-medium"
            >
              了解功能
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-cyan-500 rounded flex items-center justify-center">
              <span className="text-black font-bold text-xs">V</span>
            </div>
            <span className="text-sm font-medium">VertaX</span>
            <span className="text-xs text-gray-600 ml-2">© {new Date().getFullYear()} VERTAX LIMITED</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-500">
            <span>contact@vertax.top</span>
            <a href="https://tower.vertax.top" className="hover:text-gray-300 transition-colors">管理后台</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
