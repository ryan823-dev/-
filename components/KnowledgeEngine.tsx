import React, { useState, useRef, useCallback, useEffect } from 'react';
import { knowledgeCards as initialCards } from '../lib/mock';
import { KnowledgeCard } from '../types';
import { NavItem } from '../types';
import { useToast } from './Toast';
import { 
  FilePlus, 
  AlertCircle, 
  ChevronRight, 
  X, 
  Upload, 
  Loader2, 
  Sparkles, 
  CheckCircle2,
  FileText,
  Link as LinkIcon,
  File,
  FileSpreadsheet,
  Presentation,
  Archive,
  Image,
  Globe,
  Clock,
  BarChart3,
  AlertTriangle,
  Trash2,
  Eye,
  Layers,
  Database,
  Zap,
  ArrowRight,
  FolderOpen,
  FileType,
  FileCode,
  FileJson,
  FileArchive,
  ClipboardPaste,
  ExternalLink,
  TrendingUp,
  Target,
  PieChart,
  Compass,
  Award,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  ShieldCheck,
  Store,
  Rocket,
  Search,
  Globe2,
  Users,
  Trophy,
  BookOpen
} from 'lucide-react';

// 支持的文件格�?
const SUPPORTED_FORMATS = {
  documents: {
    label: '文档',
    extensions: ['.pdf', '.docx', '.doc', '.txt', '.rtf', '.odt'],
    icon: FileText,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    accept: '.pdf,.docx,.doc,.txt,.rtf,.odt'
  },
  presentations: {
    label: '演示文稿',
    extensions: ['.pptx', '.ppt', '.odp'],
    icon: Presentation,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    accept: '.pptx,.ppt,.odp'
  },
  spreadsheets: {
    label: '表格',
    extensions: ['.xlsx', '.xls', '.csv', '.ods'],
    icon: FileSpreadsheet,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    accept: '.xlsx,.xls,.csv,.ods'
  },
  markup: {
    label: '标记文件',
    extensions: ['.md', '.html', '.xml', '.json'],
    icon: FileCode,
    color: 'text-violet-500',
    bgColor: 'bg-violet-50',
    accept: '.md,.html,.xml,.json'
  },
  archives: {
    label: '压缩包',
    extensions: ['.zip', '.rar', '.7z', '.tar.gz'],
    icon: Archive,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    accept: '.zip,.rar,.7z,.tar.gz,.tgz'
  },
  images: {
    label: '图片',
    extensions: ['.png', '.jpg', '.jpeg', '.webp'],
    icon: Image,
    color: 'text-pink-500',
    bgColor: 'bg-pink-50',
    accept: '.png,.jpg,.jpeg,.webp'
  }
};

const ALL_ACCEPT = Object.values(SUPPORTED_FORMATS).map(f => f.accept).join(',');

// 根据文件扩展名获取图�?
const getFileIcon = (filename: string) => {
  const ext = '.' + filename.split('.').pop()?.toLowerCase();
  for (const [_, format] of Object.entries(SUPPORTED_FORMATS)) {
    if (format.extensions.includes(ext)) {
      return { Icon: format.icon, color: format.color, bgColor: format.bgColor };
    }
  }
  return { Icon: File, color: 'text-slate-400', bgColor: 'bg-slate-50' };
};

// 知识源接�?
interface KnowledgeSource {
  id: string;
  name: string;
  type: 'file' | 'text' | 'url';
  format?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  cardIds: string[];
  error?: string;
}

// 出海画像接口
interface ExportStrategy {
  productNameCN: string;
  productNameEN: string;
  internationalTerms: string[];
  industryCategory: string;
  hsCode?: string;
  marketPositioning: {
    suggestedPosition: string;
    reasoning: string;
    targetRegions?: string[];
  };
  competitorAnalysis: Array<{
    name: string;
    country: string;
    strengths?: string[];
    priceRange?: string;
    website?: string;
  }>;
  certifications: {
    required: Array<{
      name: string;
      region: string;
      importance: string;
      estimatedTime?: string;
      estimatedCost?: string;
    }>;
    current: string[];
    gaps: string[];
  };
  channels: Array<{
    name: string;
    type: string;
    region?: string;
    priority: string;
    notes?: string;
    website?: string;
  }>;
  exhibitions: Array<{
    name: string;
    location: string;
    timing?: string;
    relevance?: string;
    website?: string;
  }>;
  trends: Array<{
    trend: string;
    impact: string;
    opportunity?: string;
    source?: string;
  }>;
  differentiationStrategy: {
    uniqueSellingPoints: string[];
    priceAdvantage?: string;
    customizationCapability?: string;
    suggestedApproach: string;
  };
  actionItems: Array<{
    action: string;
    priority: string;
    category: string;
    deadline?: string;
  }>;
  researchedAt: string;
}

interface ResearchStage {
  name: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
  error?: string;
}

interface KnowledgeEngineProps {
  onNavigate?: (item: NavItem) => void;
}

