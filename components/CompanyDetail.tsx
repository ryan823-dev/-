import React, { useState, useEffect } from 'react';
import { Company, Contact, Evidence, Research, Scoring, Outreach, TenderMetadata, WebsiteAnalysis } from '../types';
import { useToast } from './Toast';
import { X, Globe, Mail, Phone, Linkedin, ShieldCheck, Star, FileText, MessageCircle, Link as LinkIcon, CheckCircle2, AlertCircle, Sparkles, Loader2, Search, Package, Cpu, Factory, Send } from 'lucide-react';

interface CompanyDetailProps {
  companyId: string;
  onClose: () => void;
}

const CompanyDetail: React.FC<CompanyDetailProps> = ({ companyId, onClose }) => {
  const toast = useToast();
  const [data, setData] = useState<Company & { 
    contacts: Contact[], 
    research: Research, 
    score: Scoring, 
    outreach: Outreach, 
    evidence: Evidence[],
    tenderMetadata?: TenderMetadata,
    websiteAnalysis?: WebsiteAnalysis
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'website-analysis' | 'evidence' | 'research' | 'outreach'>('overview');
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState<'A' | 'B' | null>(null);
  const [sendEmailTo, setSendEmailTo] = useState('');
  const [showSendModal, setShowSendModal] = useState<{ type: 'A' | 'B', subject: string, body: string } | null>(null);

  // 发送邮件
  const handleSendEmail = async (emailType: 'A' | 'B', subject: string, body: string, toEmail: string) => {
    if (!toEmail) {
      toast.error('请输入收件人邮箱');
      return;
    }
    setIsSendingEmail(emailType);
    try {
      const res = await fetch('/api/outreach/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          toEmail,
          subject,
          body,
          emailType: `email${emailType}`
        })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.details || result.error);
      toast.success('发送成功', `邮件已发送至 ${toEmail}`);
      setShowSendModal(null);
      setSendEmailTo('');
      // 刷新数据以更新状态
      const refreshRes = await fetch(`/api/companies/${companyId}`);
      if (refreshRes.ok) setData(await refreshRes.json());
    } catch (err: any) {
      toast.error('发送失败', err.message || '请检查邮件配置');
    } finally {
      setIsSendingEmail(null);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    
    fetch(`/api/companies/${companyId}`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch company details:', err);
          setError('加载公司详情失败，请稍后重试');
        }
      });
    
    return () => controller.abort();
  }, [companyId]);

  if (error) return (
    <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-[3rem] p-12 text-center max-w-md">
        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
        <p className="text-sm font-bold text-navy-900 mb-4">{error}</p>
        <button 
          onClick={onClose}
          className="px-6 py-3 bg-navy-900 text-white rounded-xl text-sm font-bold hover:bg-navy-800 transition-all"
        >
          关闭
        </button>
      </div>
    </div>
  );

  if (!data) return (
    <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-[3rem] p-12 text-center">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-bold text-navy-900">深度穿透中...</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 md:p-12">
      <div className="bg-ivory w-full max-w-6xl h-full rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-white px-10 py-8 border-b border-border flex justify-between items-start shrink-0">
          <div className="flex gap-6 items-center">
            <div className="w-16 h-16 bg-navy-900 rounded-2xl flex items-center justify-center text-gold shadow-xl">
              <Globe size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-navy-900">{data.name}</h2>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Globe size={12} /> {data.country}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <ShieldCheck size={12} className="text-gold" /> {data.industry}
                </span>
                <a href={data.website} target="_blank" rel="noreferrer" className="text-xs font-bold text-gold hover:underline flex items-center gap-1">
                  <LinkIcon size={12} /> {data.website}
                </a>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {data.websiteAnalysis && data.websiteAnalysis.status !== 'pending' && (
              <div className="text-center px-6 border-r border-border">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">相关度</p>
                <p className={`text-xl font-black font-mono ${
                  data.websiteAnalysis.relevanceScore >= 70 ? 'text-emerald-600' :
                  data.websiteAnalysis.relevanceScore >= 40 ? 'text-amber-600' :
                  'text-red-500'
                }`}>
                  {data.websiteAnalysis.relevanceScore}
                </p>
              </div>
            )}
            <div className="text-center px-6 border-r border-border">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">AI 优先级</p>
              <p className={`text-xl font-black font-mono ${
                data.score?.tier?.includes('Tier A') ? 'text-red-600' :
                data.score?.tier?.includes('Tier B') ? 'text-amber-600' :
                data.score?.tier?.includes('Tier C') ? 'text-blue-600' :
                'text-slate-400'
              }`}>
                {data.score?.tier?.split(' ')[1] || 'D'}
              </p>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white px-10 flex gap-10 shrink-0">
          {[
            { id: 'overview', label: '概览 & 联系人', icon: FileText },
            { id: 'website-analysis', label: '网站验证', icon: ShieldCheck },
            { id: 'evidence', label: '证据库', icon: LinkIcon },
            { id: 'research', label: '背调报告', icon: ShieldCheck },
            { id: 'outreach', label: '触达文案', icon: MessageCircle },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-5 text-sm font-bold flex items-center gap-2 transition-all relative ${
                activeTab === tab.id ? 'text-navy-900' : 'text-slate-400 hover:text-navy-800'
              }`}
            >
              <tab.icon size={16} className={activeTab === tab.id ? 'text-gold' : ''} />
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gold rounded-full" />}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Status & Follow-up Section */}
              <section className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">线索状态管理</h3>
                  <span className="text-[10px] text-slate-400">
                    {data.lastOutreachAt ? `上次触达: ${new Date(data.lastOutreachAt).toLocaleDateString('zh-CN')}` : '尚未触达'}
                  </span>
                </div>
                
                {/* Status Pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {[
                    { value: 'discovered', label: '已发现', color: 'slate' },
                    { value: 'researched', label: '已调研', color: 'blue' },
                    { value: 'scored', label: '已评分', color: 'purple' },
                    { value: 'contacted', label: '已联系', color: 'amber' },
                    { value: 'replied', label: '已回复', color: 'emerald' },
                    { value: 'won', label: '已成交', color: 'gold' },
                    { value: 'lost', label: '已流失', color: 'red' },
                  ].map(s => (
                    <button
                      key={s.value}
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/companies/${companyId}/status`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: s.value })
                          });
                          if (res.ok) {
                            setData(prev => prev ? { ...prev, status: s.value as any } : prev);
                            toast.success('状态已更新');
                          }
                        } catch { toast.error('更新失败'); }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        data.status === s.value
                          ? s.color === 'gold' 
                            ? 'bg-gold text-navy-900 ring-2 ring-gold/50' 
                            : `bg-${s.color}-500 text-white ring-2 ring-${s.color}-400/50`
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Quick Add Note */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="添加跟进备注..."
                    className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-gold/50"
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        const note = e.currentTarget.value.trim();
                        try {
                          const res = await fetch(`/api/companies/${companyId}/follow-up`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ note, type: 'note' })
                          });
                          if (res.ok) {
                            const result = await res.json();
                            setData(prev => prev ? { ...prev, followUpNotes: result.followUpNotes } : prev);
                            e.currentTarget.value = '';
                            toast.success('备注已添加');
                          }
                        } catch { toast.error('添加失败'); }
                      }
                    }}
                  />
                  <button 
                    className="px-4 py-2.5 bg-gold text-navy-900 rounded-xl text-xs font-bold hover:bg-gold/90 transition-colors"
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="添加跟进备注..."]') as HTMLInputElement;
                      if (input?.value.trim()) {
                        const event = new KeyboardEvent('keydown', { key: 'Enter' });
                        input.dispatchEvent(event);
                      }
                    }}
                  >
                    添加
                  </button>
                </div>

                {/* Follow-up History */}
                {(data as any).followUpNotes?.length > 0 && (
                  <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
                    {((data as any).followUpNotes || []).slice().reverse().map((note: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span className="text-slate-400 shrink-0">{new Date(note.createdAt).toLocaleDateString('zh-CN')}</span>
                        <span className="text-white/80">{note.note}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Outreach History */}
                {(data as any).outreachHistory?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">触达历史</p>
                    <div className="space-y-1">
                      {((data as any).outreachHistory || []).slice().reverse().slice(0, 3).map((h: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <Mail size={12} className="text-emerald-400" />
                          <span className="text-slate-400">{new Date(h.sentAt).toLocaleDateString('zh-CN')}</span>
                          <span className="text-white/60 truncate">{h.toEmail}</span>
                          <span className="text-emerald-400 text-[10px]">✓ 已发送</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">决策人列表 ({data.contacts.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data.contacts.map(contact => (
                    <div key={contact.id} className="bg-white rounded-2xl border border-border p-6 custom-shadow hover:border-gold/30 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-bold text-navy-900">{contact.name || '未知姓名'}</p>
                          <p className="text-xs text-slate-500 font-medium mt-1">{contact.title}</p>
                        </div>
                        <div className="flex gap-2">
                          {contact.linkedinUrl && <a href={contact.linkedinUrl} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Linkedin size={14} /></a>}
                          {contact.emailBest && <button className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Mail size={14} /></button>}
                          {contact.whatsapp && <button className="p-2 bg-green-50 text-green-600 rounded-lg"><MessageCircle size={14} /></button>}
                        </div>
                      </div>
                      <div className="pt-4 border-t border-border flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">可信度: {Math.round(contact.confidence * 100)}%</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                          contact.emailStatus === 'verified' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {contact.emailStatus.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'website-analysis' && (
            <div className="space-y-8 max-w-4xl mx-auto">
              {data.websiteAnalysis && data.websiteAnalysis.status !== 'pending' ? (
                <div className="bg-white rounded-[2.5rem] border border-border p-10 custom-shadow">
                  {/* Header: Qualification Badge */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      data.websiteAnalysis.status === 'qualified' ? 'bg-emerald-50 text-emerald-600' :
                      data.websiteAnalysis.status === 'maybe' ? 'bg-amber-50 text-amber-600' :
                      data.websiteAnalysis.status === 'disqualified' ? 'bg-red-50 text-red-500' :
                      'bg-slate-50 text-slate-400'
                    }`}>
                      {data.websiteAnalysis.status === 'qualified' ? <CheckCircle2 size={28} /> :
                       data.websiteAnalysis.status === 'disqualified' ? <AlertCircle size={28} /> :
                       <Search size={28} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-navy-900">网站验证结果</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          data.websiteAnalysis.status === 'qualified' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                          data.websiteAnalysis.status === 'maybe' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                          data.websiteAnalysis.status === 'disqualified' ? 'bg-red-50 text-red-500 border border-red-200' :
                          'bg-slate-50 text-slate-400 border border-slate-200'
                        }`}>
                          {data.websiteAnalysis.status === 'qualified' ? 'QUALIFIED' :
                           data.websiteAnalysis.status === 'maybe' ? 'MAYBE' :
                           data.websiteAnalysis.status === 'disqualified' ? 'DISQUALIFIED' :
                           data.websiteAnalysis.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">{data.websiteAnalysis.qualificationReason}</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-3xl font-black font-mono ${
                        data.websiteAnalysis.relevanceScore >= 70 ? 'text-emerald-600' :
                        data.websiteAnalysis.relevanceScore >= 40 ? 'text-amber-600' :
                        'text-red-500'
                      }`}>
                        {data.websiteAnalysis.relevanceScore}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">相关度评分</p>
                    </div>
                  </div>

                  {/* 4D Scoring Breakdown */}
                  {data.websiteAnalysis.breakdown && (
                    <section className="mb-8">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">四维评分</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { key: 'industryMatch', label: '行业匹配', icon: Factory },
                          { key: 'businessRelevance', label: '业务相关性', icon: Package },
                          { key: 'sizeMatch', label: '规模匹配', icon: Globe },
                          { key: 'technologyGap', label: '技术缺口', icon: Cpu },
                        ].map(dim => {
                          const bd = data.websiteAnalysis!.breakdown[dim.key as keyof typeof data.websiteAnalysis.breakdown] as { score: number; reasoning: string } | undefined;
                          if (!bd) return null;
                          const Icon = dim.icon;
                          return (
                            <div key={dim.key} className="bg-ivory/30 rounded-xl p-4 border border-border">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Icon size={14} className="text-slate-400" />
                                  <span className="text-xs font-bold text-navy-900">{dim.label}</span>
                                </div>
                                <span className={`text-lg font-black font-mono ${
                                  bd.score >= 70 ? 'text-emerald-600' :
                                  bd.score >= 40 ? 'text-amber-600' :
                                  'text-red-500'
                                }`}>
                                  {bd.score}
                                </span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                                <div className={`h-full rounded-full transition-all ${
                                  bd.score >= 70 ? 'bg-emerald-400' :
                                  bd.score >= 40 ? 'bg-amber-400' :
                                  'bg-red-400'
                                }`} style={{ width: `${bd.score}%` }} />
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed">{bd.reasoning}</p>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* Extracted Products & Equipment */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {data.websiteAnalysis.products && data.websiteAnalysis.products.length > 0 && (
                      <section>
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                          <Package size={12} /> 发现的产品/业务
                        </h4>
                        <div className="space-y-2">
                          {data.websiteAnalysis.products.map((p, i) => (
                            <div key={i} className="bg-ivory/30 rounded-lg p-3 border border-border">
                              <p className="text-xs font-bold text-navy-900">{p.name}</p>
                              {p.description && <p className="text-[11px] text-slate-500 mt-1">{p.description}</p>}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {data.websiteAnalysis.equipment && data.websiteAnalysis.equipment.length > 0 && (
                      <section>
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                          <Cpu size={12} /> 发现的设备
                        </h4>
                        <div className="space-y-2">
                          {data.websiteAnalysis.equipment.map((e, i) => (
                            <div key={i} className="bg-ivory/30 rounded-lg p-3 border border-border">
                              <p className="text-xs font-bold text-navy-900">{e.type}</p>
                              {e.brand && <span className="text-[10px] text-slate-400 font-medium">品牌: {e.brand}</span>}
                              {e.context && <p className="text-[11px] text-slate-500 mt-1">{e.context}</p>}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>

                  {/* Technologies & Company Size */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    {data.websiteAnalysis.technologies && data.websiteAnalysis.technologies.length > 0 && (
                      <section>
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">相关技术</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {data.websiteAnalysis.technologies.map((t, i) => (
                            <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold border border-blue-100">{t}</span>
                          ))}
                        </div>
                      </section>
                    )}

                    {data.websiteAnalysis.companySize && (
                      <section>
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">公司规模</h4>
                        <div className="bg-ivory/30 rounded-lg p-4 border border-border space-y-2 text-xs">
                          {data.websiteAnalysis.companySize.employees && (
                            <p><span className="text-slate-400 font-medium">员工:</span> <span className="font-bold text-navy-900">{data.websiteAnalysis.companySize.employees}</span></p>
                          )}
                          {data.websiteAnalysis.companySize.facilities && (
                            <p><span className="text-slate-400 font-medium">设施:</span> <span className="font-bold text-navy-900">{data.websiteAnalysis.companySize.facilities}</span></p>
                          )}
                          {data.websiteAnalysis.companySize.indicators && data.websiteAnalysis.companySize.indicators.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {data.websiteAnalysis.companySize.indicators.map((ind, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px]">{ind}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </section>
                    )}
                  </div>

                  {/* Crawled Pages Info */}
                  {data.websiteAnalysis.pagesCrawled && data.websiteAnalysis.pagesCrawled.length > 0 && (
                    <section className="mt-8 pt-6 border-t border-border">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">爬取页面</h4>
                      <div className="flex flex-wrap gap-2">
                        {data.websiteAnalysis.pagesCrawled.map((page, i) => (
                          <span key={i} className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border ${
                            page.success ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-500 border-red-100'
                          }`}>
                            {page.success ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                            {page.pageType}
                          </span>
                        ))}
                      </div>
                      {data.websiteAnalysis.language && (
                        <p className="text-[10px] text-slate-400 mt-2">
                          检测语言: <span className="font-bold">{data.websiteAnalysis.language}</span>
                          {data.websiteAnalysis.analyzedAt && (
                            <span className="ml-3">分析时间: {new Date(data.websiteAnalysis.analyzedAt).toLocaleString('zh-CN')}</span>
                          )}
                        </p>
                      )}
                      {data.websiteAnalysis.errorMessage && (
                        <p className="text-[10px] text-amber-500 mt-1">{data.websiteAnalysis.errorMessage}</p>
                      )}
                    </section>
                  )}
                </div>
              ) : (
                <div className="bg-ivory/50 border border-dashed border-border rounded-[2.5rem] p-12 text-center">
                  <Search size={48} className="text-slate-200 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-navy-900 mb-2">尚未进行网站验证</h3>
                  <p className="text-sm text-slate-500">该公司尚未经过网站深度分析，启动获客任务后将自动进行。</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'research' && (
            <div className="space-y-8 max-w-4xl mx-auto">
              <div className="bg-white rounded-[2.5rem] border border-border p-10 custom-shadow">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center text-gold">
                    <ShieldCheck size={28} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-navy-900">AI 深度背调报告</h3>
                    <p className="text-xs text-slate-500 mt-1">基于官网、新闻及社交媒体数据的结构化分析</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <section>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">一、公司核心业务概览</h4>
                    <p className="text-sm text-navy-900 leading-relaxed font-medium bg-ivory/30 p-6 rounded-2xl border border-border">
                      {data.research?.summary || '暂无背调摘要'}
                    </p>
                  </section>

                  {/* 招投标机会展示 (Tender Opportunity) */}
                  {data.tenderMetadata && (
                    <section className="p-6 bg-purple-50 border border-purple-200 rounded-2xl">
                      <h4 className="text-[11px] font-bold text-purple-700 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <FileText size={14} /> 招投标机会 (Procurement Opportunity)
                      </h4>
                      <div className="space-y-4 text-sm">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">标的名称</span>
                          <p className="font-bold text-navy-900 mt-1">{data.tenderMetadata.tenderTitle}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">平台</span>
                            <p className="font-medium text-navy-900 mt-1">{data.tenderMetadata.platform}</p>
                          </div>
                          {data.tenderMetadata.deadline && (
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">截止日期</span>
                              <p className="text-red-600 font-bold mt-1">
                                {new Date(data.tenderMetadata.deadline).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          {data.tenderMetadata.estimatedValue && (
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">预估金额</span>
                              <p className="text-emerald-600 font-bold mt-1">{data.tenderMetadata.estimatedValue}</p>
                            </div>
                          )}
                        </div>
                        {data.tenderMetadata.requirements && data.tenderMetadata.requirements.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">资质要求</span>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {data.tenderMetadata.requirements.map((r, i) => (
                                <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">{r}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {data.tenderMetadata.tenderUrl && (
                          <a 
                            href={data.tenderMetadata.tenderUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:underline mt-2"
                          >
                            查看完整招标公告 <LinkIcon size={12} />
                          </a>
                        )}
                      </div>
                    </section>
                  )}

                  <section>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">二、关键业务信号 (Shadow Signals)</h4>
                    <div className="grid grid-cols-1 gap-4">
                      {data.research?.signals.map((sig, i) => (
                        <div key={i} className="flex gap-4 p-5 bg-white border border-border rounded-2xl hover:border-gold/30 transition-all group">
                          <div className={`shrink-0 mt-1 w-8 h-8 rounded-lg flex items-center justify-center ${
                            sig.strength === 'trigger' ? 'bg-red-50 text-red-500' :
                            sig.strength === 'high' ? 'bg-amber-50 text-amber-500' :
                            'bg-blue-50 text-blue-500'
                          }`}>
                            {sig.strength === 'trigger' ? <AlertCircle size={18} /> : <Star size={18} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <p className="text-xs font-bold text-navy-900">{sig.evidence.snippet}</p>
                              <span className="text-[9px] font-bold text-slate-400 uppercase">{sig.type}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-[9px] font-bold text-gold uppercase tracking-widest">{sig.source}</span>
                              <span className="text-[9px] text-slate-400 font-medium">{new Date(sig.evidence.timestamp).toLocaleDateString()}</span>
                              {sig.evidence.url && (
                                <a href={sig.evidence.url} target="_blank" rel="noreferrer" className="text-[9px] text-blue-500 font-bold hover:underline">查看证据 →</a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div className="grid grid-cols-2 gap-8 pt-8 border-t border-border">
                    <section>
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">三、采购意向评估</h4>
                      <div className={`p-6 rounded-2xl border flex items-center gap-4 ${
                        data.research?.purchaseIntent === 'high' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'
                      }`}>
                        <AlertCircle size={24} />
                        <div>
                          <p className="text-sm font-bold uppercase tracking-widest">{data.research?.purchaseIntent === 'high' ? '高意向' : '中等意向'}</p>
                          <p className="text-[11px] mt-1 font-medium">基于扩产信号与现有产线老化程度推断</p>
                        </div>
                      </div>
                    </section>
                    <section>
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">四、建议切入点 (Hooks)</h4>
                      <div className="space-y-2">
                        {data.research?.keyHooks.map((hook, i) => (
                          <div key={i} className="text-xs font-bold text-navy-900 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-gold" /> {hook}
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'outreach' && (
            <div className="space-y-8 max-w-4xl mx-auto">
              {/* Generate Outreach Button */}
              {!data.outreach?.emailA && (
                <div className="bg-ivory/50 border border-dashed border-border rounded-[2.5rem] p-12 text-center">
                  <Sparkles size={48} className="text-gold/30 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-navy-900 mb-2">尚未生成触达文案</h3>
                  <p className="text-sm text-slate-500 mb-6">AI 将根据公司背调数据生成个性化开发信和 WhatsApp 消息</p>
                  <button 
                    onClick={async () => {
                      setIsGeneratingOutreach(true);
                      try {
                        const res = await fetch(`/api/companies/${companyId}/outreach/generate`, { method: 'POST' });
                        if (!res.ok) {
                          const err = await res.json().catch(() => ({ error: 'Generation failed' }));
                          throw new Error(err.details || err.error);
                        }
                        const outreach = await res.json();
                        setData(prev => prev ? { ...prev, outreach: { ...outreach, updatedAt: new Date().toISOString() } } : prev);
                        toast.success('文案生成完成', '已生成 2 封开发信 + 1 条 WhatsApp 消息');
                      } catch (err: any) {
                        toast.error('生成失败', err.message || '请稍后重试');
                      } finally {
                        setIsGeneratingOutreach(false);
                      }
                    }}
                    disabled={isGeneratingOutreach}
                    className="px-8 py-3 bg-navy-900 text-white rounded-2xl text-sm font-bold hover:bg-navy-800 transition-all shadow-xl flex items-center gap-2 mx-auto disabled:opacity-50"
                  >
                    {isGeneratingOutreach ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-gold" />}
                    {isGeneratingOutreach ? 'AI 正在生成...' : '由 AI 生成触达文案'}
                  </button>
                </div>
              )}

              {data.outreach?.emailA && (
                <div className="grid grid-cols-1 gap-8">
                  {/* Email A */}
                  <div className="bg-white rounded-[2.5rem] border border-border p-10 custom-shadow">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-sm font-bold text-navy-900 flex items-center gap-3">
                        <Mail size={18} className="text-gold" /> 开发信 A (理性/ROI型)
                      </h3>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => { navigator.clipboard.writeText(`Subject: ${data.outreach?.emailA.subject}\n\n${data.outreach?.emailA.body}`); toast.success('已复制', '邮件内容已复制到剪贴板'); }}
                          className="text-[10px] font-bold text-gold hover:underline uppercase tracking-widest"
                        >
                          复制正文
                        </button>
                        <button 
                          onClick={() => {
                            const contact = data.contacts?.[0];
                            setSendEmailTo(contact?.emailBest || '');
                            setShowSendModal({ type: 'A', subject: data.outreach?.emailA.subject || '', body: data.outreach?.emailA.body || '' });
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gold text-navy-900 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-gold/90 transition-colors"
                        >
                          <Send size={12} /> 发送邮件
                        </button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 bg-ivory/30 rounded-xl border border-border">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">邮件主题</p>
                        <p className="text-sm font-bold text-navy-900">{data.outreach?.emailA.subject}</p>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-xl border border-border font-mono text-xs leading-relaxed text-navy-900 whitespace-pre-wrap">
                        {data.outreach?.emailA.body}
                      </div>
                    </div>
                  </div>

                  {/* Email B */}
                  {data.outreach?.emailB && (
                    <div className="bg-white rounded-[2.5rem] border border-border p-10 custom-shadow">
                      <div className="flex justify-between items-center mb-8">
                        <h3 className="text-sm font-bold text-navy-900 flex items-center gap-3">
                          <Mail size={18} className="text-blue-500" /> 开发信 B (痛点/信号型)
                        </h3>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => { navigator.clipboard.writeText(`Subject: ${data.outreach?.emailB?.subject}\n\n${data.outreach?.emailB?.body}`); toast.success('已复制', '邮件内容已复制到剪贴板'); }}
                            className="text-[10px] font-bold text-blue-500 hover:underline uppercase tracking-widest"
                          >
                            复制正文
                          </button>
                          <button 
                            onClick={() => {
                              const contact = data.contacts?.[0];
                              setSendEmailTo(contact?.emailBest || '');
                              setShowSendModal({ type: 'B', subject: data.outreach?.emailB?.subject || '', body: data.outreach?.emailB?.body || '' });
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-colors"
                          >
                            <Send size={12} /> 发送邮件
                          </button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50/30 rounded-xl border border-blue-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">邮件主题</p>
                          <p className="text-sm font-bold text-navy-900">{data.outreach?.emailB.subject}</p>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-xl border border-border font-mono text-xs leading-relaxed text-navy-900 whitespace-pre-wrap">
                          {data.outreach?.emailB.body}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* WhatsApp */}
                  <div className="bg-emerald-900 rounded-[2.5rem] p-10 text-white shadow-xl">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-sm font-bold flex items-center gap-3">
                        <MessageCircle size={18} className="text-emerald-400" /> WhatsApp 建联短消息
                      </h3>
                      <button 
                        onClick={() => { navigator.clipboard.writeText(data.outreach?.whatsapp?.message || ''); toast.success('已复制', '消息已复制到剪贴板'); }}
                        className="text-[10px] font-bold text-emerald-400 hover:underline uppercase tracking-widest"
                      >
                        复制消息
                      </button>
                    </div>
                    <div className="p-6 bg-white/10 rounded-xl border border-white/10 text-sm font-medium leading-relaxed italic">
                      "{data.outreach?.whatsapp?.message}"
                    </div>
                  </div>

                  {/* Regenerate */}
                  <div className="text-center">
                    <button 
                      onClick={async () => {
                        setIsGeneratingOutreach(true);
                        try {
                          const res = await fetch(`/api/companies/${companyId}/outreach/generate`, { method: 'POST' });
                          if (!res.ok) throw new Error('Regeneration failed');
                          const outreach = await res.json();
                          setData(prev => prev ? { ...prev, outreach: { ...outreach, updatedAt: new Date().toISOString() } } : prev);
                          toast.success('重新生成完成', '文案已更新');
                        } catch (err: any) {
                          toast.error('生成失败', err.message);
                        } finally {
                          setIsGeneratingOutreach(false);
                        }
                      }}
                      disabled={isGeneratingOutreach}
                      className="text-xs font-bold text-slate-500 hover:text-navy-900 transition-colors flex items-center gap-2 mx-auto disabled:opacity-50"
                    >
                      {isGeneratingOutreach ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      重新生成全部文案
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Send Email Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-navy-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                <Send size={20} className={showSendModal.type === 'A' ? 'text-gold' : 'text-blue-500'} />
                发送开发信 {showSendModal.type}
              </h3>
              <button onClick={() => { setShowSendModal(null); setSendEmailTo(''); }} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">收件人邮箱</label>
                <input 
                  type="email"
                  value={sendEmailTo}
                  onChange={(e) => setSendEmailTo(e.target.value)}
                  placeholder="输入收件人邮箱地址"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                />
                {data?.contacts?.length > 0 && data.contacts[0].emailBest && (
                  <button 
                    onClick={() => setSendEmailTo(data.contacts[0].emailBest || '')}
                    className="mt-2 text-xs text-gold hover:underline"
                  >
                    使用联系人邮箱: {data.contacts[0].emailBest}
                  </button>
                )}
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">邮件主题</label>
                <div className="px-4 py-3 bg-slate-50 rounded-xl text-sm text-navy-900 border border-slate-100">
                  {showSendModal.subject}
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">邮件内容预览</label>
                <div className="px-4 py-3 bg-slate-50 rounded-xl text-xs text-navy-900 border border-slate-100 max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {showSendModal.body}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => { setShowSendModal(null); setSendEmailTo(''); }}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={() => handleSendEmail(showSendModal.type, showSendModal.subject, showSendModal.body, sendEmailTo)}
                disabled={isSendingEmail !== null || !sendEmailTo}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                  showSendModal.type === 'A' 
                    ? 'bg-gold text-navy-900 hover:bg-gold/90 disabled:bg-gold/50' 
                    : 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300'
                }`}
              >
                {isSendingEmail === showSendModal.type ? (
                  <><Loader2 size={16} className="animate-spin" /> 发送中...</>
                ) : (
                  <><Send size={16} /> 确认发送</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDetail;
