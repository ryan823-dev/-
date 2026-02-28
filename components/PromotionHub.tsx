
import React, { useState } from 'react';
import { NavItem, ClientAction, ContentAsset } from '../types';
import { 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  LayoutDashboard, 
  ListTodo, 
  History, 
  ArrowRightCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Zap,
  FileSearch,
  BookOpen,
  MessageSquareQuote,
  ThumbsUp,
  RotateCcw,
  Send,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

type TabId = 'overview' | 'review' | 'todo' | 'receipts';

type ReviewVerdict = 'approve' | 'revise' | null;

interface ReviewState {
  assetId: string;
  verdict: ReviewVerdict;
  comment: string;
  corrections: { field: string; original: string; corrected: string }[];
  expanded: boolean;
}

interface PromotionHubProps {
  actions: ClientAction[];
  assets: ContentAsset[];
  onNavigate: (item: NavItem) => void;
  onActionComplete: (id: string) => void;
  onAssetApprove: (id: string, comment: string) => void;
  onAssetRevise: (id: string, comment: string) => void;
}

const PromotionHub: React.FC<PromotionHubProps> = ({ actions, assets, onNavigate, onActionComplete, onAssetApprove, onAssetRevise }) => {
  const [activeTab, setActiveTab] = useState<TabId>('review');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [reviewStates, setReviewStates] = useState<Record<string, ReviewState>>({});

  // Assets pending review (待确认 or 草稿 from Marketing Drive, Outreach, etc.)
  const reviewableAssets = assets.filter(a => a.status === '待确认' || a.status === '草稿');
  const approvedAssets = assets.filter(a => a.status === '待发布' || a.status === '已发布' || a.status === '已修改');

  const pendingActions = actions.filter(a => a.status !== '已完成').sort((a, b) => {
    const priorityMap = { P0: 0, P1: 1, P2: 2 };
    return priorityMap[a.priority] - priorityMap[b.priority];
  });

  const completedActions = actions.filter(a => a.status === '已完成').sort((a, b) => 
    new Date(b.completedAt || '').getTime() - new Date(a.completedAt || '').getTime()
  );

  const stats = {
    p0: pendingActions.filter(a => a.priority === 'P0').length,
    total: pendingActions.length,
    completed: completedActions.length,
  };

  const types = Array.from(new Set(pendingActions.map(a => a.type)));

  // Valid NavItem values for safe navigation
  const validNavItems = Object.values(NavItem);

  const handleCTAClick = (action: ClientAction) => {
    // Spec: Deep link string parsing with validation
    const routePath = action.ctaRoute.split('?')[0];
    if (validNavItems.includes(routePath as NavItem)) {
      onNavigate(routePath as NavItem);
    } else {
      // Default to PromotionHub if route is invalid
      console.warn(`Invalid route: ${routePath}, defaulting to PromotionHub`);
      onNavigate(NavItem.PromotionHub);
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'P0': return 'text-red-500 border-red-200 bg-red-50';
      case 'P1': return 'text-amber-500 border-amber-200 bg-amber-50';
      default: return 'text-blue-500 border-blue-200 bg-blue-50';
    }
  };

  const getModuleColor = (m: string) => {
    switch (m) {
      case '专业知识引擎': return 'bg-purple-100 text-purple-700';
      case '营销驱动系统': return 'bg-emerald-100 text-emerald-700';
      case '海外声量中台': return 'bg-sky-100 text-sky-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getReviewState = (assetId: string): ReviewState => {
    return reviewStates[assetId] || { assetId, verdict: null, comment: '', corrections: [], expanded: false };
  };

  const updateReviewState = (assetId: string, patch: Partial<ReviewState>) => {
    setReviewStates(prev => ({
      ...prev,
      [assetId]: { ...getReviewState(assetId), ...patch }
    }));
  };

  const handleSubmitReview = (asset: ContentAsset) => {
    const state = getReviewState(asset.id);
    if (state.verdict === 'approve') {
      onAssetApprove(asset.id, state.comment);
    } else if (state.verdict === 'revise') {
      onAssetRevise(asset.id, state.comment);
    }
    // Clear review state after submit
    setReviewStates(prev => {
      const next = { ...prev };
      delete next[asset.id];
      return next;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case '待确认': return 'text-amber-700 bg-amber-50 border-amber-200';
      case '草稿': return 'text-slate-600 bg-slate-50 border-slate-200';
      case '已修改': return 'text-blue-700 bg-blue-50 border-blue-200';
      case '待发布': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case '已发布': return 'text-emerald-800 bg-emerald-100 border-emerald-300';
      default: return 'text-slate-500 bg-slate-50 border-slate-200';
    }
  };

  const tabs: { id: TabId; label: string; icon: React.FC<{ size?: number; className?: string }>; count?: number }[] = [
    { id: 'overview', label: '推进总览', icon: LayoutDashboard },
    { id: 'review', label: '内容审核', icon: FileSearch, count: reviewableAssets.length },
    { id: 'todo', label: '待办推进', icon: ListTodo, count: stats.total },
    { id: 'receipts', label: '执行回执', icon: History, count: stats.completed },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-navy-900 tracking-tight">出海推进中台</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">甲方协作与拍板入口：汇总推进事项，加速出海进程。</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-5 py-3 rounded-2xl border border-border shadow-sm flex items-center gap-4 hover:border-gold/30 transition-colors">
             <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} className="text-gold" />
             </div>
             <div className="flex flex-col justify-center">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">推进权限</p>
               <p className="text-xs font-bold text-navy-900 mt-0.5">甲方负责人 (Gold Tier)</p>
             </div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-border gap-10">
        {tabs.map((tab) => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${
              activeTab === tab.id ? 'text-navy-900' : 'text-slate-400 hover:text-navy-800'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === tab.id ? 'bg-gold text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gold rounded-full" />}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-border custom-shadow space-y-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">P0 阻塞事项</p>
              <p className="text-5xl font-bold text-red-500 font-mono">{stats.p0}</p>
              <p className="text-xs text-slate-500 font-medium">需立即拍板以防业务停滞</p>
           </div>
           <div className="bg-white p-8 rounded-[2.5rem] border border-border custom-shadow space-y-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">待审核内容</p>
              <p className="text-5xl font-bold text-amber-500 font-mono">{reviewableAssets.length}</p>
              <p className="text-xs text-slate-500 font-medium">AI 生成内容等待人工确认</p>
           </div>
           <div className="bg-white p-8 rounded-[2.5rem] border border-border custom-shadow space-y-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">待处理推进</p>
              <p className="text-5xl font-bold text-navy-900 font-mono">{stats.total}</p>
              <p className="text-xs text-slate-500 font-medium">资料、授权及方向决策</p>
           </div>
           <div className="bg-navy-900 p-8 rounded-[2.5rem] text-white custom-shadow space-y-6 relative overflow-hidden">
              <Zap size={48} className="absolute -right-4 -bottom-4 text-gold/10 rotate-12" />
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gold uppercase tracking-[0.2em]">执行官建议</p>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {reviewableAssets.length > 0
                    ? `${reviewableAssets.length} 份内容待审核，确认后即可进入发布流程。`
                    : '优先补齐节拍参数，这将激活高质量匹配逻辑。'}
                </p>
              </div>
              <button 
                onClick={() => setActiveTab(reviewableAssets.length > 0 ? 'review' : 'todo')}
                className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-bold transition-all border border-white/10"
              >
                {reviewableAssets.length > 0 ? '前往审核内容' : '前往处理 P0'}
              </button>
           </div>
        </div>
      )}

      {/* ==================== 内容审核 Tab ==================== */}
      {activeTab === 'review' && (
        <div className="space-y-6">
          {reviewableAssets.length > 0 ? (
            <div className="space-y-6">
              {/* Review queue summary bar */}
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={18} className="text-amber-600" />
                  <p className="text-sm font-bold text-amber-800">
                    {reviewableAssets.length} 份 AI 生成内容等待您的审核与确认
                  </p>
                </div>
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                  确认后进入发布流程 | 修改意见将反馈至 AI 引擎
                </p>
              </div>

              {/* Reviewable asset cards */}
              {reviewableAssets.map((asset) => {
                const rs = getReviewState(asset.id);
                const isExpanded = rs.expanded;

                return (
                  <div key={asset.id} className="bg-white rounded-[2.5rem] border border-border custom-shadow overflow-hidden hover:border-gold/30 transition-all">
                    {/* Card header - always visible */}
                    <div className="px-8 py-6 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`text-[10px] font-bold px-3 py-1 rounded-lg border uppercase tracking-widest ${getStatusBadge(asset.status)}`}>
                            {asset.status}
                          </span>
                          <span className="text-[10px] font-bold px-3 py-1 rounded-lg bg-emerald-100 text-emerald-700 uppercase tracking-widest">
                            营销驱动系统
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 uppercase">
                            {asset.category}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-navy-900">{asset.title}</h4>
                        <div className="flex flex-wrap gap-2">
                          {asset.keywords.map(kw => (
                            <span key={kw} className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded italic">#{kw}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] text-slate-400 font-mono">{asset.lastModified}</span>
                        <button
                          onClick={() => updateReviewState(asset.id, { expanded: !isExpanded })}
                          className="p-3 rounded-2xl border border-border hover:bg-ivory transition-all"
                        >
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded content - inline review */}
                    {isExpanded && (
                      <div className="border-t border-border animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* Content body */}
                        <div className="px-8 py-6 bg-ivory/30">
                          <div className="flex items-center gap-2 mb-4">
                            <BookOpen size={14} className="text-gold" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI 生成内容正文</p>
                          </div>
                          <div className="bg-white border border-border rounded-2xl p-6 max-h-[400px] overflow-y-auto scrollbar-hide">
                            <div className="prose prose-sm max-w-none text-navy-900 leading-relaxed font-medium whitespace-pre-wrap">
                              {asset.draftBody ? (
                                asset.draftBody.split('\n\n').map((p, i) => {
                                  const hasPlaceholder = p.includes('【待补齐');
                                  return (
                                    <p key={i} className={hasPlaceholder ? "bg-amber-50 p-3 rounded-xl border border-amber-100 mb-4" : "mb-4"}>
                                      {p.split(/(【待补齐：.*?】)/).map((part, idx) => 
                                        part.startsWith('【待补齐') 
                                          ? <span key={idx} className="text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-100">{part}</span>
                                          : part
                                      )}
                                    </p>
                                  );
                                })
                              ) : (
                                <p className="text-slate-400 italic">内容正文为空</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Generation trace */}
                        {asset.generationTrace && asset.generationTrace.length > 0 && (
                          <div className="px-8 py-4 bg-ivory/20 border-t border-border/50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <BookOpen size={12} /> 知识引用追踪
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {asset.generationTrace.flatMap((t: any) => t.refs || []).map((r: any, idx: number) => (
                                <span key={idx} className="text-[10px] font-bold text-navy-900 bg-white border border-border px-3 py-1.5 rounded-lg shadow-sm">
                                  {r.fieldLabel} <span className="text-slate-400 mx-1">&larr;</span> <span className="text-gold">{r.cardTitle}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Missing info warnings */}
                        {asset.missingInfoNeeded && asset.missingInfoNeeded.length > 0 && (
                          <div className="px-8 py-4 bg-red-50/50 border-t border-red-100">
                            <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                              <AlertTriangle size={12} /> 内容缺口 ({asset.missingInfoNeeded.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {asset.missingInfoNeeded.map(mi => (
                                <span key={mi.fieldKey} className="text-[10px] font-bold text-red-700 bg-white border border-red-200 px-3 py-1.5 rounded-lg">
                                  缺失：{mi.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Review action panel */}
                        <div className="px-8 py-6 bg-slate-50 border-t border-border space-y-5">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquareQuote size={14} className="text-gold" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">甲方审核意见</p>
                          </div>

                          {/* Verdict buttons */}
                          <div className="flex gap-3">
                            <button
                              onClick={() => updateReviewState(asset.id, { verdict: rs.verdict === 'approve' ? null : 'approve' })}
                              className={`flex-1 py-3 rounded-2xl text-sm font-bold border transition-all flex items-center justify-center gap-2 ${
                                rs.verdict === 'approve'
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200'
                                  : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                              }`}
                            >
                              <ThumbsUp size={16} /> 确认通过，进入发布
                            </button>
                            <button
                              onClick={() => updateReviewState(asset.id, { verdict: rs.verdict === 'revise' ? null : 'revise' })}
                              className={`flex-1 py-3 rounded-2xl text-sm font-bold border transition-all flex items-center justify-center gap-2 ${
                                rs.verdict === 'revise'
                                  ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-200'
                                  : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
                              }`}
                            >
                              <RotateCcw size={16} /> 需修改，反馈 AI
                            </button>
                          </div>

                          {/* Comment area (always visible when a verdict is selected) */}
                          {rs.verdict && (
                            <div className="space-y-3 animate-in fade-in duration-200">
                              <textarea
                                value={rs.comment}
                                onChange={(e) => updateReviewState(asset.id, { comment: e.target.value })}
                                placeholder={rs.verdict === 'approve'
                                  ? '可选：补充确认备注，如"整体准确，第三段可增加案例"...'
                                  : '请描述需要修改的内容，AI 将据此重新生成。如"术语统一为喷涂房"、"补充 ROI 数据"...'
                                }
                                className="w-full bg-white border border-border rounded-2xl px-5 py-4 text-sm font-medium outline-none min-h-[100px] resize-none focus:ring-2 focus:ring-gold/30 transition-all"
                              />
                              <div className="flex justify-end">
                                <button
                                  onClick={() => handleSubmitReview(asset)}
                                  className="bg-navy-900 text-white px-8 py-3 rounded-2xl text-sm font-bold hover:bg-navy-800 transition-all shadow-xl flex items-center gap-2 active:scale-95"
                                >
                                  <Send size={16} className="text-gold" />
                                  {rs.verdict === 'approve' ? '确认定稿' : '提交修改意见'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Already approved assets section */}
              {approvedAssets.length > 0 && (
                <div className="pt-6 space-y-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">已审核通过</p>
                  {approvedAssets.map(asset => (
                    <div key={asset.id} className="bg-white rounded-2xl border border-border p-5 flex items-center justify-between opacity-70 hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                          <CheckCircle2 size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-navy-900">{asset.title}</h4>
                          <p className="text-[10px] text-slate-500">{asset.category} | {asset.lastModified}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${getStatusBadge(asset.status)}`}>
                        {asset.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-ivory-surface p-20 rounded-[3rem] border border-dashed border-border text-center">
              <FileSearch size={48} className="text-emerald-400/30 mx-auto mb-4" />
              <p className="font-bold text-navy-900">暂无待审核内容</p>
              <p className="text-sm text-slate-500 mt-2">在营销驱动系统中生成的内容将自动进入此审核队列。</p>
              <button
                onClick={() => onNavigate(NavItem.MarketingDrive)}
                className="mt-6 bg-navy-900 text-white px-8 py-3 rounded-2xl text-xs font-bold hover:bg-navy-800 transition-all shadow-xl inline-flex items-center gap-2"
              >
                前往营销驱动生成内容 <ArrowRightCircle size={16} className="text-gold" />
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'todo' && (
        <div className="space-y-6">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            <button 
              onClick={() => setFilterType(null)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border whitespace-nowrap transition-all ${
                !filterType ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-slate-500 border-border'
              }`}
            >
              全部类型
            </button>
            {types.map(t => (
              <button 
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border whitespace-nowrap transition-all ${
                  filterType === t ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-slate-500 border-border'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-4">
             {pendingActions.filter(a => !filterType || a.type === filterType).map((action) => (
               <div key={action.id} className={`bg-white rounded-[2.5rem] border p-8 custom-shadow hover:border-gold/30 transition-all ${
                 action.priority === 'P0' ? 'border-l-[6px] border-l-red-500' : 'border-border'
               }`}>
                 <div className="flex flex-col xl:flex-row gap-8 items-start xl:items-center">
                   <div className="flex-1 space-y-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-lg border uppercase tracking-widest ${getPriorityColor(action.priority)}`}>
                          {action.priority}
                        </span>
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-widest ${getModuleColor(action.sourceModule)}`}>
                          {action.sourceModule}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                          {action.type}
                        </span>
                        <h4 className="text-lg font-bold text-navy-900 flex-1 min-w-[300px]">{action.title}</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-ivory/30 p-5 rounded-2xl border border-border/40">
                         <div className="space-y-1.5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                              <AlertCircle size={12} className="text-gold" /> 原因与阻塞
                            </p>
                            <p className="text-xs text-navy-900 font-medium leading-relaxed">{action.reason}</p>
                         </div>
                         <div className="space-y-1.5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                              <Zap size={12} className="text-gold" /> 预期影响
                            </p>
                            <p className="text-xs text-navy-900 font-bold leading-relaxed">{action.impact}</p>
                         </div>
                      </div>

                      {action.evidence && (
                        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2 italic">
                          <History size={10} /> 状态依据：{action.evidence}
                        </p>
                      )}
                   </div>

                   <div className="shrink-0 w-full xl:w-auto space-y-3">
                      <button 
                        onClick={() => handleCTAClick(action)}
                        className="w-full xl:min-w-[180px] bg-navy-900 text-white px-8 py-4 rounded-2xl text-sm font-bold hover:bg-navy-800 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 group"
                      >
                        {action.ctaLabel}
                        <ArrowRightCircle size={18} className="text-gold group-hover:translate-x-1 transition-transform" />
                      </button>
                      <button 
                        onClick={() => onActionComplete(action.id)}
                        className="w-full text-[11px] font-bold text-slate-400 hover:text-navy-900 transition-colors py-2 flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 size={12} /> 标记为已由其它方式完成
                      </button>
                   </div>
                 </div>
               </div>
             ))}
             {pendingActions.length === 0 && (
               <div className="bg-ivory-surface p-20 rounded-[3rem] border border-dashed border-border text-center">
                  <CheckCircle2 size={48} className="text-emerald-400/30 mx-auto mb-4" />
                  <p className="font-bold text-navy-900">恭喜！所有待处理事项已清空</p>
                  <p className="text-sm text-slate-500 mt-2">推进中台处于完全就绪状态，系统正全力执行出海任务。</p>
               </div>
             )}
          </div>
        </div>
      )}

      {activeTab === 'receipts' && (
        <div className="space-y-4">
          {completedActions.map(action => (
            <div key={action.id} className="bg-white rounded-[2rem] border border-border p-6 flex flex-col md:flex-row justify-between items-center gap-6 opacity-80 hover:opacity-100 transition-opacity">
               <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                    <CheckCircle2 size={24} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{action.sourceModule}</span>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-tighter">已执行</span>
                    </div>
                    <h4 className="text-sm font-bold text-navy-900">{action.title}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">采纳回执：{action.resultSummary}</p>
                  </div>
               </div>
               <div className="text-right shrink-0">
                  <p className="text-[10px] text-slate-400 font-mono font-bold uppercase flex items-center gap-2 justify-end">
                    <Clock size={12} /> {action.completedAt}
                  </p>
                  <button 
                    onClick={() => handleCTAClick(action)}
                    className="mt-2 text-xs font-bold text-navy-900 hover:text-gold flex items-center gap-1.5 transition-colors ml-auto"
                  >
                    查看详情记录 <ExternalLink size={12} />
                  </button>
               </div>
            </div>
          ))}
          {completedActions.length === 0 && (
             <div className="text-center p-20 text-slate-400">
               <p className="text-sm font-medium">暂无动作执行回执</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PromotionHub;
