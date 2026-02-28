import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavItem, ClientAction, UserRole } from '../types';
import * as MockData from '../lib/mock';
import { 
  Sparkles, CheckCircle2, AlertCircle, RefreshCw, Send, Terminal, Clock, 
  ChevronDown, ShieldCheck, Database, Info, Command, ArrowRightCircle, 
  FileText, Download, Copy, TrendingUp, BarChart3, Globe, Users, 
  Zap, BookOpen, Upload, ListTodo, MessageSquare, X
} from 'lucide-react';

// ---- 全局数据仪表盘组件 ----
const GlobalDashboard: React.FC<{ stats: any; role: UserRole }> = ({ stats, role }) => {
  const modules = [
    { 
      name: '专业知识引擎', icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-50',
      metrics: stats ? [
        { label: '知识卡片', value: stats.knowledgeCards || 12, trend: '+3' },
        { label: '完整度', value: '78%', trend: '+5%' },
      ] : [
        { label: '知识卡片', value: 12, trend: '+3' },
        { label: '完整度', value: '78%', trend: '+5%' },
      ],
      health: 'good' as string,
    },
    { 
      name: '出海获客雷达', icon: Globe, color: 'text-blue-500', bg: 'bg-blue-50',
      metrics: stats ? [
        { label: '潜在客户', value: stats.companies?.total || 0, trend: `+${stats.companies?.total || 0}` },
        { label: '已评分', value: stats.companies?.scored || 0, trend: '' },
      ] : [
        { label: '潜在客户', value: 0, trend: '待启动' },
        { label: '已评分', value: 0, trend: '' },
      ],
      health: (stats?.companies?.total > 0 ? 'good' : 'warning') as string,
    },
    { 
      name: 'SEO 内容中台', icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-50',
      metrics: stats ? [
        { label: '内容资产', value: stats.contentAssets || 0, trend: '' },
        { label: '关键词组', value: stats.keywordClusters || 0, trend: '' },
      ] : [
        { label: '内容资产', value: 0, trend: '待创建' },
        { label: '关键词组', value: 0, trend: '' },
      ],
      health: 'warning' as string,
    },
    { 
      name: '出海声量枢纽', icon: MessageSquare, color: 'text-orange-500', bg: 'bg-orange-50',
      metrics: stats ? [
        { label: '已发布', value: stats.social?.published || 0, trend: '' },
        { label: '总曝光', value: stats.social?.impressions?.toLocaleString() || '0', trend: '' },
      ] : [
        { label: '已发布', value: 0, trend: '待接入' },
        { label: '总曝光', value: '0', trend: '' },
      ],
      health: (stats?.social?.published > 0 ? 'good' : 'warning') as string,
    },
  ];

  const healthColor = (h: string) => {
    if (h === 'good') return 'bg-emerald-400';
    if (h === 'warning') return 'bg-amber-400';
    return 'bg-red-400';
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {modules.map((mod) => (
        <div key={mod.name} className="bg-ivory-surface p-5 rounded-2xl border border-border custom-shadow hover:border-gold/40 transition-all">
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-8 h-8 rounded-xl ${mod.bg} flex items-center justify-center`}>
              <mod.icon size={16} className={mod.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{mod.name}</p>
            </div>
            <div className={`w-2 h-2 rounded-full ${healthColor(mod.health)}`} />
          </div>
          <div className="space-y-2">
            {mod.metrics.map((m, i) => (
              <div key={i} className="flex justify-between items-baseline">
                <span className="text-[10px] text-slate-400">{m.label}</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-bold text-navy-900 font-mono">{m.value}</span>
                  {m.trend && <span className="text-[9px] text-emerald-500 font-bold">{m.trend}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ---- 战略汇报生成器组件 ----
const ReportGenerator: React.FC<{ stats: any; actions: ClientAction[]; report: any; onClose: () => void }> = ({ stats, actions, report, onClose }) => {
  const [reportType, setReportType] = useState<'weekly' | 'monthly' | 'executive'>('weekly');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);

  const generateReport = useCallback(async () => {
    setIsGenerating(true);
    
    // 构建汇报数据
    const pendingCount = actions.filter(a => a.status !== '已完成').length;
    const p0Count = actions.filter(a => a.priority === 'P0' && a.status !== '已完成').length;
    const completedCount = actions.filter(a => a.status === '已完成').length;

    const reportTemplates: Record<string, string> = {
      weekly: `【VertaX 出海获客周报】
━━━━━━━━━━━━━━━━━━━━━━━━

一、本周核心结论
${report.conclusion}

二、关键数据
${stats ? `- 已建模产品：${stats.products} 个
- 获客任务：已执行 ${stats.runs?.total || 0} 次，完成 ${stats.runs?.done || 0} 次
- 潜在客户：${stats.companies?.total || 0} 家（已评分 ${stats.companies?.scored || 0} 家）
- 社交内容：已发布 ${stats.social?.published || 0} 篇，总曝光 ${stats.social?.impressions?.toLocaleString() || 0}` 
: `- 产品建模：进行中\n- 获客任务：启动准备中\n- 数据源：接入中`}

三、待处理事项（${pendingCount} 项）
- P0 紧急事项：${p0Count} 项
- 已完成事项：${completedCount} 项
${actions.filter(a => a.status !== '已完成').slice(0, 5).map(a => `- [${a.priority}] ${a.title}`).join('\n')}

四、当前阻塞点
${report.blockers.map((b: any) => `- ${b.title}（影响：${b.impact}）`).join('\n')}

五、下周建议
${report.action}

━━━━━━━━━━━━━━━━━━━━━━━━
由 VertaX 智能引擎自动生成`,

      monthly: `【VertaX 出海获客月度总结】
━━━━━━━━━━━━━━━━━━━━━━━━

项目概况
- 项目名称：涂豆科技全球获客
- 报告周期：本月度
- 战略方向：Inbound SEO + Outbound 精准获客双轨并行

一、月度业绩总览
${stats ? `产品建模：${stats.products} 个产品已完成数字化建模
线索发现：${stats.companies?.total || 0} 家潜在客户，${stats.companies?.scored || 0} 家完成评分
内容建设：${stats.social?.published || 0} 篇内容已发布
客户触达：${stats.companies?.outreached || 0} 家已完成初次触达`
: '数据接入中，首月为系统搭建期'}

二、各模块进展
1. 专业知识引擎 - 基础数据已录入，ICP 画像持续优化
2. 出海获客雷达 - ${stats?.runs?.total || 0} 次获客任务已执行
3. SEO 内容中台 - 关键词研究与内容规划进行中
4. 出海声量枢纽 - 社交渠道布局与内容发布体系已建立

三、核心问题与风险
${report.blockers.map((b: any) => `- ${b.title}\n  影响范围：${b.impact}`).join('\n')}

四、下月重点计划
${report.action}

━━━━━━━━━━━━━━━━━━━━━━━━
由 VertaX 智能引擎自动生成`,

      executive: `【涂豆科技 - 全球获客进展简报】
━━━━━━━━━━━━━━━━━━━━━━━━

致：负责人
自：VertaX 出海获客智能体

一句话总结：
${report.conclusion}

核心指标：
${stats ? `✅ ${stats.companies?.total || 0} 家海外潜在客户已进入线索池
✅ ${stats.companies?.scored || 0} 家完成智能评分
✅ ${stats.companies?.outreached || 0} 家已触达`
: '⏳ 系统搭建中，预计首批线索本周产出'}

需要您决策的事项（${p0Count} 项紧急）：
${actions.filter(a => a.priority === 'P0' && a.status !== '已完成').map(a => `🔴 ${a.title} - ${a.reason}`).join('\n') || '暂无紧急事项'}

━━━━━━━━━━━━━━━━━━━━━━━━
由 VertaX 智能引擎自动生成`
    };

    // 模拟生成延迟
    await new Promise(r => setTimeout(r, 1200));
    setGeneratedReport(reportTemplates[reportType]);
    setIsGenerating(false);
  }, [reportType, stats, actions, report]);

  const copyToClipboard = () => {
    if (generatedReport) {
      navigator.clipboard.writeText(generatedReport);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-ivory-surface rounded-[2.5rem] border border-border shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-8 py-6 border-b border-border flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-lg font-bold text-navy-900 flex items-center gap-3">
              <FileText size={20} className="text-gold" /> 战略汇报生成器
            </h2>
            <p className="text-xs text-slate-400 mt-1">自动整合各模块数据，生成结构化汇报文档</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Report type selector */}
        <div className="px-8 py-4 border-b border-border flex gap-3 shrink-0">
          {([
            { id: 'weekly' as const, label: '周报', desc: '本周进展与下周计划' },
            { id: 'monthly' as const, label: '月报', desc: '月度总结与趋势分析' },
            { id: 'executive' as const, label: '老板简报', desc: '精简决策要点' },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => { setReportType(t.id); setGeneratedReport(null); }}
              className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
                reportType === t.id 
                  ? 'bg-navy-900 text-white shadow-lg' 
                  : 'bg-white border border-border text-slate-500 hover:border-gold/30'
              }`}
            >
              {t.label}
              <span className="block text-[9px] font-normal mt-0.5 opacity-70">{t.desc}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {!generatedReport ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText size={28} className="text-gold" />
              </div>
              <p className="text-sm text-navy-900 font-bold mb-2">
                {reportType === 'weekly' ? '周度战略汇报' : reportType === 'monthly' ? '月度总结报告' : '老板决策简报'}
              </p>
              <p className="text-xs text-slate-400 mb-8">点击下方按钮，AI 将自动整合各模块数据生成汇报</p>
              <button
                onClick={generateReport}
                disabled={isGenerating}
                className="bg-navy-900 text-white px-8 py-4 rounded-2xl text-sm font-bold hover:bg-navy-800 transition-all shadow-xl disabled:opacity-50 flex items-center gap-3 mx-auto"
              >
                {isGenerating ? (
                  <><RefreshCw size={16} className="animate-spin" /> 正在生成汇报...</>
                ) : (
                  <><Sparkles size={16} className="text-gold" /> 一键生成汇报</>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <pre className="bg-white border border-border rounded-2xl p-6 text-xs text-navy-900 whitespace-pre-wrap leading-relaxed font-sans max-h-[50vh] overflow-y-auto">
                {generatedReport}
              </pre>
              <div className="flex gap-3 justify-end">
                <button onClick={copyToClipboard} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-border text-xs font-bold text-navy-900 hover:border-gold/30 transition-all">
                  <Copy size={14} /> 复制全文
                </button>
                <button onClick={() => setGeneratedReport(null)} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-border text-xs font-bold text-slate-500 hover:border-gold/30 transition-all">
                  <RefreshCw size={14} /> 重新生成
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---- 主组件 ----
interface StrategicHomeProps {
  onNavigate: (item: NavItem) => void;
  actions: ClientAction[];
  role: UserRole;
}

const StrategicHome: React.FC<StrategicHomeProps> = ({ onNavigate, actions, role }) => {
  const [messages, setMessages] = useState<{ role: 'ai' | 'user', content: React.ReactNode }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const report = MockData.getWeeklyReport(MockData.mockReportData);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isBoss = role.type === 'BOSS';

  // Home only shows Top 3-5 Pending actions
  const topActions = actions
    .filter(a => a.status !== '已完成')
    .sort((a, b) => {
      const priorityMap = { P0: 0, P1: 1, P2: 2 };
      return priorityMap[a.priority] - priorityMap[b.priority];
    })
    .slice(0, 3);

  // Fetch real dashboard stats
  useEffect(() => {
    fetch('/api/stats/dashboard')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setDashboardStats(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    setMessages([
      {
        role: 'ai',
        content: (
          <div className="bg-ivory-surface border border-border p-8 rounded-[2.5rem] custom-shadow w-full border-l-8 border-l-gold relative overflow-hidden">
            <div className="absolute top-6 right-8 flex gap-4 items-center opacity-70">
              <div className="flex flex-col items-end">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  数据最后同步: {MockData.mockReportData.updatedAt}
                </p>
                <div className="flex gap-1.5 mt-1.5">
                  {['Site', 'Content', 'Social', 'Radar'].map((label, idx) => (
                    <div key={label} className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${idx === 1 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    </div>
                  ))}
                </div>
              </div>
              <Info size={14} className="text-slate-300" />
            </div>

            <div className="max-w-2xl mb-8">
              <h2 className="text-3xl font-bold text-navy-900 leading-tight">
                {isBoss 
                  ? <>您好，我是您的 <span className="text-gold underline underline-offset-8 decoration-2">专属出海增长专家</span></>
                  : <>您好，我是您的 <span className="text-gold underline underline-offset-8 decoration-2">出海获客工作助手</span></>
                }
              </h2>
              <p className="text-slate-500 mt-6 leading-relaxed text-sm font-medium">
                {isBoss 
                  ? <>基于 VertaX 智能引擎，我已为 <span className="text-navy-900 font-bold">涂豆科技</span> 深度定制了本周的全球获客策略。目前我们在德国与墨西哥市场的获客进度超出预期，以下是为您准备的决策简报。</>
                  : <>以下是当前需要您配合推进的工作事项。您可以上传产品资料、查看待办任务，或直接询问任何工作相关问题。</>
                }
              </p>
            </div>

            <h3 className="text-base font-bold text-navy-900 mb-8 flex items-center gap-3">
              <Sparkles size={20} className="text-gold" />
              {isBoss ? '决策者专属增长快报' : '执行者工作台'}
            </h3>
            
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
              <div className="xl:col-span-7 space-y-8">
                {isBoss && (
                  <section className="bg-white/40 p-5 rounded-2xl border border-border/40">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">一、核心增长结论</h4>
                    <p className="text-sm text-navy-900 font-bold leading-relaxed">
                      {report.conclusion}
                    </p>
                  </section>
                )}

                <section>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex justify-between items-center">
                    {isBoss ? '二、系统关键战果汇总' : '一、当前系统数据'}
                    {MockData.mockReportData.isDemo && <span className="text-[9px] bg-gold text-white px-2 py-0.5 rounded-full font-bold">示例模式 (v0.2)</span>}
                  </h4>
                  <ul className="grid grid-cols-1 gap-3">
                    {dashboardStats ? (
                      <>
                        <li className="text-xs text-navy-900 flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-border/30 hover:border-gold/30 transition-all font-medium">
                          <CheckCircle2 size={16} className="text-gold shrink-0" /> 已建模产品 {dashboardStats.products} 个，已执行获客任务 {dashboardStats.runs.total} 次（完成 {dashboardStats.runs.done} 次）
                        </li>
                        <li className="text-xs text-navy-900 flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-border/30 hover:border-gold/30 transition-all font-medium">
                          <CheckCircle2 size={16} className="text-gold shrink-0" /> 已发现潜在客户 {dashboardStats.companies.total} 家（已评分 {dashboardStats.companies.scored} 家，已触达 {dashboardStats.companies.outreached} 家）
                        </li>
                        <li className="text-xs text-navy-900 flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-border/30 hover:border-gold/30 transition-all font-medium">
                          <CheckCircle2 size={16} className="text-gold shrink-0" /> 社交内容已发布 {dashboardStats.social.published} 篇，已排程 {dashboardStats.social.scheduled} 篇，总曝光 {dashboardStats.social.impressions.toLocaleString()}
                        </li>
                      </>
                    ) : (
                      report.results.map((res: string, i: number) => (
                        <li key={i} className="text-xs text-navy-900 flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-border/30 hover:border-gold/30 transition-all font-medium">
                          <CheckCircle2 size={16} className="text-gold shrink-0" /> {res}
                        </li>
                      ))
                    )}
                    {MockData.mockReportData.siteMetrics.visits.status !== 'active' && (
                      <li className="text-xs text-slate-400 flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        <Database size={16} className="shrink-0" /> 阅读/下载：待接入官方站点统计 (GA/GSC)
                      </li>
                    )}
                  </ul>
                </section>
              </div>

              <div className="xl:col-span-5 space-y-8">
                {isBoss ? (
                  <>
                    <section>
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">三、当前业务阻塞点</h4>
                      <div className="space-y-3">
                        {report.blockers.map((blk: any, i: number) => (
                          <div key={i} className="bg-red-50/50 border border-red-100 p-4 rounded-2xl flex gap-4 transition-all hover:bg-red-50">
                            <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-navy-900">{blk.title}</p>
                              <p className="text-[11px] text-red-700/70 mt-1 font-medium leading-tight">影响：{blk.impact}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                    <section className="pt-6 border-t border-border">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">四、行动建议</h4>
                      <p className="text-xs text-navy-900 font-bold italic mb-5 leading-relaxed bg-gold/5 p-4 rounded-xl border border-gold/10">{report.action}</p>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => onNavigate(NavItem.PromotionHub)}
                          className="flex-1 bg-navy-900 text-white px-4 py-4 rounded-2xl text-xs font-bold hover:bg-navy-800 transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95"
                        >
                          立即处理 <ArrowRightCircle size={14} className="text-gold" />
                        </button>
                        <button 
                          onClick={() => setShowReportGenerator(true)}
                          className="bg-gold/10 text-gold px-4 py-4 rounded-2xl text-xs font-bold hover:bg-gold/20 transition-all border border-gold/20 flex items-center gap-2 active:scale-95"
                        >
                          <FileText size={14} /> 生成汇报
                        </button>
                      </div>
                    </section>
                  </>
                ) : (
                  <>
                    <section>
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">二、待你完成的任务</h4>
                      <div className="space-y-3">
                        {topActions.length > 0 ? topActions.map((a) => (
                          <div key={a.id} className="bg-white/60 border border-border/40 p-4 rounded-2xl flex gap-4 hover:border-gold/30 transition-all">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              a.priority === 'P0' ? 'bg-red-50 text-red-600' : a.priority === 'P1' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                            }`}>{a.priority}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-navy-900 truncate">{a.title}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{a.type}</p>
                            </div>
                          </div>
                        )) : (
                          <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl text-center">
                            <CheckCircle2 size={20} className="text-emerald-400 mx-auto mb-2" />
                            <p className="text-xs text-emerald-700 font-bold">暂无待办任务</p>
                          </div>
                        )}
                      </div>
                    </section>
                    <section className="pt-6 border-t border-border">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">三、快捷操作</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => onNavigate(NavItem.KnowledgeEngine)} className="bg-purple-50 text-purple-700 p-4 rounded-2xl text-xs font-bold hover:bg-purple-100 transition-all flex flex-col items-center gap-2">
                          <Upload size={18} /> 上传资料
                        </button>
                        <button onClick={() => onNavigate(NavItem.PromotionHub)} className="bg-blue-50 text-blue-700 p-4 rounded-2xl text-xs font-bold hover:bg-blue-100 transition-all flex flex-col items-center gap-2">
                          <ListTodo size={18} /> 查看全部任务
                        </button>
                      </div>
                    </section>
                  </>
                )}
              </div>
            </div>
          </div>
        )
      }
    ]);
  }, [role]);

  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleSend = async (text?: string) => {
    const q = text || inputValue;
    if (!q || isChatLoading) return;
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setInputValue('');
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, role: role.label })
      });

      if (!res.ok) throw new Error('Chat request failed');
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: isBoss
          ? `已确认。根据决策者授权，我正在重新扫描 OfferingCard 缺口。建议优先补齐 2 项典型参数以激活线索匹配。`
          : `已收到。我正在为您整理相关信息，请稍候。如需上传资料，请前往「专业知识引擎」模块。`
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const quickActions = isBoss
    ? ['一分钟汇报', '拍板事项', '对外口径', '本周战果', '阻塞穿透']
    : ['上传资料', '查看任务', '提交进度', '知识库查询', '问题反馈'];

  return (
    <div className="space-y-8 pb-10">
      {/* 全局数据仪表盘 */}
      <GlobalDashboard stats={dashboardStats} role={role} />

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 w-full space-y-8">
          {/* AI 对话区域 */}
          <div className="bg-navy-900 rounded-[3rem] border border-navy-800 shadow-2xl flex flex-col h-[70vh] min-h-[550px] overflow-hidden relative">
            <div className="px-8 py-5 border-b border-navy-800 bg-navy-900/60 flex justify-between items-center backdrop-blur-xl shrink-0">
              <div className="flex items-center gap-5">
                <div className="w-11 h-11 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold shadow-inner">
                  <Terminal size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-widest uppercase">出海获客智能体 | {role.label} VIEW</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                    <span className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter uppercase">AI Engine Connected | 实时数据流</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-3">
                {isBoss && (
                  <button 
                    onClick={() => setShowReportGenerator(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gold/10 rounded-xl border border-gold/20 text-gold text-[10px] font-bold hover:bg-gold/20 transition-all"
                  >
                    <FileText size={12} /> 生成汇报
                  </button>
                )}
                <div className="flex items-center gap-2 px-4 py-2 bg-navy-800/50 rounded-xl border border-navy-700">
                  <Clock size={14} className="text-slate-500" />
                  <span className="text-[10px] font-bold text-slate-400 font-mono uppercase">最后活跃: 刚刚</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
              <div ref={scrollRef} className="flex-1 p-10 space-y-10 overflow-y-auto scrollbar-hide bg-navy-900/40">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                    <div className={`${msg.role === 'ai' ? 'w-full' : 'max-w-[70%]'}`}>
                      {msg.role === 'ai' ? <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">{msg.content}</div> : (
                        <div className="px-7 py-5 rounded-[2rem] rounded-tr-none bg-gold text-navy-900 text-sm font-bold shadow-2xl shadow-gold/10">{msg.content}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="w-44 border-l border-navy-800 bg-navy-900/40 p-6 flex flex-col gap-4 hidden md:flex shrink-0">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
                  <Command size={14} /> {isBoss ? '决策预案' : '执行预案'}
                </p>
                {quickActions.map(chip => (
                  <button key={chip} onClick={() => handleSend(chip)} className="w-full text-left px-4 py-3.5 rounded-2xl bg-navy-900 text-[11px] text-slate-400 hover:text-gold border border-navy-700 transition-all font-bold hover:border-gold/30 hover:bg-navy-800/50 group">
                    <span className="group-hover:translate-x-1 inline-block transition-transform">{chip}</span>
                  </button>
                ))}
                <div className="mt-auto p-4 bg-gold/5 rounded-2xl border border-gold/10 text-center">
                   <p className="text-[10px] text-gold font-bold italic leading-relaxed">
                     {isBoss ? 'AI 建议：查看北欧市场线索' : 'AI 建议：补齐产品参数资料'}
                   </p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-navy-900 border-t border-navy-800 shrink-0">
              <div className="relative group max-w-6xl mx-auto flex items-center">
                <input 
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder={isBoss 
                    ? '作为决策者，直接询问关于出海战略、内容或获客进度的问题...' 
                    : '有什么需要帮助的？可以查询任务进度、操作指引等...'
                  }
                  className="w-full bg-navy-800/60 border-navy-700 rounded-3xl px-10 py-6 text-sm text-white focus:ring-2 focus:ring-gold/30 transition-all outline-none border group-hover:border-navy-600 pr-24 shadow-inner"
                />
                <button onClick={() => handleSend()} className="absolute right-2.5 top-2.5 bottom-2.5 bg-gold px-6 rounded-2xl text-navy-900 hover:bg-gold/90 transition-all shadow-xl shadow-gold/20 active:scale-95 flex items-center justify-center">
                  <Send size={22} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>

          {/* 待办行动区域 */}
          <div className="space-y-5">
             <div className="flex justify-between items-center px-6">
               <h3 className="text-sm font-bold text-navy-900 flex items-center gap-3 uppercase tracking-widest">
                 <RefreshCw size={16} className="text-gold" /> {isBoss ? '待你拍板推进' : '待办任务'} (Top 3)
               </h3>
               <button onClick={() => onNavigate(NavItem.PromotionHub)} className="text-[10px] font-bold text-gold hover:underline uppercase tracking-widest">查看推进中台全量列表 →</button>
             </div>
             <div className="grid grid-cols-1 gap-4">
                {topActions.map(item => (
                  <div key={item.id} className={`bg-ivory-surface rounded-[2.5rem] border p-8 custom-shadow transition-all hover:border-gold/40 ${item.priority === 'P0' ? 'border-l-4 border-l-red-500 border-border' : 'border-border'}`}>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-bold px-3 py-1 rounded-lg border uppercase tracking-widest ${
                            item.type === '资料补齐' || item.priority === 'P0' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                            {item.type}
                          </span>
                          <h4 className="font-bold text-navy-900 text-lg">{item.title}</h4>
                        </div>
                        <p className="text-xs text-navy-900/60 font-medium leading-relaxed max-w-2xl">{item.reason}</p>
                      </div>
                      <div className="shrink-0">
                        <button 
                          onClick={() => onNavigate(NavItem.PromotionHub)}
                          className="bg-navy-900 text-white px-10 py-4 rounded-2xl text-xs font-bold hover:bg-navy-800 transition-all shadow-xl min-w-[160px]"
                        >
                          {isBoss ? '立即推进' : '去处理'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* 右侧面板 */}
        <div className="w-full lg:w-80 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            {MockData.stats.map((stat, i) => (
              <div key={i} className="bg-ivory-surface p-6 rounded-[2rem] border border-border custom-shadow group hover:border-gold/50 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">{stat.label}</p>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    stat.status === '需关注' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {stat.status}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-navy-900 tracking-tight font-mono">{stat.value}</span>
                  <span className="text-[10px] font-bold text-slate-400">{stat.sub}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-navy-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border border-navy-800">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold mb-5 relative z-10">
              {isBoss ? 'AI 执行官洞察' : 'AI 助手建议'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-8 relative z-10">
              {isBoss 
                ? '识别到喷涂工作站参数关键缺口。补齐典型工件尺寸将提升选型手册生成质量，加速线索转化 22%。'
                : '您有 3 项资料待上传。完成后将解锁更精准的客户匹配能力。'
              }
            </p>
            <button onClick={() => onNavigate(isBoss ? NavItem.PromotionHub : NavItem.KnowledgeEngine)} className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[11px] font-bold transition-all border border-white/10 flex items-center justify-center gap-2">
              <Database size={14} className="text-gold" /> {isBoss ? '立即补齐资料' : '去上传资料'}
            </button>
          </div>
        </div>
      </div>

      {/* 汇报生成器弹窗 */}
      {showReportGenerator && (
        <ReportGenerator 
          stats={dashboardStats} 
          actions={actions} 
          report={report} 
          onClose={() => setShowReportGenerator(false)} 
        />
      )}
    </div>
  );
};

export default StrategicHome;
