
import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  AlertCircle, 
  ArrowRight,
  Target,
  Upload,
  ListTodo,
  FileText,
  TrendingUp,
  CheckCircle2,
  Clock,
  ChevronRight,
  Send,
  MessageSquare,
  Briefcase,
  Globe,
  BarChart3,
  Lightbulb,
  Zap
} from 'lucide-react';
import { NavItem, ClientAction, UserRole } from '../types';
import * as MockData from '../lib/mock';
import GlobalDashboard from './GlobalDashboard';
import ReportGenerator from './ReportGenerator';

interface Message {
  role: 'ai' | 'user';
  content: string;
}

interface StrategicHomeProps {
  onNavigate: (item: NavItem) => void;
  actions: ClientAction[];
  role: UserRole;
}

const StrategicHome: React.FC<StrategicHomeProps> = ({ onNavigate, actions, role }) => {
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const report = MockData.getWeeklyReport(MockData.mockReportData);

  // AI Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isBoss = role.type === 'BOSS';

  // Filter and sort actions (with defensive check)
  const safeActions = Array.isArray(actions) ? actions : [];
  const topActions = safeActions
    .filter(a => a.status !== '已完成')
    .sort((a, b) => {
      const priorityMap = { P0: 0, P1: 1, P2: 2 };
      return priorityMap[a.priority] - priorityMap[b.priority];
    })
    .slice(0, 3);

  const p0Count = topActions.filter(a => a.priority === 'P0').length;

  // Fetch dashboard stats
  useEffect(() => {
    fetch('/api/stats/dashboard')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setDashboardStats(data); })
      .catch(() => {});
  }, []);

  // Reset messages when role changes
  useEffect(() => {
    setMessages([]);
  }, [role.type]);

  // Auto-scroll messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const currentTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const currentDate = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });

  // AI Chat handler
  const handleSend = async (text?: string) => {
    const q = text || inputValue;
    if (!q.trim() || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: q, 
          role: role.label,
          context: { currentPage: 'strategic-home' }
        })
      });

      if (!res.ok) throw new Error('Chat request failed');
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch {
      const fallback = isBoss
        ? '收到。我正在为您分析相关数据，稍后呈上完整报告。'
        : '收到。正在为您准备相关信息，请稍候。';
      setMessages(prev => [...prev, { role: 'ai', content: fallback }]);
    } finally {
      setIsLoading(false);
    }
  };

  const hasMessages = messages.length > 0;

  const bossQuickCommands = [
    { label: '一分钟汇报', icon: Zap, desc: '关键数据速览' },
    { label: '本周战果', icon: BarChart3, desc: '线索/内容/社媒' },
    { label: '哪些线索值得跟进', icon: Target, desc: '高价值机会' },
    { label: '增长瓶颈在哪', icon: Lightbulb, desc: '诊断与建议' },
  ];

  const staffQuickCommands = [
    { label: '今日任务', icon: ListTodo, desc: '按优先级排列' },
    { label: '操作指引', icon: Briefcase, desc: '当前模块流程' },
    { label: '上传规范', icon: Upload, desc: '文件格式要求' },
    { label: '进度汇总', icon: TrendingUp, desc: '各模块状态' },
  ];

  const quickCommands = isBoss ? bossQuickCommands : staffQuickCommands;

  return (
    <div className="space-y-6">

      {/* ===== Boss View ===== */}
      {isBoss && (
        <>
          {/* Executive Briefing + AI Consultant Row */}
          <div className="flex gap-6">
            {/* LEFT: Executive Briefing — PRIMARY */}
            <div className="flex-1 space-y-5">
              {/* Briefing Header */}
              <div className="bg-gradient-to-br from-navy-900 via-navy-900 to-navy-800 rounded-2xl p-7 border border-navy-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold/3 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between mb-5 relative">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                      <Sparkles size={20} className="text-gold" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">今日决策简报</h2>
                      <p className="text-[11px] text-slate-400">{currentDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock size={14} />
                    <span className="text-xs font-mono">{currentTime} 更新</span>
                  </div>
                </div>

                <div className="relative mb-6">
                  <p className="text-2xl font-bold text-white leading-relaxed">
                    <span className="text-gold">涂豆科技</span> 全球化获客态势
                  </p>
                  <p className="text-slate-300 mt-2 leading-relaxed text-sm">
                    VertaX 智能引擎已完成深度分析，以下是需要您关注的关键指标与决策事项。
                  </p>
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-4 gap-3 mb-6 relative">
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">知识体系</p>
                    <p className="text-xl font-bold text-white">78<span className="text-sm text-slate-400">%</span></p>
                    <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                      <TrendingUp size={10} /> +8% 本周
                    </p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">潜在客户</p>
                    <p className="text-xl font-bold text-white">{dashboardStats?.companies?.total || 0}<span className="text-sm text-slate-400">家</span></p>
                    <p className="text-[10px] text-slate-400 mt-1">已发现</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">内容资产</p>
                    <p className="text-xl font-bold text-white">3<span className="text-sm text-slate-400">篇</span></p>
                    <p className="text-[10px] text-amber-400 mt-1">2篇待确认</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">待决策项</p>
                    <p className="text-xl font-bold text-white">{p0Count}<span className="text-sm text-slate-400">项</span></p>
                    <p className="text-[10px] text-red-400 mt-1">P0 级阻塞</p>
                  </div>
                </div>

                {/* Core conclusion */}
                <div className="bg-gold/10 border border-gold/20 rounded-xl p-4 relative">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Target size={14} className="text-gold" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gold mb-1.5">核心增长结论</p>
                      <p className="text-sm text-slate-200 leading-relaxed">{report.conclusion}</p>
                    </div>
                  </div>
                </div>

                {/* Dashboard toggle + health */}
                <div className="mt-5 flex items-center justify-between">
                  <button
                    onClick={() => setShowDashboard(!showDashboard)}
                    className="text-xs text-slate-400 hover:text-gold transition-colors flex items-center gap-1"
                  >
                    {showDashboard ? '收起详细仪表盘' : '展开详细仪表盘'}
                    <ChevronRight size={14} className={`transition-transform ${showDashboard ? 'rotate-90' : ''}`} />
                  </button>
                  <div className="flex items-center gap-2">
                    {['知识', '获客', '内容', '社媒'].map((label, idx) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${idx === 3 ? 'bg-red-400' : idx === 2 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                        <span className="text-[10px] text-slate-500">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Priority Actions */}
              <div className="bg-white rounded-2xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-500" />
                    待您拍板推进
                  </h3>
                  <button 
                    onClick={() => onNavigate(NavItem.PromotionHub)}
                    className="text-[11px] text-gold font-medium hover:underline flex items-center gap-1"
                  >
                    查看全部 <ArrowRight size={12} />
                  </button>
                </div>
                <div className="space-y-3">
                  {topActions.map(item => (
                    <div 
                      key={item.id}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:shadow-sm ${
                        item.priority === 'P0' 
                          ? 'bg-red-50/50 border-red-100' 
                          : 'bg-slate-50/50 border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md shrink-0 ${
                          item.priority === 'P0' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>{item.priority}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-navy-900 truncate">{item.title}</p>
                          <p className="text-[11px] text-slate-500 truncate">{item.type}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => onNavigate(NavItem.PromotionHub)}
                        className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold rounded-lg transition-colors shrink-0"
                      >
                        拍板
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: AI Consultant — PROMINENT BUT BALANCED */}
            <div className="w-[360px] shrink-0 bg-gradient-to-b from-navy-900 via-navy-900 to-navy-950 rounded-2xl border border-navy-700 flex flex-col overflow-hidden relative">
              {/* Ambient glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-gold/8 rounded-full blur-3xl pointer-events-none" />

              {/* Consultant Header */}
              <div className="px-5 pt-5 pb-3 relative">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold/25 to-gold/5 flex items-center justify-center shadow-lg shadow-gold/10">
                    <Sparkles size={20} className="text-gold" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">VertaX 出海战略顾问</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] text-emerald-400/80">在线 · 深度了解您的业务</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Commands (when no messages) */}
              {!hasMessages && (
                <div className="px-4 pb-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    {bossQuickCommands.map((cmd) => {
                      const Icon = cmd.icon;
                      return (
                        <button
                          key={cmd.label}
                          onClick={() => handleSend(cmd.label)}
                          className="flex items-center gap-2 p-2.5 rounded-lg bg-navy-800/40 hover:bg-navy-800/70 border border-navy-700/40 hover:border-gold/20 transition-all group text-left"
                        >
                          <div className="w-7 h-7 rounded-md bg-navy-800 flex items-center justify-center shrink-0 group-hover:bg-gold/10 transition-colors">
                            <Icon size={12} className="text-slate-400 group-hover:text-gold transition-colors" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium text-slate-200 group-hover:text-white transition-colors truncate">{cmd.label}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-2.5 scrollbar-hide">
                {!hasMessages && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-[11px] text-slate-600 text-center leading-relaxed px-4">
                      点击快捷指令或直接提问<br/>
                      <span className="text-slate-500">已同步您的产品、客户、进展数据</span>
                    </p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'ai' && (
                      <div className="w-6 h-6 rounded-md bg-gold/15 flex items-center justify-center shrink-0 mr-1.5 mt-1">
                        <Sparkles size={11} className="text-gold" />
                      </div>
                    )}
                    <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'ai'
                        ? 'bg-navy-800/60 text-slate-200 rounded-tl-sm'
                        : 'bg-gold text-navy-900 font-medium rounded-tr-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="w-6 h-6 rounded-md bg-gold/15 flex items-center justify-center shrink-0 mr-1.5 mt-1">
                      <Sparkles size={11} className="text-gold" />
                    </div>
                    <div className="bg-navy-800/60 text-slate-400 px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-sm">
                      <span className="inline-flex gap-1">
                        <span className="w-1.5 h-1.5 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-navy-800/50 shrink-0 bg-navy-950/50">
                <div className="relative">
                  <input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="请指示..."
                    className="w-full bg-navy-800/50 border border-navy-700/50 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-gold/30 focus:border-gold/30 transition-all"
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={isLoading || !inputValue.trim()}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-gold hover:bg-gold/90 disabled:bg-gold/30 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Send size={14} className="text-navy-900" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Expandable Dashboard */}
          {showDashboard && (
            <div className="animate-in slide-in-from-top-4 duration-300">
              <GlobalDashboard onNavigate={onNavigate} />
            </div>
          )}

          {/* Report Generator */}
          <ReportGenerator role={role} companyName="涂豆科技" />
        </>
      )}

      {/* ===== Staff View ===== */}
      {!isBoss && (
        <>
          {/* Staff Briefing + AI Chat Row */}
          <div className="flex gap-6">
            {/* LEFT: Staff Dashboard */}
            <div className="flex-1 space-y-5">
              {/* Work Station Header */}
              <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-700 rounded-2xl p-7 border border-slate-600 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between mb-5 relative">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <ListTodo size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">今日工作台</h2>
                      <p className="text-[11px] text-slate-400">{currentDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock size={14} />
                    <span className="text-xs font-mono">{currentTime}</span>
                  </div>
                </div>

                <div className="relative mb-5">
                  <p className="text-xl font-bold text-white">
                    <span className="text-blue-400">涂豆科技</span> 出海获客工作台
                  </p>
                  <p className="text-slate-300 mt-2 text-sm">以下是今日待处理的执行任务，请按优先级依次完成。</p>
                </div>

                <div className="grid grid-cols-3 gap-3 relative">
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">待处理任务</p>
                    <p className="text-xl font-bold text-white">{topActions.length}<span className="text-sm text-slate-400">项</span></p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">P0 级紧急</p>
                    <p className="text-xl font-bold text-red-400">{p0Count}<span className="text-sm text-slate-400">项</span></p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">预计耗时</p>
                    <p className="text-xl font-bold text-white">30<span className="text-sm text-slate-400">分钟</span></p>
                  </div>
                </div>
              </div>

              {/* Today's Tasks */}
              <div className="bg-white rounded-2xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
                    <ListTodo size={16} className="text-gold" />
                    今日待办任务
                  </h3>
                  <button 
                    onClick={() => onNavigate(NavItem.PromotionHub)}
                    className="text-[11px] text-gold font-medium hover:underline flex items-center gap-1"
                  >
                    查看全部 <ArrowRight size={12} />
                  </button>
                </div>
                <div className="space-y-3">
                  {topActions.map(item => (
                    <div 
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all hover:shadow-sm ${
                        item.priority === 'P0' 
                          ? 'bg-red-50/50 border-red-100 border-l-4 border-l-red-500' 
                          : 'bg-slate-50/50 border-slate-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                              item.priority === 'P0' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            }`}>{item.priority}</span>
                            <span className="text-[10px] text-slate-400">{item.type}</span>
                          </div>
                          <p className="text-sm font-medium text-navy-900 mb-1">{item.title}</p>
                          <p className="text-[11px] text-slate-500 leading-relaxed">{item.reason}</p>
                        </div>
                        <button 
                          onClick={() => onNavigate(NavItem.PromotionHub)}
                          className="px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold rounded-lg transition-colors shrink-0"
                        >
                          去处理
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl border border-border p-6">
                <h3 className="text-sm font-bold text-navy-900 mb-4">快捷操作</h3>
                <div className="grid grid-cols-4 gap-3">
                  <button onClick={() => onNavigate(NavItem.KnowledgeEngine)} className="p-4 bg-gold/5 hover:bg-gold/10 rounded-xl border border-gold/20 transition-colors flex flex-col items-center gap-2">
                    <Upload size={20} className="text-gold" />
                    <span className="text-xs font-medium text-navy-900">上传资料</span>
                  </button>
                  <button onClick={() => onNavigate(NavItem.PromotionHub)} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors flex flex-col items-center gap-2">
                    <ListTodo size={20} className="text-slate-600" />
                    <span className="text-xs font-medium text-navy-900">待办任务</span>
                  </button>
                  <button onClick={() => onNavigate(NavItem.OutreachRadar)} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors flex flex-col items-center gap-2">
                    <Target size={20} className="text-slate-600" />
                    <span className="text-xs font-medium text-navy-900">获客任务</span>
                  </button>
                  <button onClick={() => onNavigate(NavItem.MarketingDrive)} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors flex flex-col items-center gap-2">
                    <FileText size={20} className="text-slate-600" />
                    <span className="text-xs font-medium text-navy-900">内容审校</span>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT: AI Assistant — PROMINENT BUT BALANCED */}
            <div className="w-[360px] shrink-0 bg-gradient-to-b from-slate-800 via-slate-800 to-slate-900 rounded-2xl border border-slate-600 flex flex-col overflow-hidden relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />

              <div className="px-5 pt-5 pb-3 relative">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shadow-lg shadow-blue-500/10">
                    <MessageSquare size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">VertaX 执行助手</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] text-emerald-400/80">在线 · 随时协助您</span>
                    </div>
                  </div>
                </div>
              </div>

              {!hasMessages && (
                <div className="px-4 pb-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    {staffQuickCommands.map((cmd) => {
                      const Icon = cmd.icon;
                      return (
                        <button
                          key={cmd.label}
                          onClick={() => handleSend(cmd.label)}
                          className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-700/40 hover:bg-slate-700/70 border border-slate-600/40 hover:border-blue-400/20 transition-all group text-left"
                        >
                          <div className="w-7 h-7 rounded-md bg-slate-700 flex items-center justify-center shrink-0 group-hover:bg-blue-500/10 transition-colors">
                            <Icon size={12} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
                          </div>
                          <p className="text-[11px] font-medium text-slate-200 group-hover:text-white transition-colors truncate">{cmd.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-2.5 scrollbar-hide">
                {!hasMessages && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-[11px] text-slate-500 text-center leading-relaxed px-4">
                      选择快捷操作或输入问题<br/>
                      <span className="text-slate-600">已同步您的任务和进度数据</span>
                    </p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'ai' && (
                      <div className="w-6 h-6 rounded-md bg-blue-500/15 flex items-center justify-center shrink-0 mr-1.5 mt-1">
                        <MessageSquare size={11} className="text-blue-400" />
                      </div>
                    )}
                    <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'ai'
                        ? 'bg-slate-700/60 text-slate-200 rounded-tl-sm'
                        : 'bg-blue-500 text-white font-medium rounded-tr-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="w-6 h-6 rounded-md bg-blue-500/15 flex items-center justify-center shrink-0 mr-1.5 mt-1">
                      <MessageSquare size={11} className="text-blue-400" />
                    </div>
                    <div className="bg-slate-700/60 text-slate-400 px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-sm">
                      <span className="inline-flex gap-1">
                        <span className="w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-slate-700/50 shrink-0 bg-slate-900/50">
                <div className="relative">
                  <input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="请输入问题..."
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-400/30 focus:border-blue-400/30 transition-all"
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={isLoading || !inputValue.trim()}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-500 hover:bg-blue-400 disabled:bg-blue-500/30 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Send size={14} className="text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StrategicHome;
