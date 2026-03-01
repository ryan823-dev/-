
import React, { useState } from 'react';
import { NavItem } from '../types';
import { 
  Home,
  Library, 
  BarChart3, 
  Globe, 
  Radar,
  ClipboardList,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

interface SidebarProps {
  activeItem: NavItem;
  onNavigate: (item: NavItem) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, onNavigate }) => {
  const [collapsed, setCollapsed] = useState(false);

  const navSections = [
    {
      label: '总览',
      items: [
        { id: NavItem.StrategicHome, label: '决策中心', icon: Home },
      ]
    },
    {
      label: '核心引擎',
      items: [
        { id: NavItem.KnowledgeEngine, label: '知识引擎', icon: Library, health: 'amber' },
        { id: NavItem.OutreachRadar, label: '获客雷达', icon: Radar, health: 'emerald' },
        { id: NavItem.MarketingDrive, label: '营销系统', icon: BarChart3, health: 'amber' },
      ]
    },
    {
      label: '运营渠道',
      items: [
        { id: NavItem.SocialPresence, label: '声量枢纽', icon: Globe, health: 'red' },
        { id: NavItem.PromotionHub, label: '推进中台', icon: ClipboardList, health: 'emerald' },
      ]
    }
  ];

  return (
    <aside className={`${collapsed ? 'w-[72px]' : 'w-60'} bg-navy-900 text-slate-400 flex flex-col h-screen sticky top-0 border-r border-navy-800 transition-all duration-300`}>
      {/* Brand Header */}
      <div className={`${collapsed ? 'px-4 py-6' : 'px-5 py-6'} border-b border-navy-800/50`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-gold to-gold/80 rounded-xl flex items-center justify-center text-sm font-black text-navy-900 shadow-lg shadow-gold/20 shrink-0">
            TD
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold text-white tracking-tight truncate">涂豆科技</h1>
              <p className="text-[9px] text-gold/70 font-bold uppercase tracking-widest">DIGITAL HQ</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto scrollbar-hide">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className={sIdx > 0 ? 'mt-5' : ''}>
            {!collapsed && (
              <p className="px-5 mb-2 text-[9px] font-bold text-slate-600 uppercase tracking-[0.15em]">
                {section.label}
              </p>
            )}
            {collapsed && sIdx > 0 && (
              <div className="mx-4 mb-3 border-t border-navy-800/50" />
            )}
            <div className={`${collapsed ? 'px-2' : 'px-3'} space-y-0.5`}>
              {section.items.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeItem === item.id;
                const health = (item as any).health;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'px-3'} py-2.5 text-sm rounded-lg transition-all relative group ${
                      isActive 
                        ? 'bg-gradient-to-r from-navy-800 to-navy-800/50 text-white' 
                        : 'hover:bg-navy-800/40 hover:text-slate-200 text-slate-500'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/4 bottom-1/4 w-[2px] bg-gold rounded-r-full shadow-[0_0_6px_rgba(199,165,106,0.4)]" />
                    )}
                    <div className="relative shrink-0">
                      <IconComponent 
                        size={18} 
                        strokeWidth={1.75} 
                        className={`transition-colors ${isActive ? 'text-gold' : 'text-slate-500 group-hover:text-slate-300'}`} 
                      />
                      {health && !isActive && (
                        <div className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${
                          health === 'red' ? 'bg-red-400' : health === 'amber' ? 'bg-amber-400' : 'bg-emerald-400'
                        }`} />
                      )}
                    </div>
                    {!collapsed && (
                      <span className={`ml-3 text-[13px] font-medium truncate ${isActive ? 'text-white' : ''}`}>
                        {item.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={`${collapsed ? 'px-2' : 'px-4'} py-4 border-t border-navy-800/50`}>
        {!collapsed && (
          <div className="px-2 mb-3">
            <div className="flex items-center gap-2.5 p-2.5 bg-navy-800/30 rounded-lg border border-navy-800/50">
              <div className="w-7 h-7 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-[9px] font-bold text-gold shrink-0">
                TD
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[11px] font-medium text-slate-300 truncate">tdpaintcell.com</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1 h-1 rounded-full bg-emerald-400" />
                  <p className="text-[9px] text-slate-600">运行中</p>
                </div>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-2 text-slate-600 hover:text-slate-400 transition-colors rounded-lg hover:bg-navy-800/30"
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
