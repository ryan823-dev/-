
import React, { useState } from 'react';
import { NavItem, ClientAction } from '../types';
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
  Zap
} from 'lucide-react';

interface PromotionHubProps {
  actions: ClientAction[];
  onNavigate: (item: NavItem) => void;
  onActionComplete: (id: string) => void;
}

const PromotionHub: React.FC<PromotionHubProps> = ({ actions, onNavigate, onActionComplete }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'todo' | 'receipts'>('todo');
  const [filterType, setFilterType] = useState<string | null>(null);

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

  const handleCTAClick = (action: ClientAction) => {
    // Spec: Deep link string parsing (basic mock logic)
    const route = action.ctaRoute.split('?')[0] as NavItem;
    onNavigate(route);
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
        {[
          { id: 'overview', label: '推进总览', icon: LayoutDashboard },
          { id: 'todo', label: '待办推进', icon: ListTodo, count: stats.total },
          { id: 'receipts', label: '执行回执', icon: History, count: stats.completed },
        ].map((tab) => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-border custom-shadow space-y-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">P0 阻塞事项</p>
              <p className="text-5xl font-bold text-red-500 font-mono">{stats.p0}</p>
              <p className="text-xs text-slate-500 font-medium">当前需立即拍板以防止业务停滞</p>
           </div>
           <div className="bg-white p-8 rounded-[2.5rem] border border-border custom-shadow space-y-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">待处理推进</p>
              <p className="text-5xl font-bold text-navy-900 font-mono">{stats.total}</p>
              <p className="text-xs text-slate-500 font-medium">覆盖资料、内容、授权及方向</p>
           </div>
           <div className="bg-navy-900 p-8 rounded-[2.5rem] text-white custom-shadow space-y-6 relative overflow-hidden">
              <Zap size={48} className="absolute -right-4 -bottom-4 text-gold/10 rotate-12" />
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gold uppercase tracking-[0.2em]">执行官建议</p>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">优先补齐节拍参数，这将激活欧洲市场扫街线索的高质量匹配逻辑。</p>
              </div>
              <button 
                onClick={() => setActiveTab('todo')}
                className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-bold transition-all border border-white/10"
              >
                前往处理 P0
              </button>
           </div>
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
