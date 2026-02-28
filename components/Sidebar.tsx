
import React from 'react';
import { NavItem } from '../types';
import { 
  MessageSquare, 
  RefreshCw, 
  Library, 
  BarChart3, 
  Globe, 
  Radar 
} from 'lucide-react';

interface SidebarProps {
  activeItem: NavItem;
  onNavigate: (item: NavItem) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, onNavigate }) => {
  const menuItems = [
    { id: NavItem.StrategicHome, label: '出海获客智能体', icon: MessageSquare },
    { id: NavItem.KnowledgeEngine, label: '专业知识引擎', icon: Library },
    { id: NavItem.OutreachRadar, label: '出海获客雷达', icon: Radar },
    { id: NavItem.MarketingDrive, label: '营销驱动系统', icon: BarChart3 },
    { id: NavItem.SocialPresence, label: '出海声量枢纽', icon: Globe },
    { id: NavItem.PromotionHub, label: '出海推进中台', icon: RefreshCw },
  ];

  return (
    <aside className="w-64 bg-navy-900 text-slate-400 flex flex-col h-screen sticky top-0 border-r border-navy-800">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center text-sm font-black text-navy-900 shadow-lg shadow-gold/20 shrink-0">
            TD
          </div>
          <div className="overflow-hidden">
            <h1 className="text-lg font-black text-white tracking-tighter truncate">涂豆科技</h1>
            <p className="text-[9px] text-gold font-bold uppercase tracking-widest opacity-80">数字化出海总部</p>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-2 px-3 py-1.5 bg-navy-800/50 rounded-lg border border-navy-700/50">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">AI 增长引擎已就绪</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-medium rounded-lg transition-all relative ${
                isActive 
                  ? 'bg-navy-800 text-white' 
                  : 'hover:bg-navy-800/40 hover:text-slate-200 text-slate-500'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-[2px] bg-gold rounded-r-full shadow-[0_0_8px_rgba(199,165,106,0.6)]" />
              )}
              <IconComponent 
                size={18} 
                strokeWidth={1.75} 
                className={`transition-colors ${isActive ? 'text-gold' : 'opacity-70 group-hover:opacity-100'}`} 
              />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-navy-800/50">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 p-3 bg-navy-800/40 rounded-xl border border-navy-800/50">
            <div className="w-9 h-9 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-[10px] font-bold text-gold uppercase">
              TD
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-white truncate">tdpaintcell.com</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]" />
                <p className="text-[10px] text-slate-500 font-medium tracking-tighter">系统运行中</p>
              </div>
            </div>
          </div>
          
          <div className="px-2 flex flex-col gap-1">
            <div className="flex items-center gap-2 opacity-30 hover:opacity-100 transition-opacity cursor-default group">
              <div className="w-1 h-1 rounded-full bg-gold" />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] group-hover:text-gold transition-colors">Powered by VertaX Engine</span>
            </div>
            <p className="text-[8px] text-slate-600 font-medium ml-3">出海获客智能体 v0.2.4</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
