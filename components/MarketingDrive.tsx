
import React, { useState } from 'react';
import { knowledgeCards } from '../lib/mock';
// Fixed: Removed the non-existent Type import from ../types
import { ContentAsset, KnowledgeCard } from '../types';
import { 
  Eye, 
  FileEdit, 
  Link2, 
  CheckCircle, 
  MessageSquareQuote, 
  AlertTriangle, 
  RefreshCw, 
  Sparkles, 
  ChevronRight, 
  BookOpen,
  Loader2,
  Plus,
  X
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

interface MarketingDriveProps {
  onNewAssetGenerated?: (asset: ContentAsset) => void;
  assets: ContentAsset[];
}

const MarketingDrive: React.FC<MarketingDriveProps> = ({ onNewAssetGenerated, assets }) => {
  const [selectedAsset, setSelectedAsset] = useState<ContentAsset>(assets[0]);
  const [showCorrection, setShowCorrection] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [contentType, setContentType] = useState('采购指南');

  const toggleCardSelection = (id: string) => {
    setSelectedCardIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCompose = async () => {
    if (selectedCardIds.length === 0) return;
    
    setIsGenerating(true);
    setIsSelectionModalOpen(false);

    try {
      const selectedCards = knowledgeCards.filter(c => selectedCardIds.includes(c.id));
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `你是一个专业的B2B工业内容营销专家。请基于以下知识卡片生成一篇${contentType}。
        
知识源：
${JSON.stringify(selectedCards, null, 2)}

要求：
1. 严禁捏造事实。如果缺少关键参数（如压力、温度、具体认证），请在正文中使用【待补齐：字段名】标注。
2. 识别生成此内容还需要补齐的字段。
3. 返回结构化的JSON，包含标题、正文段落及引用的字段追踪。`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              draftBody: { type: Type.STRING },
              generationTrace: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    paragraph: { type: Type.STRING },
                    refs: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          fieldLabel: { type: Type.STRING },
                          fieldKey: { type: Type.STRING },
                          cardTitle: { type: Type.STRING },
                          sourceName: { type: Type.STRING }
                        },
                        required: ["fieldLabel", "fieldKey", "cardTitle"]
                      }
                    }
                  },
                  required: ["paragraph", "refs"]
                }
              },
              missingInfoNeeded: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    fieldKey: { type: Type.STRING },
                    label: { type: Type.STRING },
                    cardId: { type: Type.STRING }
                  },
                  required: ["fieldKey", "label", "cardId"]
                }
              }
            },
            required: ["title", "draftBody", "generationTrace"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      
      const newAsset: ContentAsset = {
        id: `asset-${Date.now()}`,
        title: result.title,
        category: contentType,
        status: '待确认',
        knowledgeRefs: selectedCardIds,
        keywords: result.keywords || [],
        lastModified: new Date().toISOString().split('T')[0],
        draftBody: result.draftBody,
        generationTrace: result.generationTrace,
        missingInfoNeeded: result.missingInfoNeeded || []
      };

      if (onNewAssetGenerated) {
        onNewAssetGenerated(newAsset);
      }
      setSelectedAsset(newAsset);
      setSelectedCardIds([]);
    } catch (error) {
      console.error("Content generation failed:", error);
      alert("内容生成失败，请稍后重试。");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">营销驱动系统</h2>
          <p className="text-slate-500 text-sm">基于结构化知识库生成高质量内容，并由人工校正完成 AI 进化闭环。</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsSelectionModalOpen(true)}
            disabled={isGenerating}
            className="px-6 py-2.5 bg-navy-900 text-white rounded-xl text-xs font-bold hover:bg-navy-800 transition-all shadow-xl flex items-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} className="text-gold" />}
            一键生成草稿
          </button>
        </div>
      </div>

      <div className="flex border-b border-border gap-8">
        {['内容资产台账', '自动发布排程', 'GEO 增长实验室'].map((tab, i) => (
          <button key={tab} className={`pb-3 text-sm font-bold transition-all relative ${i === 0 ? 'text-navy-900' : 'text-slate-400 hover:text-navy-800'}`}>
            {tab}
            {i === 0 && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold rounded-full" />}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* 左侧列表：资产台账 */}
        <div className="lg:col-span-1 space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">最近资产</p>
          <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-hide">
            {assets.map(asset => (
              <div 
                key={asset.id} 
                onClick={() => setSelectedAsset(asset)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedAsset?.id === asset.id ? 'bg-navy-900 border-navy-800' : 'bg-ivory-surface border-border hover:border-gold/30'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    selectedAsset?.id === asset.id ? 'bg-gold/20 text-gold' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {asset.category}
                  </span>
                  <span className={`text-[8px] font-bold text-slate-400`}>{asset.lastModified}</span>
                </div>
                <h4 className={`text-[11px] font-bold leading-relaxed line-clamp-2 ${
                  selectedAsset?.id === asset.id ? 'text-white' : 'text-navy-900'
                }`}>{asset.title}</h4>
              </div>
            ))}
          </div>
        </div>

        {/* 中间：内容详情与生成痕迹 */}
        <div className="lg:col-span-2 space-y-6">
          {selectedAsset ? (
            <div className="bg-ivory-surface border border-border rounded-3xl overflow-hidden custom-shadow">
              <div className="px-8 py-5 border-b border-border bg-ivory/30 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold bg-navy-900 text-white px-2 py-1 rounded-lg uppercase tracking-wider">{selectedAsset.category}</span>
                  <h3 className="font-bold text-navy-900">{selectedAsset.title}</h3>
                </div>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase border ${
                  selectedAsset.status === '待确认' ? 'text-warning bg-amber-50 border-amber-100' : 'text-navy-900 bg-slate-50 border-slate-200'
                }`}>
                  {selectedAsset.status}
                </span>
              </div>
              
              <div className="p-8 space-y-6 min-h-[400px]">
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedAsset.keywords.map(kw => (
                    <span key={kw} className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded italic">#{kw}</span>
                  ))}
                </div>

                <div className="prose prose-sm max-w-none text-navy-900 leading-relaxed font-medium opacity-80 whitespace-pre-wrap">
                  {selectedAsset.draftBody ? (
                    selectedAsset.draftBody.split('\n\n').map((p, i) => {
                      const hasPlaceholder = p.includes('【待补齐');
                      return (
                        <p key={i} className={hasPlaceholder ? "bg-amber-50 p-3 rounded-xl border border-amber-100 mb-4" : "mb-4"}>
                          {p.split(/(【待补齐：.*?】)/).map((part, idx) => 
                            part.startsWith('【待补齐') 
                              ? <span key={idx} className="text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-100 animate-pulse">{part}</span>
                              : part
                          )}
                        </p>
                      );
                    })
                  ) : "内容正在生成中..."}
                </div>

                {selectedAsset.generationTrace && selectedAsset.generationTrace.length > 0 && (
                  <div className="pt-8 border-t border-border/50">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <BookOpen size={14} /> 知识引用追踪 (Grounding Trace)
                    </h4>
                    <div className="space-y-4">
                      {selectedAsset.generationTrace.map((t, idx) => (
                        <div key={idx} className="bg-ivory p-4 rounded-2xl border border-border/40 text-[11px] space-y-2">
                          <p className="text-slate-500 font-bold italic">段落 {idx + 1} 引用来源：</p>
                          <div className="flex flex-wrap gap-2">
                            {t.refs.map((r, ridx) => (
                              <div key={ridx} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-border rounded-lg shadow-sm">
                                 <span className="font-bold text-navy-900">{r.fieldLabel}</span>
                                 <span className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">来自</span>
                                 <span className="text-gold font-bold">{r.cardTitle}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-border flex justify-end gap-3">
                <button 
                  onClick={() => setShowCorrection(!showCorrection)}
                  className="px-6 py-2.5 bg-ivory-surface border border-border text-navy-900 rounded-xl text-xs font-bold hover:bg-ivory transition-all flex items-center gap-2"
                >
                  <MessageSquareQuote size={16} /> 结构化校正
                </button>
                <button className="px-6 py-2.5 bg-navy-900 text-white rounded-xl text-xs font-bold hover:bg-navy-800 transition-all">
                  确认定稿并排期发布
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-20 bg-ivory-surface border border-dashed border-border rounded-[3rem] text-center">
              <Sparkles size={48} className="text-gold/20 mb-4" />
              <p className="text-navy-900 font-bold">暂无选定资产</p>
              <p className="text-xs text-slate-500 mt-2">点击“一键生成草稿”开启 AI 营销引擎</p>
            </div>
          )}
        </div>

        {/* 右侧：操作区与引用卡 */}
        <div className="lg:col-span-1 space-y-6">
          {showCorrection ? (
             <div className="bg-white border-2 border-gold rounded-3xl p-6 shadow-2xl space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
               <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
                 <FileEdit size={18} className="text-gold" /> 客户校正面板
               </h3>
               <div className="space-y-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase">整体评价</label>
                   <div className="flex gap-2">
                     {['准确', '有误'].map(v => (
                       <button key={v} className="flex-1 py-1.5 border border-border rounded-lg text-xs font-bold hover:bg-gold hover:text-white transition-all">{v}</button>
                     ))}
                   </div>
                 </div>
                 <textarea 
                   placeholder="请输入修改建议，这些建议将被 AI 引擎吸收并反映在后续生成中..."
                   className="w-full bg-ivory border border-border rounded-xl px-3 py-3 text-xs font-medium outline-none min-h-[100px] resize-none"
                 ></textarea>
               </div>
               <button className="w-full py-3 bg-navy-900 text-white rounded-2xl text-xs font-bold hover:bg-navy-800 transition-all">提交校对结果</button>
             </div>
          ) : selectedAsset && (
            <>
              <div className="bg-navy-900 p-6 rounded-3xl text-white custom-shadow">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gold mb-6">已关联知识节点</h3>
                <div className="space-y-4">
                  {selectedAsset.knowledgeRefs.map(refId => {
                    const card = knowledgeCards.find(k => k.id === refId);
                    return (
                      <div key={refId} className="p-3 bg-navy-800/50 border border-navy-700 rounded-2xl flex items-center justify-between group cursor-pointer hover:border-gold/50 transition-all">
                        <div className="flex items-center gap-3">
                          <Link2 size={14} className="text-gold" />
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-slate-200 truncate">{card?.title}</p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase">{card?.type === 'Offering' ? '产品' : '企业'}</p>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedAsset.missingInfoNeeded && selectedAsset.missingInfoNeeded.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 space-y-4 shadow-sm shadow-amber-100/50">
                   <h3 className="text-[10px] font-bold text-amber-700 uppercase tracking-widest flex items-center gap-2">
                     <AlertTriangle size={14} /> 核心资料缺口识别
                   </h3>
                   <div className="space-y-3">
                     {selectedAsset.missingInfoNeeded.map(mi => (
                       <div key={mi.fieldKey} className="flex flex-col gap-1 p-2 bg-white/50 border border-amber-100 rounded-xl">
                          <p className="text-[11px] font-bold text-navy-900">缺失：{mi.label}</p>
                          <p className="text-[9px] text-slate-500">此缺口已同步至“待你决策”面板</p>
                       </div>
                     ))}
                   </div>
                   <button className="w-full py-3 bg-white border border-amber-200 rounded-2xl text-xs font-bold text-amber-700 hover:bg-amber-100 transition-all flex items-center justify-center gap-2">
                     <RefreshCw size={14} /> 返回智库补齐并重写
                   </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Selection Modal */}
      {isSelectionModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="bg-ivory-surface w-full max-w-2xl rounded-[3rem] border border-border shadow-2xl overflow-hidden flex flex-col">
              <div className="px-10 py-8 border-b border-border flex justify-between items-center bg-ivory/30">
                 <div>
                   <h3 className="text-xl font-bold text-navy-900">配置生成任务</h3>
                   <p className="text-xs text-slate-500 font-medium">选择目标内容类型与所需知识源</p>
                 </div>
                 <button onClick={() => setIsSelectionModalOpen(false)} className="p-2 hover:bg-white rounded-2xl transition-all">
                   <X size={24} className="text-slate-400" />
                 </button>
              </div>
              
              <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto scrollbar-hide">
                 <div className="space-y-4">
                   <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">1. 选择内容体裁</h4>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                     {['采购指南', '白皮书', '技术案例', 'FAQ问答'].map(type => (
                       <button 
                        key={type}
                        onClick={() => setContentType(type)}
                        className={`py-3 rounded-2xl text-xs font-bold border transition-all ${
                          contentType === type ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-navy-900 border-border hover:border-gold/50'
                        }`}
                       >
                         {type}
                       </button>
                     ))}
                   </div>
                 </div>

                 <div className="space-y-4">
                   <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">2. 勾选关联知识卡 ({selectedCardIds.length})</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {knowledgeCards.map(card => (
                       <div 
                        key={card.id}
                        onClick={() => toggleCardSelection(card.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          selectedCardIds.includes(card.id) ? 'bg-gold/10 border-gold' : 'bg-white border-border hover:border-gold/30'
                        }`}
                       >
                         <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${card.type === 'Offering' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'}`}>
                               {card.type === 'Offering' ? <Sparkles size={16} /> : <Link2 size={16} />}
                            </div>
                            <div>
                               <p className="text-xs font-bold text-navy-900">{card.title}</p>
                               <p className="text-[10px] text-slate-500">完整度: {card.completion}%</p>
                            </div>
                         </div>
                         <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                           selectedCardIds.includes(card.id) ? 'bg-gold border-gold text-white' : 'border-border bg-slate-50'
                         }`}>
                           {selectedCardIds.includes(card.id) && <CheckCircle size={14} />}
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
              </div>

              <div className="p-10 bg-ivory/50 border-t border-border flex justify-end gap-4">
                 <button onClick={() => setIsSelectionModalOpen(false)} className="px-8 py-3 text-sm font-bold text-slate-500">取消</button>
                 <button 
                  disabled={selectedCardIds.length === 0}
                  onClick={handleCompose}
                  className="bg-navy-900 text-white px-10 py-3 rounded-2xl text-sm font-bold shadow-xl flex items-center gap-2 hover:bg-navy-800 disabled:opacity-50 transition-all"
                 >
                   开始由 AI 创作 <ChevronRight size={18} />
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MarketingDrive;
