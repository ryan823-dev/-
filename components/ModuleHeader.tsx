
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ModuleHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  children?: React.ReactNode; // right-side actions/stats
}

const ModuleHeader: React.FC<ModuleHeaderProps> = ({ icon: Icon, title, subtitle, children }) => {
  return (
    <div className="flex justify-between items-center pb-6 mb-6 border-b border-border">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-navy-900 to-navy-800 flex items-center justify-center shadow-lg shadow-navy-900/10">
          <Icon size={20} className="text-gold" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-navy-900 tracking-tight">{title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children && (
        <div className="flex items-center gap-3">
          {children}
        </div>
      )}
    </div>
  );
};

export default ModuleHeader;
