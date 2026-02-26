import React, { useState, useEffect } from 'react';
import { Company } from '../types';
import { Search, Filter, Download, ExternalLink, ChevronRight, Star, Globe, Building2 } from 'lucide-react';

interface LeadPoolProps {
  onSelectCompany: (id: string) => void;
}

const LeadPool: React.FC<LeadPoolProps> = ({ onSelectCompany }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/companies').then(res => res.json()).then(setCompanies);
  }, []);

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">线索公海池 (Lead Pool)</h2>
          <p className="text-slate-500 text-sm mt-1">管理所有已发现的潜在客户实体，查看背调深度与评分。</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 rounded-xl border border-border bg-white text-sm font-bold text-navy-900 hover:bg-ivory transition-all flex items-center gap-2">
            <Download size={16} /> 导出 CSV
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="搜索公司名称、行业或国家..."
            className="w-full bg-white border border-border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-navy-900 outline-none focus:ring-2 focus:ring-gold/20 transition-all"
          />
        </div>
        <button className="px-6 py-4 bg-white border border-border rounded-2xl text-sm font-bold text-navy-900 flex items-center gap-2 hover:bg-ivory transition-all">
          <Filter size={18} /> 高级筛选
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-border custom-shadow overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-ivory/30 border-b border-border">
            <tr>
              <th className="px-8 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px]">公司实体</th>
              <th className="px-8 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px]">行业 / 国家</th>
              <th className="px-8 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px]">处理进度</th>
              <th className="px-8 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px] text-center">AI 优先级 (Tier)</th>
              <th className="px-8 py-5 font-bold text-slate-400 uppercase tracking-widest text-[10px] text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {filteredCompanies.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-medium">未找到匹配的线索。</td>
              </tr>
            ) : (
              filteredCompanies.map(company => (
                <tr key={company.id} className="hover:bg-ivory/20 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-gold/10 group-hover:text-gold transition-colors">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-navy-900">{company.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{company.source}</span>
                          {company.website && <ExternalLink size={10} className="text-slate-300" />}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs font-bold text-navy-900">{company.industry}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1 flex items-center gap-1">
                      <Globe size={10} /> {company.country}
                    </p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      company.status === 'outreached' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      company.status === 'failed' ? 'bg-red-50 text-red-600 border border-red-100' :
                      'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}>
                      {company.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex flex-col items-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                        company.score?.tier?.includes('Tier A') ? 'bg-red-50 text-red-600 border-red-100' :
                        company.score?.tier?.includes('Tier B') ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        company.score?.tier?.includes('Tier C') ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        'bg-slate-50 text-slate-400 border-slate-100'
                      }`}>
                        {company.score?.tier?.split(' ')[1] || 'D'}
                      </span>
                      <p className="text-[9px] text-slate-400 font-bold mt-1.5 uppercase tracking-tighter">
                        {company.score?.tier?.split('(')[1]?.replace(')', '') || 'Cold Lead'}
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => onSelectCompany(company.id)}
                      className="p-2 rounded-xl hover:bg-gold/10 text-slate-400 hover:text-gold transition-all"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadPool;
