
import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Radar, 
  PenTool, 
  Share2, 
  CheckSquare, 
  TrendingUp, 
  TrendingDown,
  Minus,
  RefreshCw
} from 'lucide-react';
import { NavItem } from '../types';

interface ModuleKPI {
  moduleId: NavItem;
  moduleName: string;
  icon: React.ReactNode;
  value: string | number;
  unit: string;
  trend?: { direction: 'up' | 'down' | 'flat'; value: string };
  health: 'green' | 'yellow' | 'red';
}

interface GlobalDashboardProps {
  onNavigate?: (item: NavItem) => void;
}

const GlobalDashboard: React.FC<GlobalDashboardProps> = ({ onNavigate }) => {
  const [moduleKPIs, setModuleKPIs] = useState<ModuleKPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/stats/dashboard');
      if (res.ok) {
        const data = await res.json();
        const kpis: ModuleKPI[] = [
          {
            moduleId: NavItem.KnowledgeEngine,
            moduleName: '知识引擎',
            icon: <Brain size={18} />,
            value: data.products || 2,
            unit: '个卡片',
            trend: { direction: 'up', value: '+8%' },
            health: 'green'
          },
          {
            moduleId: NavItem.OutreachRadar,
            moduleName: '获客雷达',
            icon: <Radar size={18} />,
            value: data.companies?.total || 0,
            unit: '家客户',
            trend: data.companies?.total > 0 
              ? { direction: 'up', value: `+${data.companies.total}` }
              : { direction: 'flat', value: '待启动' },
            health: data.companies?.total > 0 ? 'green' : 'yellow'
          },
          {
            moduleId: NavItem.MarketingDrive,
            moduleName: '内容资产',
            icon: <PenTool size={18} />,
            value: 3,
            unit: '篇内容',
            trend: { direction: 'flat', value: '2待确认' },
            health: 'yellow'
          },
          {
            moduleId: NavItem.SocialPresence,
            moduleName: '社媒声量',
            icon: <Share2 size={18} />,
            value: data.social?.published || 0,
            unit: '篇发布',
            trend: { direction: 'flat', value: '待授权' },
            health: 'red'
          },
          {
            moduleId: NavItem.PromotionHub,
            moduleName: '推进中台',
            icon: <CheckSquare size={18} />,
            value: 4,
            unit: '项待处理',
            trend: { direction: 'down', value: '2项P0' },
            health: 'yellow'
          }
        ];
        setModuleKPIs(kpis);
      } else {
        setModuleKPIs(getDefaultKPIs());
      }
    } catch {
      setModuleKPIs(getDefaultKPIs());
    } finally {
      setIsLoading(false);
      setLastRefresh(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  };

  const getDefaultKPIs = (): ModuleKPI[] => [
    { moduleId: NavItem.KnowledgeEngine, moduleName: '知识引擎', icon: <Brain size={18} />, value: 2, unit: '个卡片', trend: { direction: 'up', value: '+8%' }, health: 'green' },
    { moduleId: NavItem.OutreachRadar, moduleName: '获客雷达', icon: <Radar size={18} />, value: 0, unit: '家客户', trend: { direction: 'flat', value: '待启动' }, health: 'yellow' },
    { moduleId: NavItem.MarketingDrive, moduleName: '内容资产', icon: <PenTool size={18} />, value: 3, unit: '篇内容', trend: { direction: 'flat', value: '2待确认' }, health: 'yellow' },
    { moduleId: NavItem.SocialPresence, moduleName: '社媒声量', icon: <Share2 size={18} />, value: 0, unit: '篇发布', trend: { direction: 'flat', value: '待授权' }, health: 'red' },
    { moduleId: NavItem.PromotionHub, moduleName: '推进中台', icon: <CheckSquare size={18} />, value: 4, unit: '项待处理', trend: { direction: 'down', value: '2项P0' }, health: 'yellow' }
  ];

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (health: 'green' | 'yellow' | 'red') => {
    switch (health) {
      case 'green': return 'bg-emerald-400';
      case 'yellow': return 'bg-amber-400';
      case 'red': return 'bg-red-400';
    }
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'flat') => {
    switch (direction) {
      case 'up': return <TrendingUp size={12} className="text-emerald-500" />;
      case 'down': return <TrendingDown size={12} className="text-red-500" />;
      case 'flat': return <Minus size={12} className="text-slate-400" />;
    }
  };

  // Calculate overall health
  const redCount = moduleKPIs.filter(m => m.health === 'red').length;
  const yellowCount = moduleKPIs.filter(m => m.health === 'yellow').length;
  const overallStatus = redCount > 0 ? '需关注' : yellowCount > 2 ? '待处理' : '正常';
  const overallColor = redCount > 0 ? 'text-red-600 bg-red-50' : yellowCount > 2 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50';

  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-navy-900">全局业务仪表盘</h3>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${overallColor}`}>
            {overallStatus}
          </span>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
        >
          <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          <span>{lastRefresh}</span>
        </button>
      </div>

      {/* KPI Grid - 3 columns */}
      <div className="grid grid-cols-3 gap-4">
        {moduleKPIs.map(kpi => (
          <button
            key={kpi.moduleId}
            onClick={() => onNavigate?.(kpi.moduleId)}
            className="p-4 bg-slate-50/80 hover:bg-slate-100 rounded-xl border border-slate-100 hover:border-gold/30 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-600 group-hover:text-gold transition-colors shadow-sm">
                  {kpi.icon}
                </div>
                <span className="text-xs font-medium text-slate-600">{kpi.moduleName}</span>
              </div>
              <div className={`w-2 h-2 rounded-full ${getHealthColor(kpi.health)}`} />
            </div>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-navy-900">{kpi.value}</span>
                <span className="text-[11px] text-slate-400">{kpi.unit}</span>
              </div>
              {kpi.trend && (
                <div className="flex items-center gap-1">
                  {getTrendIcon(kpi.trend.direction)}
                  <span className="text-[10px] text-slate-500">{kpi.trend.value}</span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default GlobalDashboard;