const KnowledgeEngine: React.FC<KnowledgeEngineProps> = ({ onNavigate }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'sources' | 'cards' | 'gaps' | 'export'>('sources');
  
  // Restore persisted state from localStorage
  const [cards, setCards] = useState<KnowledgeCard[]>(() => {
    try { const s = localStorage.getItem('vtx_ke_cards'); return s ? JSON.parse(s) : initialCards; } catch { return initialCards; }
  });
  const [sources, setSources] = useState<KnowledgeSource[]>(() => {
    try { const s = localStorage.getItem('vtx_ke_sources'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [exportStrategy, setExportStrategy] = useState<ExportStrategy | null>(() => {
    try {
      const s = localStorage.getItem('vtx_ke_export');
      if (!s) return null;
      const data = JSON.parse(s);
      // Auto-clean: strip B2B platform references from cached data
      const B2B_BLACKLIST = new RegExp('阿里巴巴|alibaba|made-in-china|global\\s*sources|中国制造网|DHgate|1688', 'i');
      if (data.actionItems) {
        data.actionItems = data.actionItems.filter((item: any) => !B2B_BLACKLIST.test(item.action || ''));
      }
      if (data.channels) {
        data.channels = data.channels.filter((ch: any) => !B2B_BLACKLIST.test(ch.name || ''));
      }
      return data;
    } catch { return null; }
  });
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [researchStages, setResearchStages] = useState<ResearchStage[]>([]);
  const [selectedCard, setSelectedCard] = useState<KnowledgeCard | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist state changes to localStorage
  useEffect(() => { try { localStorage.setItem('vtx_ke_cards', JSON.stringify(cards)); } catch {} }, [cards]);
  useEffect(() => { try { localStorage.setItem('vtx_ke_sources', JSON.stringify(sources)); } catch {} }, [sources]);
  useEffect(() => { try { localStorage.setItem('vtx_ke_export', JSON.stringify(exportStrategy)); } catch {} }, [exportStrategy]);

  // 统计数据
  const stats = {
    totalSources: sources.length,
    totalCards: cards.length,
    companyCards: cards.filter(c => c.type === 'Company').length,
    offeringCards: cards.filter(c => c.type === 'Offering').length,
    proofCards: cards.filter(c => c.type === 'Proof').length,
    totalGaps: cards.reduce((sum, c) => sum + c.missingFields.length, 0),
    avgCompletion: cards.length > 0 
      ? Math.round(cards.reduce((sum, c) => sum + c.completion, 0) / cards.length) 
      : 0,
    processingCount: sources.filter(s => s.status === 'processing').length,
    completedCount: sources.filter(s => s.status === 'completed').length
  };

  // 汇总所有缺口并按优先级排序
  const allGaps = cards.flatMap(card => 
    card.missingFields.map(mf => ({
      ...mf,
      cardId: card.id,
      cardTitle: card.title,
      cardType: card.type,
      priority: mf.impact?.includes('阻塞') || mf.impact?.includes('block') ? 'P0' : 
                mf.impact?.includes('影响') || mf.impact?.includes('affect') ? 'P1' : 'P2'
    }))
  ).sort((a, b) => a.priority.localeCompare(b.priority));

  const processWithAI = async (text: string, sourceName: string, sourceType: 'file' | 'text' | 'url' = 'text') => {
    const sourceId = `src-${Date.now()}`;
    const newSource: KnowledgeSource = {
      id: sourceId,
      name: sourceName,
      type: sourceType,
      status: 'processing',
      createdAt: new Date(),
      cardIds: []
    };
    
    setSources(prev => [newSource, ...prev]);
    setIsProcessing(true);

    try {
      const res = await fetch('/api/knowledge/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sourceName })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '提取失败' }));
        throw new Error(err.details || err.error || 'AI 提取失败');
      }

      const result = await res.json();
      
      const newCard: KnowledgeCard = {
        id: result.id || `k-${Date.now()}`,
        type: result.type,
        title: result.title,
        fields: result.fields,
        completion: result.completion || 70,
        confidence: result.confidence || 85,
        missingFields: result.missingFields || [],
        evidence: result.evidence || [{ sourceId, sourceName }]
      };

      setCards(prev => [newCard, ...prev]);
      setSources(prev => prev.map(s => 
        s.id === sourceId 
          ? { ...s, status: 'completed', cardIds: [newCard.id] }
          : s
      ));
      
      setIsPasteModalOpen(false);
      setIsUrlModalOpen(false);
      setPastedText('');
      setUrlInput('');
      setActiveTab('cards');
      toast.success('提取完成', `已生成知识要点：${newCard.title}`);
    } catch (error: any) {
      console.error("AI 处理失败:", error);
      setSources(prev => prev.map(s => 
        s.id === sourceId 
          ? { ...s, status: 'failed', error: error.message }
          : s
      ));
      toast.error('提取失败', error.message || '请检查内容后重试');
    } finally {
      setIsProcessing(false);
    }
  };

  // 智能产品调研 - 多阶段分解编排
  const startProductResearch = async () => {
    const offeringCards = cards.filter(c => c.type === 'Offering');
    if (offeringCards.length === 0) {
      toast.error('需要产品信息', '请先上传产品相关资料，再进行出海调研');
      return;
    }

    const productCard = offeringCards[0];
    const productName = productCard.title || productCard.fields.find(f => f.fieldKey === 'productName')?.value || '未知产品';
    const productDesc = productCard.fields.map(f => `${f.label}: ${f.value}`).join('\n');
    const existingCerts = cards.flatMap(c => c.fields).filter(f => f.fieldKey?.includes('cert') || f.label?.includes('认证')).map(f => f.value);
    const targetMarkets = ['Europe', 'North America', 'Southeast Asia'];

    const stages: ResearchStage[] = [
      { name: 'terminology', label: '产品术语翻译', status: 'pending' },
      { name: 'competitors', label: '竞争格局分析', status: 'pending' },
      { name: 'certifications', label: '认证要求调研', status: 'pending' },
      { name: 'channels', label: '销售渠道分析', status: 'pending' },
      { name: 'exhibitions', label: '行业展会搜索', status: 'pending' },
      { name: 'trends', label: '市场趋势分析', status: 'pending' },
      { name: 'strategy', label: '出口策略生成', status: 'pending' },
    ];
    setResearchStages(stages);
    setIsResearching(true);

    const updateStage = (name: string, update: Partial<ResearchStage>) => {
      setResearchStages(prev => prev.map(s => s.name === name ? { ...s, ...update } : s));
    };

    let geminiAvailable = true;
    const skipParam = () => geminiAvailable ? '' : '?skipGemini=true';

    const callStage = async (name: string, body: any) => {
      updateStage(name, { status: 'running' });
      try {
        const res = await fetch(`/api/knowledge/research/${name}${skipParam()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).details || 'Stage failed');
        const result = await res.json();
        if (result.geminiAvailable === false) geminiAvailable = false;
        updateStage(name, { status: 'done' });
        return result.data;
      } catch (e: any) {
        updateStage(name, { status: 'error', error: e.message });
        return null;
      }
    };

    try {
      // Stage 1: Terminology (sequential - needed by subsequent stages)
      const terminology = await callStage('terminology', { productName, productDescription: productDesc });
      if (!terminology?.productNameEN) {
        toast.error('调研失败', '产品术语翻译失败，请重试');
        setIsResearching(false);
        return;
      }

      const enName = terminology.productNameEN;
      const altTerms = terminology.alternativeTerms || [];
      const category = terminology.industryCategory || '';

      // Stages 2-6: Parallel execution
      const parallelResults = await Promise.allSettled([
        callStage('competitors', { productNameEN: enName, alternativeTerms: altTerms }),
        callStage('certifications', { productNameEN: enName, targetMarkets }),
        callStage('channels', { productNameEN: enName, industryCategory: category }),
        callStage('exhibitions', { productNameEN: enName, industryCategory: category }),
        callStage('trends', { productNameEN: enName, industryCategory: category }),
      ]);
      const [competitors, certifications, channels, exhibitions, trends] = parallelResults.map(r => r.status === 'fulfilled' ? r.value : null);

      // Stage 7: Strategy synthesis
      const strategy = await callStage('strategy', {
        productName, productNameEN: enName,
        competitors: competitors || [], certifications: certifications || [],
        channels: channels || [], trends: trends || [],
        existingCertifications: existingCerts
      });

      // Assemble final ExportStrategy
      const assembled: ExportStrategy = {
        productNameCN: productName,
        productNameEN: enName,
        internationalTerms: altTerms,
        industryCategory: category,
        hsCode: terminology.hsCode,
        marketPositioning: strategy?.marketPositioning || { suggestedPosition: '专业制造商', reasoning: '' },
        competitorAnalysis: competitors || [],
        certifications: {
          required: certifications || [],
          current: existingCerts,
          gaps: (certifications || []).filter((c: any) => c.importance === '必备' || c.importance === 'Mandatory').filter((c: any) => !existingCerts.includes(c.name)).map((c: any) => c.name)
        },
        channels: channels || [],
        exhibitions: exhibitions || [],
        trends: trends || [],
        differentiationStrategy: strategy?.differentiationStrategy || { uniqueSellingPoints: [], suggestedApproach: '' },
        actionItems: strategy?.actionItems || [],
        researchedAt: new Date().toISOString()
      };

      setExportStrategy(assembled);
      setActiveTab('export');
      const doneCount = [terminology, competitors, certifications, channels, exhibitions, trends, strategy].filter(Boolean).length;
      toast.success('调研完成', `出海策略已生成 (${doneCount}/7 阶段完成)`);
    } catch (error: any) {
      console.error('产品调研失败:', error);
      toast.error('调研失败', error.message || '请稍后重试');
    } finally {
      setIsResearching(false);
    }
  };

    const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const format = Object.entries(SUPPORTED_FORMATS).find(([_, v]) => 
        v.extensions.includes(ext)
      )?.[0] || 'unknown';

      if (['.txt', '.md', '.html', '.xml', '.json', '.csv'].includes(ext)) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const text = event.target?.result as string;
          await processWithAI(text, file.name, 'file');
        };
        reader.readAsText(file);
      } else if (['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt', '.zip'].includes(ext)) {
        const sourceId = `src-${Date.now()}-${file.name}`;
        setSources(prev => [{
          id: sourceId,
          name: file.name,
          type: 'file',
          format,
          status: 'processing',
          createdAt: new Date(),
          cardIds: []
        }, ...prev]);
        setIsProcessing(true);

        try {
          const formData = new FormData();
          formData.append('file', file);
          
          const parseRes = await fetch('/api/knowledge/parse-document', {
            method: 'POST',
            body: formData
          });

          if (!parseRes.ok) {
            const err = await parseRes.json().catch(() => ({ error: '解析失败' }));
            throw new Error(err.details || err.error || '文档解析失败');
          }

          const parseResult = await parseRes.json();
          
          if (!parseResult.text || parseResult.text.trim().length === 0) {
            throw new Error('未能从文档中提取到文本内容');
          }

          const extractRes = await fetch('/api/knowledge/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: parseResult.text, sourceName: file.name })
          });

          if (!extractRes.ok) {
            const err = await extractRes.json().catch(() => ({ error: '提取失败' }));
            throw new Error(err.details || err.error || 'AI 提取失败');
          }

          const result = await extractRes.json();
          
          const newCard: KnowledgeCard = {
            id: result.id || `k-${Date.now()}`,
            type: result.type,
            title: result.title,
            fields: result.fields,
            completion: result.completion || 70,
            confidence: result.confidence || 85,
            missingFields: result.missingFields || [],
            evidence: result.evidence || [{ sourceId, sourceName: file.name }]
          };

          setCards(prev => [newCard, ...prev]);
          setSources(prev => prev.map(s => 
            s.id === sourceId 
              ? { ...s, status: 'completed', cardIds: [newCard.id] }
              : s
          ));
          
          setActiveTab('cards');
          toast.success('处理完成', `已生成知识要点：${newCard.title}`);
        } catch (error: any) {
          console.error("文档处理失败:", error);
          setSources(prev => prev.map(s => 
            s.id === sourceId 
              ? { ...s, status: 'failed', error: error.message }
              : s
          ));
          toast.error('处理失败', error.message || '请检查文档格式后重试');
        } finally {
          setIsProcessing(false);
        }
      } else {
        const sourceId = `src-${Date.now()}-${file.name}`;
        setSources(prev => [{
          id: sourceId,
          name: file.name,
          type: 'file',
          format,
          status: 'failed',
          createdAt: new Date(),
          cardIds: [],
          error: `暂不支持 ${ext} 格式`
        }, ...prev]);
        toast.error('格式不支持', `${file.name} - 暂不支持 ${ext} 格式`);
      }
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleUrlFetch = async () => {
    if (!urlInput.trim()) return;
    
    const sourceId = `src-${Date.now()}-url`;
    const sourceName = urlInput;
    
    setSources(prev => [{
      id: sourceId,
      name: sourceName,
      type: 'url',
      status: 'processing',
      createdAt: new Date(),
      cardIds: []
    }, ...prev]);
    setIsProcessing(true);
    setIsUrlModalOpen(false);

    try {
      const fetchRes = await fetch('/api/knowledge/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput })
      });

      if (!fetchRes.ok) {
        const err = await fetchRes.json().catch(() => ({ error: '抓取失败' }));
        throw new Error(err.details || err.error || '网页抓取失败');
      }

      const fetchResult = await fetchRes.json();
      
      const extractRes = await fetch('/api/knowledge/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: fetchResult.text, 
          sourceName: fetchResult.title || urlInput 
        })
      });

      if (!extractRes.ok) {
        const err = await extractRes.json().catch(() => ({ error: '提取失败' }));
        throw new Error(err.details || err.error || 'AI 提取失败');
      }

      const result = await extractRes.json();
      
      const newCard: KnowledgeCard = {
        id: result.id || `k-${Date.now()}`,
        type: result.type,
        title: result.title,
        fields: result.fields,
        completion: result.completion || 70,
        confidence: result.confidence || 85,
        missingFields: result.missingFields || [],
        evidence: result.evidence || [{ sourceId, sourceName: fetchResult.title || urlInput }]
      };

      setCards(prev => [newCard, ...prev]);
      setSources(prev => prev.map(s => 
        s.id === sourceId 
          ? { ...s, name: fetchResult.title || urlInput, status: 'completed', cardIds: [newCard.id] }
          : s
      ));
      
      setUrlInput('');
      setActiveTab('cards');
      toast.success('处理完成', `已生成知识要点：${newCard.title}`);
    } catch (error: any) {
      console.error("URL 处理失败:", error);
      setSources(prev => prev.map(s => 
        s.id === sourceId 
          ? { ...s, status: 'failed', error: error.message }
          : s
      ));
      toast.error('抓取失败', error.message || '请检查网址后重试');
    } finally {
      setIsProcessing(false);
      setUrlInput('');
    }
  };

  const removeSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
  };

  // 是否为空状�?
  const isEmpty = sources.length === 0 && cards.length === 0;

  // 三种输入方式
  const inputMethods = [
    {
      id: 'upload',
      icon: Upload,
      title: '上传文件',
      description: '拖拽文件至此，或点击上传',
      formats: '支持 PDF、Word、PPT、Excel、Markdown 等',
      gradient: 'from-blue-500 to-cyan-400',
      lightBg: 'bg-blue-50',
      onClick: () => fileInputRef.current?.click()
    },
    {
      id: 'paste',
      icon: ClipboardPaste,
      title: '粘贴内容',
      description: '粘贴产品介绍、技术参数等文字',
      formats: '直接粘贴任意文本内容',
      gradient: 'from-violet-500 to-purple-400',
      lightBg: 'bg-violet-50',
      onClick: () => setIsPasteModalOpen(true)
    },
    {
      id: 'url',
      icon: Globe,
      title: '网页提取',
      description: '从网页自动提取内容',
      formats: '官网、产品页、新闻稿等',
      gradient: 'from-emerald-500 to-teal-400',
      lightBg: 'bg-emerald-50',
      onClick: () => setIsUrlModalOpen(true)
    }
  ];

  return (
    <div className="space-y-6 relative">
      {/* ============ 空状态 - 引导上传 ============ */}
      {isEmpty && (
        <div className="animate-in fade-in duration-500">
          {/* 标题区 */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 rounded-full mb-6">
              <Sparkles size={16} className="text-gold" />
              <span className="text-xs font-bold text-gold uppercase tracking-wider">AI 智能提取</span>
            </div>
            <h1 className="text-3xl font-bold text-navy-900 mb-3">
              专业<span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-amber-500">知识库</span>
            </h1>
            <p className="text-slate-500 max-w-xl mx-auto">
              上传企业资料，AI 自动提炼核心信息，为海外营销内容提供素材支撑
            </p>
          </div>

          {/* 三种输入方式 */}
          <div 
            className={`grid grid-cols-3 gap-5 mb-8 transition-all duration-300 ${isDragOver ? 'scale-[1.02]' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {inputMethods.map((method) => (
              <button
                key={method.id}
                onClick={method.onClick}
                className={`group relative bg-white rounded-[1.5rem] border-2 transition-all duration-300 overflow-hidden ${
                  isDragOver && method.id === 'upload' 
                    ? 'border-gold shadow-xl shadow-gold/20 scale-105' 
                    : 'border-border hover:border-gold/40 hover:shadow-lg'
                }`}
              >
                <div className={`h-1.5 bg-gradient-to-r ${method.gradient}`} />
                
                <div className="p-8">
                  <div className={`w-16 h-16 ${method.lightBg} rounded-2xl flex items-center justify-center mb-5 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                    <method.icon size={28} className={`bg-gradient-to-r ${method.gradient} bg-clip-text`} style={{ color: method.gradient.includes('blue') ? '#3b82f6' : method.gradient.includes('violet') ? '#8b5cf6' : '#10b981' }} />
                  </div>
                  
                  <h3 className="font-bold text-navy-900 text-lg mb-2">{method.title}</h3>
                  <p className="text-sm text-slate-500 mb-4">{method.description}</p>
                  
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg">
                    <FileType size={12} className="text-slate-400" />
                    <span className="text-[10px] text-slate-500 font-medium">{method.formats}</span>
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight size={20} className="text-gold" />
                </div>
              </button>
            ))}
          </div>

          {/* 支持的格式 */}
          <div className="bg-ivory/50 rounded-2xl p-6 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Database size={16} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">支持的文件格式</span>
            </div>
            <div className="grid grid-cols-6 gap-3">
              {Object.entries(SUPPORTED_FORMATS).map(([key, format]) => (
                <div key={key} className="bg-white rounded-xl p-3 border border-border hover:border-gold/30 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 ${format.bgColor} rounded-lg flex items-center justify-center`}>
                      <format.icon size={16} className={format.color} />
                    </div>
                    <span className="text-xs font-bold text-navy-900">{format.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {format.extensions.slice(0, 3).map(ext => (
                      <span key={ext} className="text-[9px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-mono">{ext}</span>
                    ))}
                    {format.extensions.length > 3 && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-400">+{format.extensions.length - 3}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 流程说明 */}
          <div className="mt-8 flex items-center justify-center gap-8 text-center">
            {[
              { step: '1', label: '上传资料', desc: '产品/公司/案例' },
              { step: '2', label: 'AI 提取', desc: '自动整理要点' },
              { step: '3', label: '生成内容', desc: '海外营销素材' }
            ].map((item, i) => (
              <React.Fragment key={item.step}>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-amber-500 text-white font-bold flex items-center justify-center mb-2 text-sm">
                    {item.step}
                  </div>
                  <p className="font-bold text-navy-900 text-sm">{item.label}</p>
                  <p className="text-[10px] text-slate-400">{item.desc}</p>
                </div>
                {i < 2 && <ArrowRight size={20} className="text-slate-300 mt-[-20px]" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* ============ 有数据状态 ============ */}
      {!isEmpty && (
        <>
          {/* 标题区 */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-navy-900 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center">
                  <Database size={20} className="text-white" />
                </div>
                专业知识库
              </h2>
              <p className="text-slate-500 text-sm mt-2 ml-[52px]">
                上传企业资料，AI 自动提炼核心信息，为海外营销内容提供素材支撑
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 bg-white border border-border text-navy-900 rounded-xl text-xs font-bold hover:bg-ivory hover:border-gold/30 transition-all flex items-center gap-2 shadow-sm"
              >
                <Upload size={14} /> 上传文件
              </button>
              <button 
                onClick={() => setIsPasteModalOpen(true)}
                className="px-5 py-2.5 bg-white border border-border text-navy-900 rounded-xl text-xs font-bold hover:bg-ivory hover:border-gold/30 transition-all flex items-center gap-2 shadow-sm"
              >
                <ClipboardPaste size={14} /> 粘贴内容
              </button>
              <button 
                onClick={() => setIsUrlModalOpen(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-navy-900 to-navy-800 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Globe size={14} className="text-gold" /> 网页提取
              </button>
            </div>
          </div>

          {/* 统计仪表板 - 可点击的功能入口 */}
          <div className="grid grid-cols-4 gap-5 animate-in fade-in duration-300">
            {/* 已录入资料 - 点击跳转资料清单 */}
            <button 
              onClick={() => setActiveTab('sources')}
              className={`group relative bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-0.5 text-left ${
                activeTab === 'sources' ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200/60'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <FolderOpen size={20} className="text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    {stats.processingCount > 0 && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-full">
                        <Loader2 size={10} className="text-blue-500 animate-spin" />
                        <span className="text-[10px] font-semibold text-blue-600">{stats.processingCount}</span>
                      </div>
                    )}
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[32px] font-bold text-slate-800 tracking-tight leading-none">{stats.totalSources}</p>
                  <p className="text-[13px] text-slate-500 font-medium group-hover:text-blue-600 transition-colors">已录入资料</p>
                </div>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-400 transition-transform duration-300 origin-left ${
                activeTab === 'sources' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
              }`} />
            </button>

            {/* 知识要点 - 点击跳转知识要点 */}
            <button 
              onClick={() => setActiveTab('cards')}
              className={`group relative bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-0.5 text-left ${
                activeTab === 'cards' ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-slate-200/60'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                    <Layers size={20} className="text-white" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {stats.offeringCards > 0 && (
                      <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">产品 {stats.offeringCards}</span>
                    )}
                    {stats.proofCards > 0 && (
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">案例 {stats.proofCards}</span>
                    )}
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[32px] font-bold text-slate-800 tracking-tight leading-none">{stats.totalCards}</p>
                  <p className="text-[13px] text-slate-500 font-medium group-hover:text-emerald-600 transition-colors">知识要点</p>
                </div>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-400 transition-transform duration-300 origin-left ${
                activeTab === 'cards' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
              }`} />
            </button>

            {/* 待补充项 - 点击跳转待补充 */}
            <button 
              onClick={() => setActiveTab('gaps')}
              className={`group relative bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-0.5 text-left ${
                activeTab === 'gaps' ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200/60'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stats.totalGaps > 0 ? 'from-amber-500/[0.03]' : 'from-emerald-500/[0.03]'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg ${
                    stats.totalGaps > 0 
                      ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/25' 
                      : 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/25'
                  }`}>
                    {stats.totalGaps > 0 ? (
                      <AlertTriangle size={20} className="text-white" />
                    ) : (
                      <CheckCircle2 size={20} className="text-white" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {stats.totalGaps > 0 && (
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-100 rounded-full">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-semibold text-red-600">P0 {allGaps.filter(g => g.priority === 'P0').length}</span>
                      </div>
                    )}
                    <ChevronRight size={16} className={`text-slate-300 group-hover:translate-x-0.5 transition-all ${stats.totalGaps > 0 ? 'group-hover:text-amber-500' : 'group-hover:text-emerald-500'}`} />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[32px] font-bold text-slate-800 tracking-tight leading-none">{stats.totalGaps}</p>
                  <p className={`text-[13px] text-slate-500 font-medium transition-colors ${stats.totalGaps > 0 ? 'group-hover:text-amber-600' : 'group-hover:text-emerald-600'}`}>待补充项</p>
                </div>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stats.totalGaps > 0 ? 'from-amber-500 to-orange-400' : 'from-emerald-500 to-emerald-400'} transition-transform duration-300 origin-left ${
                activeTab === 'gaps' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
              }`} />
            </button>

            {/* 出海画像 - 点击跳转出海画像（特殊样式） */}
            <button 
              onClick={() => setActiveTab('export')}
              className={`group relative rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-slate-900/30 hover:-translate-y-0.5 text-left ${
                activeTab === 'export' 
                  ? 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 ring-2 ring-gold/50' 
                  : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
              }`}
            >
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDBMNDAgNDAiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvZz48L3N2Zz4=')] opacity-50" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gold/20 to-transparent rounded-full blur-2xl" />
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 bg-gradient-to-br from-gold to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-gold/30">
                    <Compass size={20} className="text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    {exportStrategy ? (
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={10} /> 已生成
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-gold bg-gold/20 px-2.5 py-1 rounded-full">待调研</span>
                    )}
                    <ChevronRight size={16} className="text-slate-500 group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[13px] text-slate-400 font-medium group-hover:text-gold transition-colors">出海画像</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {exportStrategy ? '查看调研报告' : '点击开始智能调研'}
                  </p>
                </div>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-gold via-amber-400 to-gold transition-transform duration-300 origin-left ${
                activeTab === 'export' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
              }`} />
            </button>
          </div>

          {/* 辅助标签栏 - 简化版 */}
          <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 w-fit">
            {[
              { key: 'sources', label: '资料清单', icon: FolderOpen },
              { key: 'cards', label: '知识要点', icon: Layers },
              { key: 'gaps', label: '待补充', icon: AlertTriangle },
              { key: 'export', label: '出海画像', icon: Compass }
            ].map((tab) => (
              <button 
                key={tab.key} 
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === tab.key 
                    ? 'bg-white text-navy-900 shadow-sm' 
                    : 'text-slate-500 hover:text-navy-700 hover:bg-white/50'
                }`}
              >
                <tab.icon size={14} className={activeTab === tab.key ? 'text-gold' : ''} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* 资料清单 Tab */}
          {activeTab === 'sources' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* 上传区 */}
              <div 
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer group ${
                  isDragOver 
                    ? 'border-gold bg-gold/5 scale-[1.01]' 
                    : 'border-border hover:border-gold/40 hover:bg-ivory/50'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 group-hover:bg-gold/10 rounded-xl flex items-center justify-center transition-colors">
                    <Upload size={24} className="text-slate-400 group-hover:text-gold transition-colors" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-navy-900">拖拽文件至此，或点击上传</p>
                    <p className="text-xs text-slate-400 mt-0.5">支持 PDF、Word、PPT、Excel、Markdown 等常见格式</p>
                  </div>
                </div>
              </div>

              {/* 资料列表 */}
              {sources.length > 0 && (
                <div className="bg-white border border-border rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-border">
                      <tr>
                        <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider">资料名称</th>
                        <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider">来源</th>
                        <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider">状态</th>
                        <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider">产出</th>
                        <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {sources.map(source => {
                        const fileInfo = source.type === 'file' ? getFileIcon(source.name) : null;
                        return (
                          <tr key={source.id} className="hover:bg-ivory/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                  source.type === 'file' && fileInfo 
                                    ? fileInfo.bgColor 
                                    : source.type === 'url' 
                                      ? 'bg-emerald-50' 
                                      : 'bg-violet-50'
                                }`}>
                                  {source.type === 'file' && fileInfo ? (
                                    <fileInfo.Icon size={20} className={fileInfo.color} />
                                  ) : source.type === 'url' ? (
                                    <Globe size={20} className="text-emerald-500" />
                                  ) : (
                                    <FileText size={20} className="text-violet-500" />
                                  )}
                                </div>
                                <div>
                                  <span className="font-medium text-navy-900 block truncate max-w-[250px]">{source.name}</span>
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(source.createdAt).toLocaleString('zh-CN')}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                                source.type === 'file' ? 'bg-blue-50 text-blue-600' :
                                source.type === 'url' ? 'bg-emerald-50 text-emerald-600' :
                                'bg-violet-50 text-violet-600'
                              }`}>
                                {source.type === 'file' ? <File size={10} /> :
                                 source.type === 'url' ? <Globe size={10} /> :
                                 <FileText size={10} />}
                                {source.type === 'file' ? '文件' : source.type === 'url' ? '网页' : '文本'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
                                source.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                                source.status === 'processing' ? 'bg-blue-50 text-blue-600' :
                                source.status === 'failed' ? 'bg-red-50 text-red-600' :
                                'bg-slate-50 text-slate-500'
                              }`}>
                                {source.status === 'processing' && <Loader2 size={12} className="animate-spin" />}
                                {source.status === 'completed' && <CheckCircle2 size={12} />}
                                {source.status === 'failed' && <AlertCircle size={12} />}
                                {source.status === 'queued' && <Clock size={12} />}
                                {source.status === 'completed' ? '已完成' : 
                                 source.status === 'processing' ? '处理中' : 
                                 source.status === 'failed' ? '失败' : '排队中'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {source.cardIds.length > 0 ? (
                                <div className="flex items-center gap-2">
                                  <ArrowRight size={12} className="text-emerald-500" />
                                  <span className="text-xs text-emerald-600 font-bold">生成 {source.cardIds.length} 条知识要点</span>
                                </div>
                              ) : source.error ? (
                                <span className="text-xs text-red-500 truncate max-w-[200px] block">{source.error}</span>
                              ) : (
                                <span className="text-xs text-slate-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => removeSource(source.id)}
                                className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {sources.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border border-border">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FolderOpen size={32} className="text-slate-300" />
                  </div>
                  <p className="font-bold text-navy-900">尚未录入资料</p>
                  <p className="text-sm text-slate-500 mt-1">请上传产品手册、公司介绍、案例资料等，AI 将自动提取关键信息</p>
                </div>
              )}
            </div>
          )}

          {/* 知识要点 Tab */}
          {activeTab === 'cards' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-in fade-in duration-300">
              {cards.map((card) => (
                <div key={card.id} className="bg-white border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:border-gold/30 transition-all group">
                  <div className={`h-1.5 ${
                    card.type === 'Offering' ? 'bg-gradient-to-r from-blue-500 to-cyan-400' :
                    card.type === 'Proof' ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                    'bg-gradient-to-r from-violet-500 to-purple-400'
                  }`} />
                  
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-3 py-1 rounded-lg ${
                          card.type === 'Offering' ? 'bg-blue-50 text-blue-600' :
                          card.type === 'Proof' ? 'bg-emerald-50 text-emerald-600' :
                          'bg-violet-50 text-violet-600'
                        }`}>
                          {card.type === 'Offering' ? '产品服务' : card.type === 'Proof' ? '案例证明' : '企业画像'}
                        </span>
                        <h3 className="font-bold text-navy-900 text-lg">{card.title}</h3>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">置信度</div>
                        <div className="text-lg font-bold text-navy-900 font-mono">{card.confidence}%</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/50">
                      {card.fields.slice(0, 6).map((f) => (
                        <div key={f.fieldKey}>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{f.label}</span>
                          <span className="text-sm text-navy-900 font-medium block truncate">{f.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* 完整度 */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-500 font-medium">完整度</span>
                        <span className="text-xs font-bold text-navy-900">{card.completion}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            card.completion >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                            card.completion >= 60 ? 'bg-gradient-to-r from-gold to-amber-400' :
                            'bg-gradient-to-r from-red-400 to-red-500'
                          }`}
                          style={{ width: `${card.completion}%` }}
                        />
                      </div>
                    </div>

                    {/* 缺口提示 */}
                    {card.missingFields.length > 0 && (
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle size={14} className="text-amber-500" />
                          <span className="text-xs font-bold text-amber-700">还有 {card.missingFields.length} 项待补充</span>
                        </div>
                        <div className="space-y-1.5">
                          {card.missingFields.slice(0, 2).map((mf) => (
                            <div key={mf.fieldKey} className="flex justify-between items-center">
                              <span className="text-xs text-slate-600">
                                <span className="font-bold text-navy-900">{mf.label}</span>
                              </span>
                              <button className="text-[10px] font-bold text-gold hover:underline">去补充</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 底部 */}
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <Database size={12} />
                        <span>来源: </span>
                        {card.evidence.map(e => (
                          <span key={e.sourceId} className="font-bold text-slate-600 truncate max-w-[120px]">{e.sourceName}</span>
                        ))}
                      </div>
                      <button className="flex items-center gap-1 text-xs font-bold text-navy-900 hover:text-gold transition-colors">
                        查看详情 <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 待补充 Tab */}
          {activeTab === 'gaps' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {['P0', 'P1', 'P2'].map(priority => {
                const priorityGaps = allGaps.filter(g => g.priority === priority);
                if (priorityGaps.length === 0) return null;
                
                return (
                  <div key={priority} className="space-y-3">
                    <div className={`flex items-center gap-3 px-4 py-2 rounded-xl ${
                      priority === 'P0' ? 'bg-red-50' :
                      priority === 'P1' ? 'bg-amber-50' :
                      'bg-slate-50'
                    }`}>
                      <span className={`w-3 h-3 rounded-full ${
                        priority === 'P0' ? 'bg-red-500 animate-pulse' :
                        priority === 'P1' ? 'bg-amber-500' :
                        'bg-slate-400'
                      }`} />
                      <h3 className={`text-sm font-bold ${
                        priority === 'P0' ? 'text-red-700' :
                        priority === 'P1' ? 'text-amber-700' :
                        'text-slate-600'
                      }`}>
                        {priority} - {priority === 'P0' ? '影响内容生成' : priority === 'P1' ? '影响内容质量' : '可选补充'}
                      </h3>
                      <span className={`ml-auto px-2 py-0.5 rounded-lg text-xs font-bold ${
                        priority === 'P0' ? 'bg-red-100 text-red-600' :
                        priority === 'P1' ? 'bg-amber-100 text-amber-600' :
                        'bg-slate-200 text-slate-500'
                      }`}>
                        {priorityGaps.length}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {priorityGaps.map((gap, i) => (
                        <div key={`${gap.cardId}-${gap.fieldKey}-${i}`} className="bg-white border border-border rounded-xl p-5 flex items-center justify-between hover:shadow-lg hover:border-gold/30 transition-all">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              priority === 'P0' ? 'bg-red-50' :
                              priority === 'P1' ? 'bg-amber-50' :
                              'bg-slate-50'
                            }`}>
                              <AlertCircle size={20} className={
                                priority === 'P0' ? 'text-red-500' :
                                priority === 'P1' ? 'text-amber-500' :
                                'text-slate-400'
                              } />
                            </div>
                            <div>
                              <p className="font-bold text-navy-900">{gap.label}</p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                来自: <span className="font-medium text-slate-600">{gap.cardTitle}</span>
                                {gap.reason && <span className="ml-2">· {gap.reason}</span>}
                              </p>
                            </div>
                          </div>
                          <button className="px-5 py-2.5 bg-gradient-to-r from-navy-900 to-navy-800 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all flex items-center gap-2">
                            <Zap size={14} className="text-gold" />
                            立即补充
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {allGaps.length === 0 && (
                <div className="text-center py-16 bg-white rounded-2xl border border-border">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} className="text-emerald-500" />
                  </div>
                  <h3 className="font-bold text-xl text-navy-900 mb-2">资料已完整！</h3>
                  <p className="text-slate-500">知识库信息齐全，可以开始生成海外营销内容了</p>
                </div>
              )}
            </div>
          )}

          {/* 出海画像 Tab */}
          {activeTab === 'export' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {!exportStrategy ? (
                // 未生成状态 - 引导用户开始调研
                <div className="text-center py-16 bg-white rounded-2xl border border-border">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/25">
                    <Compass size={48} className="text-white" />
                  </div>
                  <h3 className="font-bold text-2xl text-navy-900 mb-3">智能出海调研</h3>
                  <p className="text-slate-500 max-w-md mx-auto mb-8">
                    基于已录入的产品资料，AI 将自动进行中英文双语市场调研，
                    为您生成完整的出海策略报告。
                  </p>
                  <div className="flex flex-wrap justify-center gap-3 mb-8">
                    {['竞争格局', '认证要求', '销售渠道', '行业展会', '市场趋势'].map(item => (
                      <span key={item} className="px-4 py-2 bg-slate-100 rounded-full text-sm font-medium text-slate-600">
                        {item}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={startProductResearch}
                    disabled={isResearching || cards.filter(c => c.type === 'Offering').length === 0}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-10 py-4 rounded-2xl text-base font-bold hover:shadow-xl hover:shadow-blue-500/30 transition-all flex items-center gap-3 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isResearching ? (
                      <>
                        <Loader2 className="animate-spin" size={22} />
                        正在调研中...
                      </>
                    ) : (
                      <>
                        <Search size={22} />
                        开始智能调研
                      </>
                    )}
                  </button>
                  {isResearching && researchStages.length > 0 && (
                    <div className="mt-6 w-full max-w-md mx-auto">
                      <div className="bg-white/80 backdrop-blur rounded-xl border border-slate-200 p-4 space-y-2">
                        {researchStages.map(stage => (
                          <div key={stage.name} className="flex items-center gap-3 text-sm">
                            {stage.status === 'pending' && <Clock size={16} className="text-slate-300" />}
                            {stage.status === 'running' && <Loader2 size={16} className="animate-spin text-blue-500" />}
                            {stage.status === 'done' && <CheckCircle2 size={16} className="text-emerald-500" />}
                            {stage.status === 'error' && <AlertCircle size={16} className="text-red-500" />}
                            <span className={
                              stage.status === 'done' ? 'text-emerald-700' :
                              stage.status === 'running' ? 'text-blue-700 font-medium' :
                              stage.status === 'error' ? 'text-red-600' : 'text-slate-400'
                            }>
                              {stage.label}
                            </span>
                            {stage.status === 'error' && stage.error && (
                              <span className="text-xs text-red-400 ml-auto truncate max-w-[120px]">{stage.error}</span>
                            )}
                          </div>
                        ))}
                        <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.round((researchStages.filter(s => s.status === 'done').length / researchStages.length) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {cards.filter(c => c.type === 'Offering').length === 0 && (
                    <p className="text-xs text-amber-600 mt-4">
                      请先上传产品相关资料，再进行出海调研
                    </p>
                  )}
                </div>
              ) : (
                // 已生成状态 - 展示调研结果
                <div className="space-y-6">
                  {/* 顶部概览卡片 */}
                  <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl" />
                    <div className="relative">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-gold to-amber-500 rounded-xl flex items-center justify-center">
                              <Rocket size={24} className="text-white" />
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold">{exportStrategy.productNameCN}</h2>
                              <p className="text-slate-400 text-sm">{exportStrategy.productNameEN}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {exportStrategy.internationalTerms?.slice(0, 4).map(term => (
                              <span key={term} className="px-3 py-1 bg-white/10 rounded-full text-xs">
                                {term}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          {onNavigate && (
                            <button
                              onClick={() => {
                                // 存储 ExportStrategy 到 localStorage 供获客雷达使用
                                localStorage.setItem('vtx_icp_source', JSON.stringify(exportStrategy));
                                onNavigate(NavItem.OutreachRadar);
                                toast.success('已跳转', '请在获客雷达中生成深度客户画像');
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-gold to-amber-500 hover:from-amber-500 hover:to-gold rounded-xl text-sm font-bold text-navy-900 transition-all flex items-center gap-2 shadow-lg shadow-gold/20"
                            >
                              <Target size={16} />
                              生成客户画像
                            </button>
                          )}
                          <button
                            onClick={startProductResearch}
                            disabled={isResearching}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                          >
                            {isResearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                            重新调研
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-6 mt-6">
                        <div className="bg-white/5 rounded-xl p-4">
                          <p className="text-slate-400 text-xs mb-1">市场定位</p>
                          <p className="text-lg font-bold">{exportStrategy.marketPositioning.suggestedPosition}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4">
                          <p className="text-slate-400 text-xs mb-1">目标市场</p>
                          <p className="text-lg font-bold">{exportStrategy.marketPositioning.targetRegions?.slice(0, 2).join('、') || '全球'}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4">
                          <p className="text-slate-400 text-xs mb-1">调研时间</p>
                          <p className="text-lg font-bold">{new Date(exportStrategy.researchedAt).toLocaleDateString('zh-CN')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 竞争格局 */}
                  {exportStrategy.competitorAnalysis && exportStrategy.competitorAnalysis.length > 0 && (
                    <div className="bg-white border border-border rounded-2xl overflow-hidden">
                      <div className="px-6 py-4 border-b border-border bg-slate-50 flex items-center gap-3">
                        <Trophy size={20} className="text-amber-500" />
                        <h3 className="font-bold text-navy-900">国际竞争格局</h3>
                        <span className="ml-auto text-xs text-slate-400">{exportStrategy.competitorAnalysis.length} 家主要竞争对手</span>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-2 gap-4">
                          {exportStrategy.competitorAnalysis.slice(0, 4).map((comp, i) => (
                            <div key={i} className="border border-border rounded-xl p-4 hover:shadow-lg hover:border-gold/30 transition-all">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                                    <Building2 size={20} className="text-slate-500" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-navy-900">{comp.name}</h4>
                                    <p className="text-xs text-slate-400 flex items-center gap-1">
                                      <MapPin size={10} /> {comp.country}
                                    </p>
                                  </div>
                                </div>
                                {comp.website && (
                                  <a href={comp.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">
                                    <ExternalLink size={14} />
                                  </a>
                                )}
                              </div>
                              {comp.strengths && comp.strengths.length > 0 && (
                                <div className="space-y-1">
                                  {comp.strengths.slice(0, 2).map((s, j) => (
                                    <p key={j} className="text-xs text-slate-500 flex items-start gap-2">
                                      <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                      {s}
                                    </p>
                                  ))}
                                </div>
                              )}
                              {comp.priceRange && (
                                <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                                  <DollarSign size={12} className="text-slate-400" />
                                  <span className="text-xs text-slate-500">价格带: {comp.priceRange}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 认证要求 */}
                  {exportStrategy.certifications && (
                    <div className="bg-white border border-border rounded-2xl overflow-hidden">
                      <div className="px-6 py-4 border-b border-border bg-slate-50 flex items-center gap-3">
                        <ShieldCheck size={20} className="text-emerald-500" />
                        <h3 className="font-bold text-navy-900">认证合规要求</h3>
                        {exportStrategy.certifications.gaps && exportStrategy.certifications.gaps.length > 0 && (
                          <span className="ml-auto px-2 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-lg">
                            {exportStrategy.certifications.gaps.length} 项待获取
                          </span>
                        )}
                      </div>
                      <div className="p-6">
                        <div className="space-y-3">
                          {exportStrategy.certifications.required?.slice(0, 6).map((cert, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                  cert.importance === '必备' ? 'bg-red-100' :
                                  cert.importance === '强烈建议' ? 'bg-amber-100' : 'bg-slate-100'
                                }`}>
                                  <Award size={20} className={
                                    cert.importance === '必备' ? 'text-red-500' :
                                    cert.importance === '强烈建议' ? 'text-amber-500' : 'text-slate-400'
                                  } />
                                </div>
                                <div>
                                  <h4 className="font-bold text-navy-900">{cert.name}</h4>
                                  <p className="text-xs text-slate-400">{cert.region}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  cert.importance === '必备' ? 'bg-red-100 text-red-600' :
                                  cert.importance === '强烈建议' ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'
                                }`}>
                                  {cert.importance}
                                </span>
                                {cert.estimatedTime && (
                                  <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <Clock size={12} /> {cert.estimatedTime}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 渠道与展会 - 双列 */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* 销售渠道 */}
                    {exportStrategy.channels && exportStrategy.channels.length > 0 && (
                      <div className="bg-white border border-border rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-border bg-slate-50 flex items-center gap-3">
                          <Store size={20} className="text-blue-500" />
                          <h3 className="font-bold text-navy-900">推荐渠道</h3>
                        </div>
                        <div className="p-4 space-y-2">
                          {exportStrategy.channels.slice(0, 5).map((ch, i) => (
                            <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                              <div className="flex items-center gap-3">
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  ch.priority === '高' ? 'bg-emerald-100 text-emerald-600' :
                                  ch.priority === '中' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                                } text-xs font-bold`}>
                                  {i + 1}
                                </span>
                                <div>
                                  <p className="font-medium text-navy-900 text-sm">{ch.name}</p>
                                  <p className="text-xs text-slate-400">{ch.type}</p>
                                </div>
                              </div>
                              <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                ch.priority === '高' ? 'bg-emerald-50 text-emerald-600' :
                                ch.priority === '中' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'
                              }`}>
                                {ch.priority}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 行业展会 */}
                    {exportStrategy.exhibitions && exportStrategy.exhibitions.length > 0 && (
                      <div className="bg-white border border-border rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-border bg-slate-50 flex items-center gap-3">
                          <Calendar size={20} className="text-purple-500" />
                          <h3 className="font-bold text-navy-900">重点展会</h3>
                        </div>
                        <div className="p-4 space-y-2">
                          {exportStrategy.exhibitions.slice(0, 5).map((ex, i) => (
                            <div key={i} className="p-3 hover:bg-slate-50 rounded-xl transition-colors">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium text-navy-900 text-sm">{ex.name}</p>
                                  <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                                    <MapPin size={10} /> {ex.location}
                                    {ex.timing && <><Clock size={10} /> {ex.timing}</>}
                                  </p>
                                </div>
                                {ex.website && (
                                  <a href={ex.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">
                                    <ExternalLink size={14} />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 差异化策略 */}
                  {exportStrategy.differentiationStrategy && (
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                          <Target size={20} className="text-white" />
                        </div>
                        <h3 className="font-bold text-navy-900">差异化策略建议</h3>
                      </div>
                      <p className="text-slate-700 mb-4">{exportStrategy.differentiationStrategy.suggestedApproach}</p>
                      <div className="flex flex-wrap gap-2">
                        {exportStrategy.differentiationStrategy.uniqueSellingPoints?.map((usp, i) => (
                          <span key={i} className="px-4 py-2 bg-white border border-emerald-200 rounded-xl text-sm font-medium text-emerald-700">
                            {usp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 行动计划 */}
                  {exportStrategy.actionItems && exportStrategy.actionItems.length > 0 && (
                    <div className="bg-white border border-border rounded-2xl overflow-hidden">
                      <div className="px-6 py-4 border-b border-border bg-slate-50 flex items-center gap-3">
                        <Zap size={20} className="text-gold" />
                        <h3 className="font-bold text-navy-900">优先行动项</h3>
                      </div>
                      <div className="p-6">
                        <div className="space-y-3">
                          {exportStrategy.actionItems.map((item, i) => (
                            <div key={i} className={`flex items-center gap-4 p-4 rounded-xl ${
                              item.priority === 'P0' ? 'bg-red-50 border border-red-100' :
                              item.priority === 'P1' ? 'bg-amber-50 border border-amber-100' :
                              'bg-slate-50 border border-slate-100'
                            }`}>
                              <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                                item.priority === 'P0' ? 'bg-red-500 text-white' :
                                item.priority === 'P1' ? 'bg-amber-500 text-white' :
                                'bg-slate-300 text-white'
                              }`}>
                                {item.priority}
                              </span>
                              <div className="flex-1">
                                <p className="font-medium text-navy-900">{item.action}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-slate-400 px-2 py-0.5 bg-white rounded">{item.category}</span>
                                  {item.deadline && (
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                      <Clock size={10} /> {item.deadline}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* 隐藏的文件输入 */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden" 
        accept={ALL_ACCEPT}
        multiple
      />

      {/* 粘贴内容弹窗 */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-violet-500 to-purple-500 p-6 text-white">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <ClipboardPaste size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">粘贴内容</h3>
                    <p className="text-white/70 text-sm">AI 将自动提取关键信息</p>
                  </div>
                </div>
                <button onClick={() => setIsPasteModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-8">
              <textarea 
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="请粘贴产品介绍、公司简介、技术参数、案例说明等任意文字内容..."
                className="w-full h-64 bg-slate-50 border border-border rounded-2xl p-6 text-sm font-medium outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all resize-none"
                autoFocus
              />
              <div className="mt-6 flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Sparkles size={14} className="text-gold" />
                  VertaX AI 智能提取引擎
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsPasteModalOpen(false)} 
                    className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-navy-900 transition-colors"
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => processWithAI(pastedText, "粘贴内容")}
                    disabled={!pastedText.trim() || isProcessing}
                    className="bg-gradient-to-r from-violet-500 to-purple-500 text-white px-8 py-3 rounded-xl text-sm font-bold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                    开始提取
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 网页提取弹窗 */}
      {isUrlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[2rem] border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <Globe size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">网页提取</h3>
                    <p className="text-white/70 text-sm">从网页自动提取内容</p>
                  </div>
                </div>
                <button onClick={() => setIsUrlModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-8">
              <div className="relative">
                <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/product-page"
                  className="w-full bg-slate-50 border border-border rounded-xl pl-12 pr-4 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-all"
                  autoFocus
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {['官网产品页', '公司介绍', '新闻稿', '技术文档'].map(tag => (
                  <span key={tag} className="text-[10px] px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg font-medium">{tag}</span>
                ))}
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button 
                  onClick={() => setIsUrlModalOpen(false)} 
                  className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-navy-900 transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={handleUrlFetch}
                  disabled={!urlInput.trim() || isProcessing}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-3 rounded-xl text-sm font-bold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <ExternalLink size={18} />}
                  抓取并提取
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 处理中遮罩 */}
      {isProcessing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy-900/50 backdrop-blur-md">
          <div className="bg-white p-10 rounded-[2rem] shadow-2xl flex flex-col items-center gap-6 border border-gold/20 max-w-sm text-center animate-in zoom-in-95 duration-300">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="text-gold animate-pulse" size={28} />
              </div>
            </div>
            <div>
              <h4 className="font-bold text-xl text-navy-900">AI 正在处理...</h4>
              <p className="text-sm text-slate-500 mt-2">正在提取关键信息，请稍候</p>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-gold to-amber-400 h-full w-2/3 animate-[progress_2s_ease-in-out_infinite] rounded-full" />
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
