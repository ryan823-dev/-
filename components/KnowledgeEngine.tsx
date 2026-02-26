
import React, { useState, useRef } from 'react';
import { knowledgeCards as initialCards } from '../lib/mock';
// Fixed: Removed the non-existent Type import which was causing a module error.
import { KnowledgeCard } from '../types';
import { 
  FilePlus, 
  AlertCircle, 
  ChevronRight, 
  X, 
  Upload, 
  Loader2, 
  Sparkles, 
  CheckCircle2,
  FileText
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

const KnowledgeEngine: React.FC = () => {
  const [activeTab, setActiveTab] = useState('知识卡台账');
  const [cards, setCards] = useState<KnowledgeCard[]>(initialCards);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processWithAI = async (text: string, sourceName: string) => {
    setIsProcessing(true);
    try {
      // Fixed: Initializing GoogleGenAI correctly with process.env.API_KEY.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `你是一个专业的工业数据分析师。请从以下技术文本中提取关键信息，并将其转化为结构化的知识卡片。
        
文本内容：
${text}

要求：
1. 识别这属于“产品服务 (Offering)”还是“企业画像 (Company)”。
2. 提取至少3个核心字段。
3. 识别可能的缺失字段及其对业务的影响。
4. 返回符合定义的JSON结构。`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ['Offering', 'Company'] },
              title: { type: Type.STRING },
              fields: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.STRING },
                    fieldKey: { type: Type.STRING }
                  },
                  required: ["label", "value", "fieldKey"]
                }
              },
              completion: { type: Type.NUMBER },
              confidence: { type: Type.NUMBER },
              missingFields: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    fieldKey: { type: Type.STRING },
                    label: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    impact: { type: Type.STRING }
                  },
                  required: ["fieldKey", "label"]
                }
              }
            },
            required: ["type", "title", "fields", "completion", "confidence"]
          }
        }
      });

      // Fixed: Directly accessing the .text property from GenerateContentResponse.
      const result = JSON.parse(response.text || '{}');
      
      const newCard: KnowledgeCard = {
        id: `k-${Date.now()}`,
        type: result.type,
        title: result.title,
        fields: result.fields,
        completion: result.completion || 70,
        confidence: result.confidence || 85,
        missingFields: result.missingFields || [],
        evidence: [{ sourceId: `src-${Date.now()}`, sourceName: sourceName }]
      };

      setCards(prev => [newCard, ...prev]);
      setIsPasteModalOpen(false);
      setIsImportModalOpen(false);
      setPastedText('');
      setActiveTab('知识卡台账');
    } catch (error) {
      console.error("AI Processing failed:", error);
      alert("AI 提取失败，请检查文本质量或重试。");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      await processWithAI(text, file.name);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">专业知识引擎</h2>
          <p className="text-slate-500 text-sm">将原始资料消化为结构化知识卡，作为全网内容生成的唯一真值源。</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="px-5 py-2.5 bg-ivory-surface border border-border text-navy-900 rounded-xl text-xs font-bold hover:bg-ivory transition-all flex items-center gap-2"
          >
            <FilePlus size={16} /> 导入资料
          </button>
          <button 
            onClick={() => setIsPasteModalOpen(true)}
            className="px-5 py-2.5 bg-navy-900 text-white rounded-xl text-xs font-bold hover:bg-navy-800 transition-all shadow-sm flex items-center gap-2"
          >
            <FileText size={16} className="text-gold" /> 粘贴技术文本
          </button>
        </div>
      </div>

      <div className="flex border-b border-border gap-8">
        {['资料入口', '知识卡台账', '缺口清单', '同步记录'].map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-bold transition-all relative ${activeTab === tab ? 'text-navy-900' : 'text-slate-400 hover:text-navy-800'}`}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold rounded-full" />}
          </button>
        ))}
      </div>

      {activeTab === '知识卡台账' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {cards.map((card) => (
            <div key={card.id} className="bg-ivory-surface border border-border rounded-2xl p-6 custom-shadow space-y-4 hover:border-gold/30 transition-all group">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    card.type === 'Offering' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-700 border-slate-100'
                  }`}>
                    {card.type === 'Offering' ? '产品服务' : '企业画像'}
                  </span>
                  <h3 className="font-bold text-navy-900">{card.title}</h3>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">置信度</div>
                  <div className="text-sm font-bold text-navy-900 font-mono">{card.confidence}%</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-3 py-4 border-y border-border/50">
                {card.fields.map((f) => (
                  <div key={f.fieldKey} className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold">{f.label}</span>
                    <span className="text-xs text-navy-900 font-medium line-clamp-1">{f.value}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">结构化完整度</span>
                  <span className="text-[10px] font-bold text-navy-900">{card.completion}%</span>
                </div>
                <div className="w-full bg-border/30 h-1 rounded-full overflow-hidden">
                  <div className="bg-gold h-full transition-all duration-1000" style={{ width: `${card.completion}%` }} />
                </div>
              </div>

              {card.missingFields.length > 0 && (
                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 space-y-2">
                  <p className="text-[10px] font-bold text-amber-700 flex items-center gap-1">
                    <AlertCircle size={12} /> 发现 {card.missingFields.length} 个关键缺口
                  </p>
                  {card.missingFields.slice(0, 2).map((mf) => (
                    <div key={mf.fieldKey} className="text-[10px] text-slate-600 flex justify-between items-center">
                      <span>缺失：<span className="font-bold text-navy-900">{mf.label}</span></span>
                      <button className="text-gold font-bold hover:underline">立即补齐</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 flex justify-between items-center">
                <div className="flex items-center gap-2 overflow-hidden">
                   <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">依据资料:</span>
                   {card.evidence.map(e => (
                     <span key={e.sourceId} className="text-[10px] text-navy-900 font-bold underline cursor-pointer truncate max-w-[150px]">{e.sourceName}</span>
                   ))}
                </div>
                <button className="text-xs font-bold text-navy-900 hover:text-navy-800 flex items-center gap-1 transition-all shrink-0">
                  查看详细索引 <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paste Modal */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-ivory-surface w-full max-w-2xl rounded-[2.5rem] border border-border shadow-2xl overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-ivory/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
                   <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-navy-900">粘贴技术文本</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">AI 自动提取结构化数据</p>
                </div>
              </div>
              <button onClick={() => setIsPasteModalOpen(false)} className="p-2 hover:bg-ivory rounded-xl transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            
            <div className="p-8">
              <textarea 
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="在此粘贴产品参数、公司简介或技术说明书片段..."
                className="w-full h-64 bg-white border border-border rounded-2xl p-6 text-sm font-medium outline-none focus:ring-2 focus:ring-gold/20 transition-all resize-none scrollbar-hide"
              />
              <div className="mt-6 flex justify-between items-center">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 italic">
                  <Sparkles size={12} className="text-gold" />
                  由 VertaX AI 引擎处理
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setIsPasteModalOpen(false)} className="px-6 py-2.5 text-xs font-bold text-slate-500 hover:text-navy-900 transition-colors">取消</button>
                  <button 
                    onClick={() => processWithAI(pastedText, "手动粘贴文本")}
                    disabled={!pastedText.trim() || isProcessing}
                    className="bg-navy-900 text-white px-8 py-2.5 rounded-xl text-xs font-bold hover:bg-navy-800 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" size={16} /> : "开始提取"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-ivory-surface w-full max-w-lg rounded-[2.5rem] border border-border shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-ivory/30">
              <h3 className="font-bold text-navy-900">导入技术资料</h3>
              <button onClick={() => setIsImportModalOpen(false)} className="p-2 hover:bg-ivory rounded-xl transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-10 text-center">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-3xl p-12 hover:border-gold/40 hover:bg-ivory/20 transition-all cursor-pointer group"
              >
                <div className="w-16 h-16 bg-ivory rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-gold mx-auto mb-4 transition-colors">
                  <Upload size={32} />
                </div>
                <p className="font-bold text-navy-900">点击或拖拽文件至此处</p>
                <p className="text-xs text-slate-400 mt-2">支持 PDF, TXT, DOCX (当前仅支持文本解析)</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload}
                  className="hidden" 
                  accept=".txt,.pdf,.docx"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy-900/40 backdrop-blur-md">
           <div className="bg-white p-8 rounded-[2rem] shadow-2xl flex flex-col items-center gap-6 border border-gold/20 max-w-xs text-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-gold/10 border-t-gold rounded-full animate-spin" />
                <Sparkles className="absolute inset-0 m-auto text-gold animate-pulse" size={24} />
              </div>
              <div>
                <h4 className="font-bold text-navy-900">正在消化知识...</h4>
                <p className="text-[10px] text-slate-500 font-medium mt-1">正在基于 VertaX 工业 RAG 引擎进行结构化提取与缺口分析</p>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gold h-full w-2/3 animate-[progress_2s_ease-in-out_infinite]" />
              </div>
           </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}} />
    </div>
  );
};

export default KnowledgeEngine;
