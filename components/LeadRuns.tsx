import React, { useState, useEffect } from 'react';
import { LeadRun, Product } from '../types';
import { Play, Clock, CheckCircle2, AlertCircle, RefreshCw, Plus, Globe, Languages, Target } from 'lucide-react';

interface LeadRunsProps {
  onViewPool: () => void;
}

const LeadRuns: React.FC<LeadRunsProps> = ({ onViewPool }) => {
  const [runs, setRuns] = useState<LeadRun[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newRun, setNewRun] = useState({
    productId: '',
    country: 'Germany',
    language: 'German'
  });

  useEffect(() => {
    fetch('/api/runs').then(res => res.json()).then(setRuns);
    fetch('/api/products').then(res => res.json()).then(data => {
      setProducts(data);
      if (data.length > 0) setNewRun(prev => ({ ...prev, productId: data[0].id }));
    });

    const interval = setInterval(() => {
      fetch('/api/runs').then(res => res.json()).then(setRuns);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStartRun = async () => {
    const product = products.find(p => p.id === newRun.productId);
    if (!product) return;

    const res = await fetch('/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newRun,
        productName: product.name
      })
    });
    const data = await res.json();
    setRuns([data, ...runs]);
    setIsCreating(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">获客任务中心 (Lead Runs)</h2>
          <p className="text-slate-500 text-sm mt-1">启动并监控全自动获客流水线：从发现公司到生成个性化开发信。</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="px-6 py-3 rounded-xl bg-navy-900 text-white text-sm font-bold hover:bg-navy-800 transition-all shadow-lg flex items-center gap-2"
        >
          <Plus size={18} className="text-gold" /> 新建获客任务
        </button>
      </div>

      {isCreating && (
        <div className="bg-white rounded-[2.5rem] border border-gold/30 p-10 custom-shadow animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-navy-900 flex items-center gap-3">
              <Target size={20} className="text-gold" /> 配置新任务
            </h3>
            <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-navy-900"><AlertCircle size={20} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">选择产品</label>
              <select 
                value={newRun.productId}
                onChange={e => setNewRun({ ...newRun, productId: e.target.value })}
                className="w-full bg-ivory/30 border border-border rounded-xl px-4 py-3 text-sm font-bold text-navy-900 outline-none"
              >
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">目标国家</label>
              <div className="relative">
                <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  value={newRun.country}
                  onChange={e => setNewRun({ ...newRun, country: e.target.value })}
                  className="w-full bg-ivory/30 border border-border rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-navy-900 outline-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">主要语言</label>
              <div className="relative">
                <Languages size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  value={newRun.language}
                  onChange={e => setNewRun({ ...newRun, language: e.target.value })}
                  className="w-full bg-ivory/30 border border-border rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-navy-900 outline-none"
                />
              </div>
            </div>
          </div>
          <div className="mt-10 flex justify-end gap-4">
            <button onClick={() => setIsCreating(false)} className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-navy-900 transition-all">取消</button>
            <button 
              onClick={handleStartRun}
              className="px-10 py-3 bg-navy-900 text-white rounded-2xl text-sm font-bold hover:bg-navy-800 transition-all shadow-xl flex items-center gap-3"
            >
              立即启动流水线 <Play size={16} className="text-gold" />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {runs.length === 0 ? (
          <div className="p-20 text-center bg-ivory/30 border border-dashed border-border rounded-[3rem]">
            <p className="text-slate-400 font-medium">暂无运行中的任务，点击右上角启动。</p>
          </div>
        ) : (
          runs.map(run => (
            <div key={run.id} className="bg-white rounded-[2.5rem] border border-border p-8 custom-shadow hover:border-gold/30 transition-all group">
              <div className="flex flex-col xl:flex-row gap-8 items-center">
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-4 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      run.status === 'done' ? 'bg-emerald-50 text-emerald-500' : 
                      run.status === 'failed' ? 'bg-red-50 text-red-500' : 'bg-gold/10 text-gold'
                    }`}>
                      {run.status === 'done' ? <CheckCircle2 size={20} /> : 
                       run.status === 'failed' ? <AlertCircle size={20} /> : <RefreshCw size={20} className="animate-spin" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-navy-900">{run.productName}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Globe size={10} /> {run.country}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Languages size={10} /> {run.language}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Clock size={10} /> {new Date(run.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 w-full">
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>Pipeline 进度</span>
                      <span className="text-navy-900">{run.status === 'done' ? '100%' : '处理中...'}</span>
                    </div>
                    <div className="h-2 bg-ivory rounded-full overflow-hidden flex">
                      <div className="h-full bg-gold transition-all duration-1000" style={{ width: `${Math.min(100, (run.progress.discovery / 8) * 25)}%` }} />
                      <div className="h-full bg-blue-400 transition-all duration-1000" style={{ width: `${Math.min(100, (run.progress.contact / 6) * 25)}%` }} />
                      <div className="h-full bg-purple-400 transition-all duration-1000" style={{ width: `${Math.min(100, (run.progress.research / 8) * 25)}%` }} />
                      <div className="h-full bg-emerald-400 transition-all duration-1000" style={{ width: `${Math.min(100, (run.progress.outreach / 4) * 25)}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                      <span>发现公司 ({run.progress.discovery})</span>
                      <span>联系人 ({run.progress.contact})</span>
                      <span>背调 ({run.progress.research})</span>
                      <span>文案 ({run.progress.outreach})</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                   <button 
                    onClick={onViewPool}
                    className="px-6 py-3 rounded-xl border border-border text-xs font-bold text-navy-900 hover:bg-ivory transition-all"
                   >
                     查看结果
                   </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LeadRuns;
