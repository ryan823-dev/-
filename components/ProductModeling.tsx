import React, { useState, useEffect } from 'react';
import { Product, ICPProfile } from '../types';
import { useToast } from './Toast';
import { Sparkles, Save, RefreshCw, ChevronRight, Target, Users, Search, AlertTriangle, Lightbulb, Radar } from 'lucide-react';

const ProductModeling: React.FC = () => {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sourceStrategy, setSourceStrategy] = useState<any>(null);
  const [isGeneratingDeep, setIsGeneratingDeep] = useState(false);

  // Check for ExportStrategy from KnowledgeEngine
  useEffect(() => {
    try {
      const source = localStorage.getItem('vtx_icp_source');
      if (source) {
        setSourceStrategy(JSON.parse(source));
      }
    } catch (e) {
      console.log('No source strategy found');
    }
  }, []);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        if (data.length > 0) setSelectedProduct(data[0]);
      });
  }, []);

  const handleSave = async () => {
    if (!selectedProduct) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedProduct)
      });
      const updated = await res.json();
      setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
      setSelectedProduct(updated);
      toast.success('保存成功', '产品配置已更新');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('保存失败', '请稍后重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 基于知识引擎数据生成深度 ICP
  const handleGenerateDeepICP = async () => {
    if (!sourceStrategy || !selectedProduct) return;
    setIsGeneratingDeep(true);
    try {
      const res = await fetch('/api/knowledge/research/icp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exportStrategy: sourceStrategy,
          productName: sourceStrategy.productNameCN || selectedProduct.name
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details || errorData.error || '生成失败');
      }
      const result = await res.json();
      const deepIcp = result.data;
      const updated = { ...selectedProduct, icpProfile: deepIcp };
      setSelectedProduct(updated);
      setProducts(prev => prev.map(p => p.id === selectedProduct.id ? updated : p));
      // 清除 localStorage 中的源数据
      localStorage.removeItem('vtx_icp_source');
      setSourceStrategy(null);
      toast.success('深度 ICP 已生成', '基于出口调研数据生成的客户画像');
    } catch (error: any) {
      console.error('Deep ICP Generation error:', error);
      toast.error('生成深度 ICP 失败', error.message || '请稍后重试');
    } finally {
      setIsGeneratingDeep(false);
    }
  };

  const handleGenerateICP = async () => {
    if (!selectedProduct) return;
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/products/${selectedProduct.id}/icp/generate`, { method: 'POST' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details || errorData.error || '生成失败');
      }
      const icp = await res.json();
      const updated = { ...selectedProduct, icpProfile: icp };
      setSelectedProduct(updated);
      setProducts(prev => prev.map(p => p.id === selectedProduct.id ? updated : p));
    } catch (error: any) {
      console.error('ICP Generation error:', error);
      toast.error('生成 ICP 失败', error.message || '请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateProduct = (updates: Partial<Product>) => {
    if (!selectedProduct) return;
    setSelectedProduct({ ...selectedProduct, ...updates });
  };

  const updateICP = (updates: Partial<ICPProfile>) => {
    if (!selectedProduct || !selectedProduct.icpProfile) return;
    setSelectedProduct({
      ...selectedProduct,
      icpProfile: { ...selectedProduct.icpProfile, ...updates }
    });
  };

  if (!selectedProduct) return <div className="p-12 text-center text-slate-400">加载产品中...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 来自知识引擎的数据提示 */}
      {sourceStrategy && (
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden animate-in slide-in-from-top duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">检测到出口调研数据</h3>
                <p className="text-white/80 text-sm">
                  来自知识引擎的「{sourceStrategy.productNameCN || '产品'}」调研已就绪，可生成深度客户画像
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { localStorage.removeItem('vtx_icp_source'); setSourceStrategy(null); }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors"
              >
                忽略
              </button>
              <button
                onClick={handleGenerateDeepICP}
                disabled={isGeneratingDeep}
                className="px-6 py-2 bg-white text-indigo-600 rounded-xl text-sm font-bold hover:bg-white/90 transition-colors flex items-center gap-2 shadow-lg"
              >
                {isGeneratingDeep ? <RefreshCw size={16} className="animate-spin" /> : <Target size={16} />}
                生成深度 ICP
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">产品建模 & ICP 画像</h2>
          <p className="text-slate-500 text-sm mt-1">定义产品核心参数，由 AI 自动推演理想客户画像 (ICP) 与搜索策略。</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl border border-border bg-white text-sm font-bold text-navy-900 hover:bg-ivory transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            保存配置
          </button>
          <button 
            onClick={handleGenerateICP}
            disabled={isGenerating}
            className="px-6 py-2.5 rounded-xl bg-navy-900 text-white text-sm font-bold hover:bg-navy-800 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} className="text-gold" />}
            {selectedProduct.icpProfile ? '重新生成 ICP' : '生成 ICP 画像'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left: Product Definition */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white rounded-[2rem] border border-border p-8 custom-shadow">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Target size={14} className="text-gold" /> 产品核心定义
            </h3>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">项目标识 (Slug)</label>
                  <input 
                    value={selectedProduct.slug}
                    onChange={(e) => updateProduct({ slug: e.target.value })}
                    placeholder="e.g. tdpaintcell"
                    className="w-full bg-ivory/30 border border-border rounded-xl px-4 py-3 text-sm font-bold text-navy-900 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">绑定域名</label>
                  <input 
                    value={selectedProduct.customDomain || ''}
                    onChange={(e) => updateProduct({ customDomain: e.target.value })}
                    placeholder="e.g. tdpaintcell.vertax.top"
                    className="w-full bg-ivory/30 border border-border rounded-xl px-4 py-3 text-sm font-bold text-navy-900 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">产品名称</label>
                <input 
                  value={selectedProduct.name}
                  onChange={(e) => updateProduct({ name: e.target.value })}
                  className="w-full bg-ivory/30 border border-border rounded-xl px-4 py-3 text-sm font-bold text-navy-900 focus:ring-2 focus:ring-gold/20 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">产品类型</label>
                  <input 
                    value={selectedProduct.productType}
                    onChange={(e) => updateProduct({ productType: e.target.value })}
                    className="w-full bg-ivory/30 border border-border rounded-xl px-4 py-3 text-sm font-bold text-navy-900 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">涂装类型</label>
                  <input 
                    value={selectedProduct.coatingType}
                    onChange={(e) => updateProduct({ coatingType: e.target.value })}
                    className="w-full bg-ivory/30 border border-border rounded-xl px-4 py-3 text-sm font-bold text-navy-900 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">工件尺寸</label>
                  <select 
                    value={selectedProduct.workpieceSize}
                    onChange={(e) => updateProduct({ workpieceSize: e.target.value })}
                    className="w-full bg-ivory/30 border border-border rounded-xl px-4 py-3 text-sm font-bold text-navy-900 outline-none"
                  >
                    <option value="Small">小型 (Small)</option>
                    <option value="Medium">中型 (Medium)</option>
                    <option value="Large">大型 (Large)</option>
                    <option value="Extra Large">超大型 (XL)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">自动化程度</label>
                  <select 
                    value={selectedProduct.automationLevel}
                    onChange={(e) => updateProduct({ automationLevel: e.target.value })}
                    className="w-full bg-ivory/30 border border-border rounded-xl px-4 py-3 text-sm font-bold text-navy-900 outline-none"
                  >
                    <option value="Manual">手动 (Manual)</option>
                    <option value="Semi-Auto">半自动 (Semi-Auto)</option>
                    <option value="High">全自动 (High)</option>
                    <option value="Full-AI">AI 驱动 (Full-AI)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">核心优势</label>
                <div className="space-y-2">
                  {selectedProduct.advantages.map((adv, i) => (
                    <div key={i} className="flex gap-2">
                      <input 
                        value={adv.label} 
                        onChange={(e) => {
                          const newAdv = [...selectedProduct.advantages];
                          newAdv[i].label = e.target.value;
                          updateProduct({ advantages: newAdv });
                        }}
                        className="flex-1 bg-ivory/30 border border-border rounded-lg px-3 py-2 text-xs font-bold" 
                      />
                      <input 
                        value={adv.value} 
                        onChange={(e) => {
                          const newAdv = [...selectedProduct.advantages];
                          newAdv[i].value = e.target.value;
                          updateProduct({ advantages: newAdv });
                        }}
                        className="flex-1 bg-ivory/30 border border-border rounded-lg px-3 py-2 text-xs font-bold" 
                      />
                    </div>
                  ))}
                  <button 
                    onClick={() => updateProduct({ advantages: [...selectedProduct.advantages, { label: '', value: '' }] })}
                    className="w-full py-2 text-[10px] font-bold text-slate-400 border border-dashed border-border rounded-lg hover:bg-ivory transition-all"
                  >
                    + 添加优势项
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-navy-900 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Lightbulb size={80} /></div>
            <h3 className="text-xs font-bold text-gold uppercase tracking-widest mb-4">AI 建模建议</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              当前产品定位“高精度液体喷涂”，建议在 ICP 中强化“汽车零部件”与“高端家具”权重。AI 已自动为您准备了 12 组德语/英语双语搜索关键词。
            </p>
          </div>
        </div>

        {/* Right: ICP Profile */}
        <div className="xl:col-span-8">
          {!selectedProduct.icpProfile ? (
            <div className="h-full bg-ivory/50 border border-dashed border-border rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-gold shadow-sm mb-6">
                <Sparkles size={32} />
              </div>
              <h3 className="text-lg font-bold text-navy-900">尚未生成 ICP 画像</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-xs">点击上方“生成 ICP 画像”按钮，AI 将根据产品参数推演目标行业、岗位及搜索策略。</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Target Industries */}
                <div className="bg-white rounded-[2rem] border border-border p-8 custom-shadow">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Target size={14} className="text-gold" /> 目标行业 & 客户类型
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-2">行业标签 (逗号分隔)</label>
                      <input 
                        value={selectedProduct.icpProfile.industryTags.join(', ')}
                        onChange={(e) => updateICP({ industryTags: e.target.value.split(',').map(s => s.trim()) })}
                        className="w-full bg-ivory/30 border border-border rounded-xl px-4 py-2 text-xs font-bold text-navy-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-2">客户类型</label>
                      <div className="space-y-2">
                        {selectedProduct.icpProfile.targetCustomerTypes.map((type, i) => (
                          <input 
                            key={i}
                            value={type}
                            onChange={(e) => {
                              const newTypes = [...selectedProduct.icpProfile!.targetCustomerTypes];
                              newTypes[i] = e.target.value;
                              updateICP({ targetCustomerTypes: newTypes });
                            }}
                            className="w-full bg-ivory/30 border border-border rounded-lg px-3 py-2 text-xs font-bold text-navy-900 outline-none"
                          />
                        ))}
                        <button 
                          onClick={() => updateICP({ targetCustomerTypes: [...selectedProduct.icpProfile!.targetCustomerTypes, ''] })}
                          className="w-full py-1.5 text-[9px] font-bold text-slate-400 border border-dashed border-border rounded-lg hover:bg-ivory transition-all"
                        >
                          + 添加客户类型
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Target Titles */}
                <div className="bg-white rounded-[2rem] border border-border p-8 custom-shadow">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Users size={14} className="text-gold" /> 目标岗位 (决策人)
                  </h3>
                  <div className="space-y-3">
                    {selectedProduct.icpProfile.targetTitles.map((title, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-[9px] font-bold px-2 py-1.5 bg-navy-900 text-white rounded-md">P{i}</span>
                        <input 
                          value={title}
                          onChange={(e) => {
                            const newTitles = [...selectedProduct.icpProfile!.targetTitles];
                            newTitles[i] = e.target.value;
                            updateICP({ targetTitles: newTitles });
                          }}
                          className="flex-1 bg-ivory/30 border border-border rounded-lg px-3 py-2 text-xs font-bold text-navy-900 outline-none"
                        />
                      </div>
                    ))}
                    <button 
                      onClick={() => updateICP({ targetTitles: [...selectedProduct.icpProfile!.targetTitles, ''] })}
                      className="w-full py-1.5 text-[9px] font-bold text-slate-400 border border-dashed border-border rounded-lg hover:bg-ivory transition-all"
                    >
                      + 添加岗位
                    </button>
                  </div>
                </div>
              </div>

              {/* Query Pack & Signal Pack */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-[2rem] border border-border p-8 custom-shadow">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Search size={14} className="text-gold" /> 搜索关键词包 (Query Pack)
                  </h3>
                  <div className="space-y-6">
                    {(Object.entries(selectedProduct.icpProfile.queryPack) as [string, string[]][]).map(([channel, queries]) => (
                      <div key={channel} className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{channel}</p>
                        <div className="space-y-2">
                          {queries.map((q, i) => (
                            <input 
                              key={i}
                              value={q}
                              onChange={(e) => {
                                const newPack = { ...selectedProduct.icpProfile!.queryPack };
                                (newPack as any)[channel][i] = e.target.value;
                                updateICP({ queryPack: newPack });
                              }}
                              className="w-full text-[11px] font-medium text-navy-900 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 outline-none focus:border-gold/30"
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-border p-8 custom-shadow">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Radar size={14} className="text-gold" /> 影子信号包 (Signal Pack)
                  </h3>
                  <div className="space-y-6">
                    {(Object.entries(selectedProduct.icpProfile.signalPack) as [string, string[]][]).map(([type, signals]) => (
                      <div key={type} className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{type}</p>
                        <div className="space-y-2">
                          {signals.map((s, i) => (
                            <input 
                              key={i}
                              value={s}
                              onChange={(e) => {
                                const newPack = { ...selectedProduct.icpProfile!.signalPack };
                                (newPack as any)[type][i] = e.target.value;
                                updateICP({ signalPack: newPack });
                              }}
                              className="w-full text-[11px] font-medium text-navy-900 bg-emerald-50/30 px-3 py-2 rounded-lg border border-emerald-100 outline-none focus:border-gold/30"
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Disqualifiers & Scenarios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-red-50/30 rounded-[2rem] border border-red-100 p-8">
                  <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <AlertTriangle size={14} /> 排除项 (Disqualifiers)
                  </h3>
                  <div className="space-y-2">
                    {selectedProduct.icpProfile.disqualifiers.map((d, i) => (
                      <input 
                        key={i}
                        value={d}
                        onChange={(e) => {
                          const newD = [...selectedProduct.icpProfile!.disqualifiers];
                          newD[i] = e.target.value;
                          updateICP({ disqualifiers: newD });
                        }}
                        className="w-full bg-white/50 border border-red-100 rounded-lg px-3 py-2 text-xs font-bold text-red-700/70 outline-none"
                      />
                    ))}
                  </div>
                </div>
                <div className="bg-emerald-50/30 rounded-[2rem] border border-emerald-100 p-8">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Sparkles size={14} /> 典型应用场景
                  </h3>
                  <div className="space-y-2">
                    {selectedProduct.icpProfile.scenarioPack.map((s, i) => (
                      <input 
                        key={i}
                        value={s}
                        onChange={(e) => {
                          const newS = [...selectedProduct.icpProfile!.scenarioPack];
                          newS[i] = e.target.value;
                          updateICP({ scenarioPack: newS });
                        }}
                        className="w-full bg-white/50 border border-emerald-100 rounded-lg px-3 py-2 text-xs font-bold text-emerald-700/70 outline-none"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductModeling;
