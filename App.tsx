
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import MarketingDrive from './components/MarketingDrive';
import AIProspecting from './components/AIProspecting';
import KnowledgeEngine from './components/KnowledgeEngine';
import PromotionHub from './components/PromotionHub';
import ProductModeling from './components/ProductModeling';
import LeadRuns from './components/LeadRuns';
import LeadPool from './components/LeadPool';
import CompanyDetail from './components/CompanyDetail';
import SocialPresence from './components/SocialPresence';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import { NavItem, ContentAsset, ClientAction, UserRole, RoleType, ReportData } from './types';
import * as MockData from './lib/mock';
import { Sparkles, CheckCircle2, AlertCircle, RefreshCw, Send, Terminal, Clock, ChevronDown, User, ShieldCheck, Database, Info, Command, ArrowRightCircle } from 'lucide-react';

const ROLES: Record<RoleType, UserRole> = {
  BOSS: { 
    type: 'BOSS', 
    label: '决策者', 
    description: '老板/负责人', 
    accessLevel: '全局战略视图', 
    color: 'bg-gold',
    permissions: {
      canApprove: true,
      canUploadDocs: false,
      canViewReports: true,
      canExecuteTasks: false,
    }
  },
  STAFF: { 
    type: 'STAFF', 
    label: '执行者', 
    description: '员工/助理', 
    accessLevel: '任务执行视图', 
    color: 'bg-blue-500',
    permissions: {
      canApprove: false,
      canUploadDocs: true,
      canViewReports: false,
      canExecuteTasks: true,
    }
  },
};

