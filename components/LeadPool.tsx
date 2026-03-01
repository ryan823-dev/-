import React, { useState, useEffect } from 'react';
import { Company } from '../types';
import { Search, Filter, Download, ExternalLink, ChevronRight, ChevronDown, ChevronUp, Globe, Building2, FileText, Mail, Linkedin, Users, Zap, AlertTriangle, TrendingUp, X, ShieldCheck, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

interface LeadPoolProps {
  onSelectCompany: (id: string) => void;
}

type FilterTier = 'all' | 'A' | 'B' | 'C' | 'D';
type FilterStatus = 'all' | 'discovered' | 'scored' | 'outreached';
type FilterQualification = 'all' | 'qualified' | 'maybe' | 'disqualified';

const STATUS_LABELS: Record<string, string> = {
  discovered: '已发现',
  researching: '穿透中',
  researched: '已穿透',
  scored: '已评分',
  outreached: '已建联',
  failed: '失败'
};

const LeadPool: React.FC<LeadPoolProps> = ({ onSelectCompany }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<FilterTier>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterQualification, setFilterQualification] = useState<FilterQualification>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetch('/api/companies').then(res => res.json()).then(setCompanies);
  }, []);

  // Refresh periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/companies').then(res => res.json()).then(setCompanies);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const filteredCompanies = companies.filter(c => {
    const matchSearch = !searchTerm || 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.country?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchTier = filterTier === 'all' || c.score?.tier?.includes(`Tier ${filterTier}`);
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchQualification = filterQualification === 'all' || c.websiteAnalysis?.status === filterQualification;
    
    return matchSearch && matchTier && matchStatus && matchQualification;
  });

  // Sort: Tier A first, then B, C, D; within same tier sort by score desc
  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    const tierOrder = (tier?: string) => {
      if (tier?.includes('Tier A')) return 0;
      if (tier?.includes('Tier B')) return 1;
      if (tier?.includes('Tier C')) return 2;
      return 3;
    };
    const diff = tierOrder(a.score?.tier) - tierOrder(b.score?.tier);
    if (diff !== 0) return diff;
    return (b.score?.total || 0) - (a.score?.total || 0);
  });

  const handleExpandCompany = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetailData(null);
      return;
    }
    setExpandedId(id);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/companies/${id}`);
      const data = await res.json();
      setDetailData(data);
    } catch {
      setDetailData(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const tierCounts = {
    A: companies.filter(c => c.score?.tier?.includes('Tier A')).length,
    B: companies.filter(c => c.score?.tier?.includes('Tier B')).length,
    C: companies.filter(c => c.score?.tier?.includes('Tier C')).length,
    D: companies.filter(c => !c.score?.tier || c.score?.tier?.includes('Tier D')).length,
  };

  const handleExportCSV = () => {
    const headers = ['Company', 'Industry', 'Country', 'Tier', 'Score', 'Qualification', 'RelevanceScore', 'Status', 'Contacts', 'Website'];
    const rows = sortedCompanies.map(c => [
      c.name,
      c.industry || '',
      c.country || '',
      c.score?.tier?.split(' ')[1] || 'D',
      c.score?.total?.toString() || '0',
      c.websiteAnalysis?.status || '',
      c.websiteAnalysis?.relevanceScore?.toString() || '',
      c.status,
      (c as any).contacts?.length?.toString() || '0',
      c.website || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">线索公海池</h2>
          <p className="text-slate-500 text-sm mt-1">
            管理所有已发现的潜在客户，查看穿透分析与联系人信息。
            <span className="ml-2 font-bold text-navy-900">{companies.length}</span> 家公司
          </p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="px-5 py-2.5 rounded-xl border border-border bg-white text-sm font-bold text-navy-900 hover:bg-ivory transition-all flex items-center gap-2"
        >
          <Download size={16} /> 导出 CSV
        </button>
      </div>

      {/* Tier Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {(['A', 'B', 'C', 'D'] as const).map(tier => {
          const colors = {
            A: { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-600', label: 'Critical Pain' },
            B: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600', label: 'Active Change' },
            C: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600', label: 'High Potential' },
            D: { bg: 'bg-slate-50', border: 'border-slate-100', text: 'text-slate-400', label: 'Cold Lead' },
          };
          const c = colors[tier];
          const isActive = filterTier === tier;
          return (
            <button
              key={tier}
              onClick={() => setFilterTier(filterTier === tier ? 'all' : tier)}
              className={`p-4 rounded-xl border transition-all text-center ${
                isActive ? `${c.bg} ${c.border} ring-2 ring-offset-1 ring-${tier === 'A' ? 'red' : tier === 'B' ? 'amber' : tier === 'C' ? 'blue' : 'slate'}-200` : 
                'bg-white border-border hover:border-gold/30'
              }`}
            >
              <p className={`text-3xl font-black ${c.text}`}>{tierCounts[tier]}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Tier {tier}</p>
              <p className="text-[8px] text-slate-300 mt-0.5">{c.label}</p>
            </button>
          );
        })}
      </div>

      {/* Search and Filter */}
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
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as FilterStatus)}
          className="px-6 py-4 bg-white border border-border rounded-2xl text-sm font-bold text-navy-900 outline-none"
        >
          <option value="all">全部状态</option>
          <option value="discovered">已发现</option>
          <option value="scored">已评分</option>
          <option value="outreached">已建联</option>
        </select>
        <select
          value={filterQualification}
          onChange={e => setFilterQualification(e.target.value as FilterQualification)}
          className="px-6 py-4 bg-white border border-border rounded-2xl text-sm font-bold text-navy-900 outline-none"
        >
          <option value="all">全部验证</option>
          <option value="qualified">已认证</option>
          <option value="maybe">待确认</option>
          <option value="disqualified">已排除</option>
        </select>
        {(filterTier !== 'all' || filterStatus !== 'all' || filterQualification !== 'all' || searchTerm) && (
          <button 
            onClick={() => { setFilterTier('all'); setFilterStatus('all'); setFilterQualification('all'); setSearchTerm(''); }}
            className="px-4 py-4 text-xs font-bold text-slate-400 hover:text-navy-900 transition-all flex items-center gap-1"
          >
            <X size={14} /> 清除筛选
          </button>
        )}
      </div>

      {/* Company List */}
      <div className="space-y-3">
        {sortedCompanies.length === 0 ? (
          <div className="p-16 text-center bg-ivory/30 border border-dashed border-border rounded-2xl">
            <Building2 size={32} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-400 font-medium">
              {companies.length === 0 ? '暂无线索数据，请先创建获客任务' : '未找到匹配的线索'}
            </p>
          </div>
        ) : (
          sortedCompanies.map(company => {
            const isExpanded = expandedId === company.id;
            const tierColor = company.score?.tier?.includes('Tier A') ? 'border-l-red-500' :
              company.score?.tier?.includes('Tier B') ? 'border-l-amber-500' :
              company.score?.tier?.includes('Tier C') ? 'border-l-blue-500' : 'border-l-slate-200';
            
            return (
              <div key={company.id} className={`bg-white rounded-2xl border border-border custom-shadow overflow-hidden transition-all border-l-4 ${tierColor}`}>
                {/* Main Row */}
                <div 
                  className="flex flex-col lg:flex-row gap-4 items-start lg:items-center p-6 cursor-pointer hover:bg-ivory/20 transition-colors"
                  onClick={() => handleExpandCompany(company.id)}
                >
                  {/* Company Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                      <Building2 size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-navy-900 truncate">{company.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {company.source?.toLowerCase().includes('tender') && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-[9px] font-bold uppercase border border-purple-100">
                            <FileText size={10} /> TENDER
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">{company.source}</span>
                      </div>
                    </div>
                  </div>

                  {/* Industry / Country */}
                  <div className="w-32 shrink-0">
                    <p className="text-xs font-bold text-navy-900">{company.industry}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1 flex items-center gap-1">
                      <Globe size={10} /> {company.country}
                    </p>
                  </div>

                  {/* Website Qualification */}
                  <div className="w-24 shrink-0 text-center">
                    {company.websiteAnalysis && company.websiteAnalysis.status !== 'pending' ? (
                      <div>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold uppercase border ${
                          company.websiteAnalysis.status === 'qualified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          company.websiteAnalysis.status === 'maybe' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          company.websiteAnalysis.status === 'disqualified' ? 'bg-red-50 text-red-500 border-red-100' :
                          'bg-slate-50 text-slate-400 border-slate-100'
                        }`}>
                          {company.websiteAnalysis.status === 'qualified' ? <CheckCircle2 size={10} /> :
                           company.websiteAnalysis.status === 'maybe' ? <HelpCircle size={10} /> :
                           <AlertCircle size={10} />}
                          {company.websiteAnalysis.status === 'qualified' ? 'Q' :
                           company.websiteAnalysis.status === 'maybe' ? 'M' :
                           company.websiteAnalysis.status === 'disqualified' ? 'DQ' :
                           company.websiteAnalysis.status.charAt(0).toUpperCase()}
                        </span>
                        <p className={`text-[9px] font-bold mt-1 ${
                          company.websiteAnalysis.relevanceScore >= 70 ? 'text-emerald-600' :
                          company.websiteAnalysis.relevanceScore >= 40 ? 'text-amber-600' :
                          'text-red-500'
                        }`}>
                          {company.websiteAnalysis.relevanceScore}分
                        </p>
                      </div>
                    ) : (
                      <span className="text-[9px] text-slate-300">--</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="w-24 shrink-0">
                    <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      company.status === 'outreached' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      company.status === 'scored' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                      company.status === 'failed' ? 'bg-red-50 text-red-600 border border-red-100' :
                      'bg-slate-50 text-slate-500 border border-slate-100'
                    }`}>
                      {STATUS_LABELS[company.status] || company.status}
                    </span>
                  </div>

                  {/* Tier */}
                  <div className="w-20 shrink-0 text-center">
                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                      company.score?.tier?.includes('Tier A') ? 'bg-red-50 text-red-600 border-red-100' :
                      company.score?.tier?.includes('Tier B') ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      company.score?.tier?.includes('Tier C') ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      'bg-slate-50 text-slate-400 border-slate-100'
                    }`}>
                      {company.score?.tier?.includes('Tier') ? company.score.tier.split(' ')[1] : 'D'}
                    </span>
                    <p className="text-[9px] text-slate-400 font-bold mt-1">
                      {company.score?.total ? `${company.score.total}分` : '--'}
                    </p>
                  </div>

                  {/* Expand arrow */}
                  <div className="w-8 shrink-0 text-right">
                    {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Detail Panel */}
                {isExpanded && (
                  <div className="border-t border-border bg-ivory/20 p-6 animate-in slide-in-from-top-2 duration-200">
                    {loadingDetail ? (
                      <div className="text-center py-8 text-slate-400 text-sm">Loading...</div>
                    ) : detailData ? (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Column 1: Company Info + Website Analysis */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">公司信息</h4>
                          <div className="space-y-2 text-sm">
                            {detailData.website && (
                              <div className="flex items-center gap-2">
                                <ExternalLink size={14} className="text-slate-400 shrink-0" />
                                <a href={detailData.website} target="_blank" rel="noopener" className="text-blue-600 hover:underline truncate text-xs">{detailData.website}</a>
                              </div>
                            )}
                            {detailData.notes && (
                              <p className="text-xs text-slate-500 bg-white rounded-lg p-3 border border-border">{detailData.notes}</p>
                            )}
                            {detailData.tenderMetadata && (
                              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                                <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider mb-2">招标信息</p>
                                <p className="text-xs font-bold text-purple-900">{detailData.tenderMetadata.tenderTitle}</p>
                                <div className="mt-2 space-y-1 text-[11px] text-purple-600">
                                  <p>平台：{detailData.tenderMetadata.platform}</p>
                                  {detailData.tenderMetadata.deadline && <p>截止：{detailData.tenderMetadata.deadline}</p>}
                                  {detailData.tenderMetadata.estimatedValue && <p>预算：{detailData.tenderMetadata.estimatedValue}</p>}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Website Analysis Summary */}
                          {detailData.websiteAnalysis && detailData.websiteAnalysis.status !== 'pending' && (
                            <div className={`rounded-xl p-4 border ${
                              detailData.websiteAnalysis.status === 'qualified' ? 'bg-emerald-50 border-emerald-100' :
                              detailData.websiteAnalysis.status === 'maybe' ? 'bg-amber-50 border-amber-100' :
                              detailData.websiteAnalysis.status === 'disqualified' ? 'bg-red-50 border-red-100' :
                              'bg-slate-50 border-slate-100'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                  <ShieldCheck size={12} />
                                  网站验证
                                </p>
                                <span className={`text-lg font-black font-mono ${
                                  detailData.websiteAnalysis.relevanceScore >= 70 ? 'text-emerald-600' :
                                  detailData.websiteAnalysis.relevanceScore >= 40 ? 'text-amber-600' :
                                  'text-red-500'
                                }`}>
                                  {detailData.websiteAnalysis.relevanceScore}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-relaxed">{detailData.websiteAnalysis.qualificationReason}</p>
                              {detailData.websiteAnalysis.products?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {detailData.websiteAnalysis.products.slice(0, 4).map((p: any, i: number) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-white/60 text-slate-700 rounded text-[9px] font-medium">{p.name}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Column 2: Signals & Score */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">穿透信号</h4>
                          {detailData.research?.signals?.length > 0 ? (
                            <div className="space-y-2">
                              {detailData.research.signals.map((signal: any, idx: number) => {
                                const strengthColor = signal.strength === 'trigger' ? 'bg-red-50 text-red-600 border-red-100' :
                                  signal.strength === 'high' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                  'bg-slate-50 text-slate-500 border-slate-100';
                                const typeIcon = signal.type === 'hiring' ? '🧑‍💼' :
                                  signal.type === 'expansion' ? '🏭' :
                                  signal.type === 'regulation' ? '⚠️' :
                                  signal.type === 'automation' ? '🤖' :
                                  signal.type === 'tender' ? '📋' : '📊';
                                return (
                                  <div key={idx} className="bg-white rounded-xl p-3 border border-border">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span>{typeIcon}</span>
                                      <span className="text-xs font-bold text-navy-900">{signal.subType}</span>
                                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase border ${strengthColor}`}>
                                        {signal.strength}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-relaxed">{signal.evidence?.snippet}</p>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 py-4">暂无穿透信号</p>
                          )}
                          {detailData.research?.keyHooks?.length > 0 && (
                            <div className="bg-gold/5 rounded-xl p-4 border border-gold/20">
                              <p className="text-[10px] font-bold text-gold uppercase tracking-wider mb-2">Key Hooks</p>
                              <ul className="space-y-1">
                                {detailData.research.keyHooks.slice(0, 3).map((hook: string, i: number) => (
                                  <li key={i} className="text-[11px] text-slate-600 flex items-start gap-2">
                                    <Zap size={12} className="text-gold shrink-0 mt-0.5" />
                                    <span>{hook}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Column 3: Contacts */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Users size={12} /> 联系人 ({detailData.contacts?.length || 0})
                          </h4>
                          {detailData.contacts?.length > 0 ? (
                            <div className="space-y-3">
                              {detailData.contacts.map((contact: any, idx: number) => (
                                <div key={idx} className="bg-white rounded-xl p-4 border border-border">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-navy-900/5 flex items-center justify-center text-navy-900 text-xs font-bold">
                                      {(contact.name || '?')[0]}
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-navy-900">{contact.name || 'Unknown'}</p>
                                      <p className="text-[10px] text-slate-400">{contact.title}</p>
                                    </div>
                                  </div>
                                  <div className="space-y-1.5 mt-3">
                                    {contact.emailBest && (
                                      <div className="flex items-center gap-2 text-[11px]">
                                        <Mail size={12} className="text-slate-400 shrink-0" />
                                        <span className="text-slate-600 truncate">{contact.emailBest}</span>
                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                          contact.emailStatus === 'verified' ? 'bg-emerald-50 text-emerald-600' :
                                          contact.emailStatus === 'likely' ? 'bg-amber-50 text-amber-600' :
                                          'bg-slate-50 text-slate-400'
                                        }`}>{contact.emailStatus}</span>
                                      </div>
                                    )}
                                    {contact.linkedinUrl && (
                                      <div className="flex items-center gap-2 text-[11px]">
                                        <Linkedin size={12} className="text-blue-600 shrink-0" />
                                        <a href={contact.linkedinUrl} target="_blank" rel="noopener" className="text-blue-600 hover:underline truncate">LinkedIn</a>
                                      </div>
                                    )}
                                    {contact.whatsapp && (
                                      <div className="flex items-center gap-2 text-[11px]">
                                        <span className="text-emerald-500 shrink-0 text-xs">WA</span>
                                        <span className="text-slate-600">{contact.whatsapp}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="mt-2 flex items-center gap-1">
                                    <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-emerald-400 rounded-full" 
                                        style={{ width: `${(contact.confidence || 0) * 100}%` }}
                                      />
                                    </div>
                                    <span className="text-[9px] text-slate-400 font-bold">{Math.round((contact.confidence || 0) * 100)}%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 py-4">暂无联系人数据</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400 text-sm">加载失败</div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LeadPool;
