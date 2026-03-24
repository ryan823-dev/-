'use client';

import React, { useState } from 'react';
import {
  ArrowRight, X, Target, TrendingUp, Send,
  Layers, Brain, Megaphone, Radar, Gauge,
  ChevronRight, Zap, Shield, BarChart3,
  Rocket, Building2, CheckCircle2
} from 'lucide-react';

/* ── Modal ── */
function DemoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div
        className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-md p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">提交成功</h3>
            <p className="text-gray-400 text-sm">我们会在 1 个工作日内联系您。</p>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold text-white mb-1">预约演示</h3>
            <p className="text-gray-400 text-sm mb-6">留下信息，获取您行业的 GTM 路径样板。</p>
            <form
              onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
              className="space-y-4"
            >
              <input
                required placeholder="姓名" type="text"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/50"
              />
              <input
                required placeholder="公司名称" type="text"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/50"
              />
              <input
                required placeholder="邮箱" type="email"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/50"
              />
              <textarea
                placeholder="简述需求（选填）" rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/50 resize-none"
              />
              <button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-2.5 rounded-lg transition-colors text-sm"
              >
                提交
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function LandingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = () => setModalOpen(true);

  return (
    <div className="min-h-screen bg-[#0a0a14] text-gray-100" style={{ fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif' }}>
      <DemoModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a14]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-cyan-500 rounded-md flex items-center justify-center">
              <span className="text-black font-bold text-xs">V</span>
            </div>
            <span className="text-lg font-bold tracking-tight">VertaX</span>
          </div>
          <button
            onClick={openModal}
            className="bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            预约演示
          </button>
        </div>
      </nav>

      {/* ── 1. Hero ── */}
      <section className="pt-20 pb-24 px-6" aria-label="首屏">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full px-4 py-1 text-xs font-medium mb-8 tracking-wide">
            <Zap className="w-3.5 h-3.5" /> GTM Intelligence OS
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            VertaX｜工业出海
            <br />
            <span className="text-cyan-400">GTM Intelligence OS</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            把海外获客做成「可计算、可复制、可审计」的增长系统。
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-500 mb-10">
            <span className="flex items-center gap-1.5"><Brain className="w-4 h-4 text-cyan-500/60" /> Agentic Workflow</span>
            <span className="flex items-center gap-1.5"><Layers className="w-4 h-4 text-cyan-500/60" /> Knowledge Graph</span>
            <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-cyan-500/60" /> RevOps Pipeline</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <button onClick={openModal} className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8 py-3 rounded-lg transition-colors inline-flex items-center gap-2">
              预约演示 <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={openModal} className="border border-white/10 text-gray-300 hover:bg-white/5 px-8 py-3 rounded-lg transition-colors font-medium">
              获取行业方案
            </button>
          </div>
          <p className="text-xs text-gray-600 tracking-wide">不是做营销，是搭一套海外增长底座。</p>
        </div>
      </section>

      {/* ── 2. Value Anchor ── */}
      <section className="py-16 px-6 border-t border-white/5" aria-label="价值锚点">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">方法论与系统缺位，才是出海获客的瓶颈。</h2>
          <p className="text-gray-400 text-lg">VertaX 提供工业出海获客操作系统，让获客从靠人变成靠系统。</p>
        </div>
      </section>

      {/* ── 3. Three Capabilities ── */}
      <section className="py-20 px-6" aria-label="三大能力">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Target, tag: 'ICP Intelligence', title: '目标计算', desc: '把该找谁变成可量化画像与优先级。' },
              { icon: TrendingUp, tag: 'Inbound Growth Engine', title: '增长生产', desc: '多语言 SEO 内容资产，持续吸引高意向客户。' },
              { icon: Send, tag: 'Outbound Execution Layer', title: '精准触达', desc: '公司发现 → 穿透 → 联系人 → 建联推进。' },
            ].map(({ icon: Icon, tag, title, desc }) => (
              <div key={tag} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 hover:border-cyan-500/20 transition-colors">
                <Icon className="w-8 h-8 text-cyan-400 mb-4" />
                <p className="text-xs text-cyan-500/70 font-medium tracking-wide mb-1">{tag}</p>
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. GTM Flywheel ── */}
      <section className="py-20 px-6 bg-white/[0.02]" aria-label="GTM增长飞轮">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">GTM 增长飞轮（闭环）</h2>
          <p className="text-gray-500 text-center mb-12 text-sm">Knowledge → ICP → Content → Traffic → Leads → Outreach → Pipeline → Feedback</p>

          {/* Flywheel visual */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {['Knowledge', 'ICP', 'Content', 'Traffic', 'Leads', 'Outreach', 'Pipeline', 'Feedback'].map((step, i) => (
              <React.Fragment key={step}>
                <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/15 rounded-md px-3 py-1.5 text-xs font-medium">{step}</span>
                {i < 7 && <ChevronRight className="w-4 h-4 text-gray-600 self-center" />}
              </React.Fragment>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Radar, title: 'Signal Intelligence', desc: '市场 / 客户信号聚合' },
              { icon: Gauge, title: 'Decision Cockpit', desc: '决策驾驶舱' },
              { icon: Shield, title: 'Pipeline Discipline', desc: '商机推进纪律' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
                <Icon className="w-5 h-5 text-cyan-500/60 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Product Architecture ── */}
      <section className="py-20 px-6" aria-label="产品架构">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">产品架构：三层中枢</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                color: 'cyan', label: 'A', title: '战略中枢', sub: 'Strategy & Intelligence',
                items: [
                  { name: 'GTM Copilot', desc: '趋势简报 / 阶段汇报 / 动作建议' },
                  { name: 'Knowledge Engine', desc: '产品 / 资质 / 竞品 / 市场结构化沉淀' },
                ],
              },
              {
                color: 'violet', label: 'B', title: '增长中枢', sub: 'Growth & Acquisition',
                items: [
                  { name: 'Inbound Engine', desc: '关键词 → 规划 → 生成 → 优化 → 多格式分发' },
                  { name: 'Brand Station', desc: '社媒矩阵 / PR 协同 / 声量运营' },
                ],
              },
              {
                color: 'amber', label: 'C', title: '执行中枢', sub: 'Execution & Pipeline',
                items: [
                  { name: 'Acquisition Radar', desc: 'ICP → 公司 → 穿透 → 联系人' },
                  { name: 'Opportunity Accelerator', desc: '审批 / 待办 / 跟进 / 协作 / 复盘' },
                ],
              },
            ].map(({ label, title, sub, items, color }) => {
              const accent = color === 'cyan' ? 'text-cyan-400 border-cyan-500/20 bg-cyan-500/10'
                : color === 'violet' ? 'text-violet-400 border-violet-500/20 bg-violet-500/10'
                : 'text-amber-400 border-amber-500/20 bg-amber-500/10';
              const accentDot = color === 'cyan' ? 'bg-cyan-500' : color === 'violet' ? 'bg-violet-500' : 'bg-amber-500';

              return (
                <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
                  <div className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium border mb-4 ${accent}`}>
                    {label}
                  </div>
                  <h3 className="text-lg font-bold mb-0.5">{title}</h3>
                  <p className="text-xs text-gray-500 mb-5">{sub}</p>
                  <div className="space-y-4">
                    {items.map(({ name, desc }) => (
                      <div key={name} className="flex items-start gap-2.5">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${accentDot}`} />
                        <div>
                          <p className="text-sm font-medium">{name}</p>
                          <p className="text-xs text-gray-500">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 6. Decision Cockpit ── */}
      <section className="py-20 px-6 bg-white/[0.02]" aria-label="决策驾驶舱">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">
            Decision Cockpit｜<span className="text-cyan-400">一屏看清</span>
          </h2>
          <p className="text-gray-500 text-center mb-10 text-sm">投入、节奏、结果</p>

          <div className="space-y-4">
            {[
              { icon: BarChart3, text: '新增有效线索、行业热度、关键客户名单' },
              { icon: Gauge, text: '团队进度与瓶颈：谁在卡、卡在哪' },
              { icon: Megaphone, text: '一键生成：周报 / 月报 / 战略简报（可直接发群）' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-4 bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
                <Icon className="w-5 h-5 text-cyan-500/60 shrink-0" />
                <p className="text-sm">{text}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-600 mt-6">老板要的不是功能，是可控感。</p>
        </div>
      </section>

      {/* ── 7. Why VertaX ── */}
      <section className="py-20 px-6" aria-label="差异化">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-10">不是工具集合，是工业出海获客的操作系统。</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              { title: '资产化', desc: '每一次获客动作都沉淀为可复用的组织资产，不因人员流动归零。' },
              { title: '标准化', desc: '从 ICP 定义到跟进节奏，全流程有标准、可度量。' },
              { title: '可审计', desc: '动作记录、效果归因、成本核算，全链路透明可追溯。' },
            ].map(({ title, desc }) => (
              <div key={title} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
                <h3 className="text-lg font-bold text-cyan-400 mb-2">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. Deployment ── */}
      <section className="py-20 px-6 bg-white/[0.02]" aria-label="部署方式">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">两种部署形态</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-8">
              <Rocket className="w-7 h-7 text-cyan-400 mb-4" />
              <h3 className="text-lg font-bold mb-2">快速上车</h3>
              <p className="text-sm text-gray-400 leading-relaxed">标准模板，即刻跑通。无需 IT 团队，注册即用，数据随时导出。</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-8">
              <Building2 className="w-7 h-7 text-violet-400 mb-4" />
              <h3 className="text-lg font-bold mb-2">企业级落地</h3>
              <p className="text-sm text-gray-400 leading-relaxed">权限 / 审批 / 私有知识库 / 数据隔离。按组织架构定制，深度融入业务流程。</p>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-8">先跑通，再沉淀成组织能力。</p>
        </div>
      </section>

      {/* ── 9. Final CTA ── */}
      <section className="py-24 px-6" aria-label="行动号召">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">让出海获客从项目制升级为系统工程。</h2>
          <p className="text-gray-400 mb-8">预约演示，拿到你行业的 GTM 路径样板与 ICP 示例。</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={openModal} className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8 py-3 rounded-lg transition-colors inline-flex items-center gap-2">
              预约演示 <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={openModal} className="border border-white/10 text-gray-300 hover:bg-white/5 px-8 py-3 rounded-lg transition-colors font-medium">
              获取行业方案
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-cyan-500 rounded flex items-center justify-center">
              <span className="text-black font-bold text-xs">V</span>
            </div>
            <span className="text-sm font-medium">VertaX</span>
            <span className="text-xs text-gray-600 ml-2">&copy; {new Date().getFullYear()} VERTAX LIMITED</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-500">
            <span>contact@vertax.top</span>
            <a href="https://tower.vertax.top" className="hover:text-gray-300 transition-colors">管理后台</a>
            <div className="flex flex-col items-center gap-1">
              <img src="/wechat-qr.jpg" alt="WeChat" className="w-16 h-16 rounded opacity-80" />
              <span className="text-[10px] text-gray-600">微信公众号</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