const StrategicHome: React.FC<{ onNavigate: (item: NavItem) => void, actions: ClientAction[], role: UserRole }> = ({ onNavigate, actions, role }) => {
  const [messages, setMessages] = useState<{ role: 'ai' | 'user', content: React.ReactNode }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const report = MockData.getWeeklyReport(MockData.mockReportData);
  const scrollRef = useRef<HTMLDivElement>(null);

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
                您好，我是您的 <span className="text-gold underline underline-offset-8 decoration-2">专属出海增长专家</span>
              </h2>
              <p className="text-slate-500 mt-6 leading-relaxed text-sm font-medium">
                基于 VertaX 智能引擎，我已为 <span className="text-navy-900 font-bold">涂豆科技</span> 深度定制了本周的全球获客策略。
                目前我们在德国与墨西哥市场的获客进度超出预期，以下是为您准备的决策简报。
              </p>
            </div>

            <h3 className="text-base font-bold text-navy-900 mb-8 flex items-center gap-3">
              <Sparkles size={20} className="text-gold" />
              {role.label} 专属增长快报
            </h3>
            
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
              <div className="xl:col-span-7 space-y-8">
                <section className="bg-white/40 p-5 rounded-2xl border border-border/40">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">一、核心增长结论</h4>
                  <p className="text-sm text-navy-900 font-bold leading-relaxed">
                    {report.conclusion}
                  </p>
                </section>

                <section>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex justify-between items-center">
                    二、系统关键战果汇总
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
                      report.results.map((res, i) => (
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
                <section>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">三、当前业务阻塞点</h4>
                  <div className="space-y-3">
                    {report.blockers.map((blk, i) => (
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
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">四、行动建议 (确认)</h4>
                  <p className="text-xs text-navy-900 font-bold italic mb-5 leading-relaxed bg-gold/5 p-4 rounded-xl border border-gold/10">{report.action}</p>
                  <button 
                    onClick={() => onNavigate(NavItem.PromotionHub)}
                    className="w-full bg-navy-900 text-white px-6 py-4 rounded-2xl text-xs font-bold hover:bg-navy-800 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95"
                  >
                    立即处理阻塞 <ArrowRightCircle size={16} className="text-gold" />
                  </button>
                </section>
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
        content: `已确认。根据 ${role.label} 授权，我正在重新扫描 OfferingCard 缺口。建议优先补齐 2 项典型参数以激活线索匹配。` 
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 w-full space-y-8">
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
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-navy-800/50 rounded-xl border border-navy-700">
                <Clock size={14} className="text-slate-500" />
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase">最后活跃: 刚刚</span>
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
                  <Command size={14} /> 快捷预案
                </p>
                {['一分钟汇报', '拍板事项', '对外口径', '本周战果', '阻塞穿透'].map(chip => (
                  <button key={chip} onClick={() => handleSend(chip)} className="w-full text-left px-4 py-3.5 rounded-2xl bg-navy-900 text-[11px] text-slate-400 hover:text-gold border border-navy-700 transition-all font-bold hover:border-gold/30 hover:bg-navy-800/50 group">
                    <span className="group-hover:translate-x-1 inline-block transition-transform">{chip}</span>
                  </button>
                ))}
                <div className="mt-auto p-4 bg-gold/5 rounded-2xl border border-gold/10 text-center">
                   <p className="text-[10px] text-gold font-bold italic leading-relaxed">AI 建议：查看北欧市场线索</p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-navy-900 border-t border-navy-800 shrink-0">
              <div className="relative group max-w-6xl mx-auto flex items-center">
                <input 
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder={`作为 ${role.label}，直接询问关于出海战略、内容或获客进度的问题...`} 
                  className="w-full bg-navy-800/60 border-navy-700 rounded-3xl px-10 py-6 text-sm text-white focus:ring-2 focus:ring-gold/30 transition-all outline-none border group-hover:border-navy-600 pr-24 shadow-inner"
                />
                <button onClick={() => handleSend()} className="absolute right-2.5 top-2.5 bottom-2.5 bg-gold px-6 rounded-2xl text-navy-900 hover:bg-gold/90 transition-all shadow-xl shadow-gold/20 active:scale-95 flex items-center justify-center">
                  <Send size={22} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-5">
             <div className="flex justify-between items-center px-6">
               <h3 className="text-sm font-bold text-navy-900 flex items-center gap-3 uppercase tracking-widest">
                 <RefreshCw size={16} className="text-gold" /> 待你拍板推进 (Top 3)
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
                          立即推进
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

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
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold mb-5 relative z-10">AI 执行官洞察</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-8 relative z-10">识别到喷涂工作站参数关键缺口。补齐典型工件尺寸将提升选型手册生成质量，加速线索转化 22%。</p>
            <button onClick={() => onNavigate(NavItem.PromotionHub)} className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[11px] font-bold transition-all border border-white/10 flex items-center justify-center gap-2">
              <Database size={14} className="text-gold" /> 立即补齐资料
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // URL Hash <-> NavItem mapping for persistent navigation
  const hashToNav: Record<string, NavItem> = {
    '': NavItem.StrategicHome,
    'home': NavItem.StrategicHome,
    'knowledge': NavItem.KnowledgeEngine,
    'marketing': NavItem.MarketingDrive,
    'outreach': NavItem.OutreachRadar,
    'social': NavItem.SocialPresence,
    'hub': NavItem.PromotionHub,
  };
  const navToHash: Record<NavItem, string> = {
    [NavItem.StrategicHome]: 'home',
    [NavItem.KnowledgeEngine]: 'knowledge',
    [NavItem.MarketingDrive]: 'marketing',
    [NavItem.OutreachRadar]: 'outreach',
    [NavItem.SocialPresence]: 'social',
    [NavItem.PromotionHub]: 'hub',
  };

  // Initialize from URL hash
  const getNavFromHash = (): NavItem => {
    const hash = window.location.hash.replace('#', '');
    return hashToNav[hash] || NavItem.StrategicHome;
  };

  const [activeItem, setActiveItem] = useState<NavItem>(getNavFromHash);
  const [assets, setAssets] = useState<ContentAsset[]>(MockData.contentAssets);
  const [actions, setActions] = useState<ClientAction[]>(MockData.generateClientActions());
  const [currentRole, setCurrentRole] = useState<UserRole>(ROLES.BOSS);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync URL hash when activeItem changes
  useEffect(() => {
    const newHash = navToHash[activeItem] || 'home';
    if (window.location.hash !== `#${newHash}`) {
      window.history.pushState(null, '', `#${newHash}`);
    }
  }, [activeItem]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setActiveItem(getNavFromHash());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleActionComplete = (id: string) => {
    setActions(prev => prev.map(a => 
      a.id === id ? { 
        ...a, 
        status: '已完成' as const, 
        completedAt: new Date().toLocaleString(),
        resultSummary: '通过推进中台手动标记完成' 
      } : a
    ));
  };

  const handleAssetApprove = (id: string, comment: string) => {
    setAssets(prev => prev.map(a => 
      a.id === id ? { ...a, status: '待发布' as const, lastModified: new Date().toLocaleDateString() } : a
    ));
  };

  const handleAssetRevise = (id: string, comment: string) => {
    setAssets(prev => prev.map(a => 
      a.id === id ? { ...a, status: '已修改' as const, lastModified: new Date().toLocaleDateString() } : a
    ));
  };

  const renderContent = () => {
    switch (activeItem) {
      case NavItem.StrategicHome: 
        return <StrategicHome onNavigate={setActiveItem} actions={actions} role={currentRole} />;
      case NavItem.KnowledgeEngine: return <KnowledgeEngine onNavigate={setActiveItem} />;
      case NavItem.MarketingDrive: return <MarketingDrive assets={assets} />;
      case NavItem.OutreachRadar:
        return <AIProspecting onSelectCompany={setSelectedCompanyId} />;
      case NavItem.PromotionHub: 
        return <PromotionHub actions={actions} assets={assets} onNavigate={setActiveItem} onActionComplete={handleActionComplete} onAssetApprove={handleAssetApprove} onAssetRevise={handleAssetRevise} />;
      case NavItem.SocialPresence:
        return <SocialPresence />;
      default:
        return (
          <div className="bg-ivory-surface p-12 rounded-[3rem] border border-border text-center">
             <div className="max-w-md mx-auto space-y-6">
                <div className="w-20 h-20 bg-navy-900 text-gold rounded-3xl flex items-center justify-center mx-auto shadow-xl"><Sparkles size={32} /></div>
                <div>
                  <h3 className="font-bold text-navy-900 text-lg">模块深度开发中</h3>
                  <p className="text-sm text-slate-500 mt-2">该功能正针对 {currentRole.label} 业务流进行 AI 适配优化...</p>
                </div>
             </div>
          </div>
        );
    }
  };

  return (
    <ErrorBoundary>
      <ToastProvider>
        <div className="flex min-h-screen bg-ivory text-text">
          <Sidebar activeItem={activeItem} onNavigate={setActiveItem} />
          <main className="flex-1 flex flex-col h-screen overflow-hidden">
            <header className="h-20 bg-ivory-surface border-b border-border px-10 flex items-center justify-between shrink-0 z-20">
              <div className="flex items-center gap-6 flex-1">
                 <div className="flex items-center gap-1.5 bg-ivory px-6 py-3 rounded-full border border-border shadow-sm group cursor-pointer hover:bg-white transition-colors">
                    <span className="text-[12px] font-bold text-slate-400 uppercase tracking-tighter">当前演示项目</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[14px] font-bold text-navy-900">
                        涂豆科技 | TD Robotic Paint System
                      </span>
                      <span className="text-[10px] bg-gold/10 text-gold px-2 py-0.5 rounded-md font-mono border border-gold/20">
                        tdpaintcell.vertax.top
                      </span>
                      <ChevronDown size={14} className="text-gold group-hover:translate-y-0.5 transition-transform" />
                    </div>
                 </div>
              </div>
              <div className="flex items-center gap-8">
                 <div className="relative" ref={dropdownRef}>
                    <div onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)} className="flex items-center gap-3 bg-navy-900 p-2 pr-5 rounded-[1.5rem] border border-navy-800 cursor-pointer hover:bg-navy-800 transition-all select-none shadow-2xl shadow-navy-900/10 active:scale-95">
                       <div className={`w-10 h-10 rounded-xl ${currentRole.color} flex items-center justify-center text-xs font-bold text-navy-900 transition-colors shadow-inner`}>{currentRole.label}</div>
                       <div className="hidden xl:block">
                         <p className="text-[11px] font-bold text-white leading-none">{currentRole.description}</p>
                         <div className="flex items-center gap-1.5 mt-1.5"><ShieldCheck size={12} className="text-gold" /><p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{currentRole.accessLevel}</p></div>
                       </div>
                       <ChevronDown size={16} className={`text-slate-500 ml-2 transition-transform duration-300 ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                    {isRoleDropdownOpen && (
                      <div className="absolute right-0 mt-4 w-72 bg-white border border-border rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 z-50">
                         <div className="px-6 py-5 bg-slate-50 border-b border-border"><p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">切换工作视图维度</p></div>
                         <div className="p-3">
                            {Object.values(ROLES).map((role) => (
                              <button key={role.type} onClick={() => { setCurrentRole(role); setIsRoleDropdownOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${currentRole.type === role.type ? 'bg-ivory border-gold/20 shadow-sm' : 'hover:bg-slate-50'}`}>
                                 <div className={`w-11 h-11 rounded-xl ${role.color} flex items-center justify-center text-xs font-bold text-navy-900 shadow-md`}>{role.label}</div>
                                 <div className="text-left"><p className="text-xs font-bold text-navy-900">{role.description}</p><p className="text-[11px] text-slate-500 mt-1">{role.accessLevel}</p></div>
                                 {currentRole.type === role.type && <CheckCircle2 size={18} className="text-gold ml-auto" />}
                              </button>
                            ))}
                         </div>
                      </div>
                    )}
                 </div>
              </div>
            </header>
            <section className="flex-1 overflow-y-auto p-12 bg-ivory scrollbar-hide">
              <ErrorBoundary>
                <div className="max-w-7xl mx-auto">{renderContent()}</div>
              </ErrorBoundary>
            </section>
            {selectedCompanyId && (
              <CompanyDetail 
                companyId={selectedCompanyId} 
                onClose={() => setSelectedCompanyId(null)} 
              />
            )}
          </main>
        </div>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
