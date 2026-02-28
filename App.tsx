
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
import StrategicHome from './components/StrategicHome';
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
