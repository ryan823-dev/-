
import React, { useState } from 'react';
import ProductModeling from './ProductModeling';
import LeadRuns from './LeadRuns';
import LeadPool from './LeadPool';
import { Radar, Target, Play, Database } from 'lucide-react';

type TabId = 'icp' | 'runs' | 'pool';

interface AIProspectingProps {
  onSelectCompany: (id: string) => void;
}

const AIProspecting: React.FC<AIProspectingProps> = ({ onSelectCompany }) => {
  const [activeTab, setActiveTab] = useState<TabId>('icp');

  const tabs: { id: TabId; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
    { id: 'icp', label: '目标画像 (ICP)', icon: Target },
    { id: 'runs', label: '获客任务中心', icon: Play },
    { id: 'pool', label: '线索公海池', icon: Database },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">出海获客雷达</h2>
          <p className="text-slate-500 text-sm">全自动海外市场扫描、背景穿透与精准建联。</p>
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
            <tab.icon size={16} className={activeTab === tab.id ? 'text-gold' : ''} />
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gold rounded-full" />}
          </button>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {activeTab === 'icp' && <ProductModeling />}
        {activeTab === 'runs' && <LeadRuns onViewPool={() => setActiveTab('pool')} />}
        {activeTab === 'pool' && <LeadPool onSelectCompany={onSelectCompany} />}
      </div>
    </div>
  );
};

export default AIProspecting;
