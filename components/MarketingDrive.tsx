
import React, { useState, useEffect, useCallback } from 'react';
import { ContentAsset, KnowledgeCard, KeywordClusterFE, ContentPlanFE, DerivedContentFE } from '../types';
import { useToast } from './Toast';
import {
  Search,
  Calendar,
  FileText,
  BarChart3,
  Share2,
  Sparkles,
  Loader2,
  Plus,
  X,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Edit3,
  Eye,
  ExternalLink,
  Target,
  TrendingUp,
  BookOpen,
  Link2,
  Zap,
  Copy,
  Download,
  Send,
  Globe,
  MessageSquare,
  Mail,
  FileEdit,
  ArrowRight
} from 'lucide-react';
import ModuleHeader from './ModuleHeader';

// ==================== Types ====================

type SEOTab = 'keywords' | 'planning' | 'generation' | 'optimizer' | 'output';

interface SEOStats {
  keywordClusters: number;
  contentPlans: { total: number; planned: number; draft: number; ready: number; published: number };
  contentAssets: { total: number; published: number };
  derivedContent: number;
  avgSeoScore: number;
}

interface MarketingDriveProps {
  onNewAssetGenerated?: (asset: ContentAsset) => void;
  assets: ContentAsset[];
}

const TABS: { id: SEOTab; label: string; labelEN: string; icon: React.FC<any> }[] = [
  { id: 'keywords', label: '关键词研究室', labelEN: 'Keyword Lab', icon: Search },
  { id: 'planning', label: '内容规划台', labelEN: 'Planning', icon: Calendar },
  { id: 'generation', label: '内容生成工厂', labelEN: 'Generation', icon: FileText },
  { id: 'optimizer', label: 'SEO 优化器', labelEN: 'Optimizer', icon: BarChart3 },
  { id: 'output', label: '多格式输出站', labelEN: 'Output', icon: Share2 },
];

// ==================== Main Component ====================

const MarketingDrive: React.FC<MarketingDriveProps> = ({ onNewAssetGenerated, assets }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<SEOTab>('keywords');
  const [stats, setStats] = useState<SEOStats | null>(null);

  // Shared state across tabs
  const [clusters, setClusters] = useState<KeywordClusterFE[]>([]);
  const [plans, setPlans] = useState<ContentPlanFE[]>([]);
  const [contentAssets, setContentAssets] = useState<any[]>([]);
  const [knowledgeCards, setKnowledgeCards] = useState<KnowledgeCard[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch SEO stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/seo/stats');
      if (res.ok) setStats(await res.json());
    } catch { /* silent */ }
  }, []);

  // Fetch clusters
  const fetchClusters = useCallback(async () => {
    try {
      const res = await fetch('/api/seo/keywords/clusters');
      if (res.ok) setClusters(await res.json());
    } catch { /* silent */ }
  }, []);

  // Fetch plans
  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/seo/content-plans');
      if (res.ok) setPlans(await res.json());
    } catch { /* silent */ }
  }, []);

  // Fetch content assets from SEO API
  const fetchContentAssets = useCallback(async () => {
    try {
      const res = await fetch('/api/seo/content');
      if (res.ok) setContentAssets(await res.json());
    } catch { /* silent */ }
  }, []);

  // Fetch knowledge cards from API
  const fetchKnowledgeCards = useCallback(async () => {
    try {
      const res = await fetch('/api/knowledge-cards');
      if (res.ok) setKnowledgeCards(await res.json());
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchClusters();
    fetchPlans();
    fetchContentAssets();
    fetchKnowledgeCards();
  }, [fetchStats, fetchClusters, fetchPlans, fetchContentAssets, fetchKnowledgeCards]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <ModuleHeader icon={BarChart3} title="营销驱动系统" subtitle="从关键词研究到多格式内容输出的全链路 SEO 引擎">
        {stats && (
          <div className="flex gap-4">
            {[
              { label: '关键词聚类', value: stats.keywordClusters, color: 'text-blue-600' },
              { label: '内容资产', value: stats.contentAssets.total, color: 'text-emerald-600' },
              { label: 'SEO 均分', value: stats.avgSeoScore || '—', color: 'text-gold' },
              { label: '已发布', value: stats.contentAssets.published, color: 'text-navy-900' },
            ].map(s => (
              <div key={s.label} className="text-center px-3">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </ModuleHeader>

      {/* Tab Navigation */}
      <div className="flex border-b border-border gap-1 overflow-x-auto scrollbar-hide">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-4 text-sm font-bold transition-all relative flex items-center gap-2 whitespace-nowrap ${
                isActive ? 'text-navy-900' : 'text-slate-400 hover:text-navy-800'
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {isActive && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold rounded-full" />}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'keywords' && (
        <KeywordResearchTab
          clusters={clusters}
          onRefresh={fetchClusters}
          toast={toast}
        />
      )}
      {activeTab === 'planning' && (
        <ContentPlanningTab
          plans={plans}
          clusters={clusters}
          onRefresh={() => { fetchPlans(); fetchStats(); }}
          toast={toast}
        />
      )}
      {activeTab === 'generation' && (
        <ContentGenerationTab
          plans={plans}
          contentAssets={contentAssets}
          onRefresh={() => { fetchContentAssets(); fetchPlans(); fetchStats(); }}
          onNewAssetGenerated={onNewAssetGenerated}
          toast={toast}
        />
      )}
      {activeTab === 'optimizer' && (
        <SEOOptimizerTab
          contentAssets={contentAssets}
          onRefresh={() => { fetchContentAssets(); fetchStats(); }}
          toast={toast}
        />
      )}
      {activeTab === 'output' && (
        <MultiFormatOutputTab
          contentAssets={contentAssets}
          onRefresh={() => { fetchContentAssets(); fetchStats(); }}
          toast={toast}
        />
      )}
    </div>
  );
};

// ==================== Tab 1: Keyword Research ====================

const KeywordResearchTab: React.FC<{
  clusters: KeywordClusterFE[];
  onRefresh: () => void;
  toast: any;
}> = ({ clusters, onRefresh, toast }) => {
  const [extracting, setExtracting] = useState(false);
  const [extractingIcp, setExtractingIcp] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPrimary, setManualPrimary] = useState('');
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);

  // ICP-Driven keyword extraction
  const handleExtractFromICP = async () => {
    setExtractingIcp(true);
    try {
      // Fetch product with ICP profile
      const prodRes = await fetch('/api/products');
      const products = await prodRes.json();
      if (!products || products.length === 0) {
        toast.error('No products found', 'Please create a product first');
        return;
      }
      const product = products[0];
      
      // Check if we have enough data for ICP-driven extraction
      if (!product.icpProfile && !product.exportStrategy) {
        toast.error('Missing ICP data', 'Please complete export research in Knowledge Engine first to generate ICP profile');
        return;
      }

      // Build a minimal exportStrategy if not available
      const exportStrategy = product.exportStrategy || {
        productNameEN: product.name,
        internationalTerms: product.applicationIndustries || [],
        industryCategory: product.productType || '',
        competitorAnalysis: [],
        trends: []
      };
      
      const res = await fetch('/api/seo/keywords/extract-icp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exportStrategy,
          icpProfile: product.icpProfile,
          productName: product.name
        })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'ICP extraction failed');
      const data = await res.json();
      toast.success(`Generated ${data.count} ICP-driven keyword clusters`, 
        `Awareness: ${data.summary?.byJourneyStage?.awareness || 0}, Consideration: ${data.summary?.byJourneyStage?.consideration || 0}, Decision: ${data.summary?.byJourneyStage?.decision || 0}`);
      onRefresh();
    } catch (err: any) {
      toast.error('ICP keyword extraction failed', err.message);
    } finally {
      setExtractingIcp(false);
    }
  };

  const handleExtractFromStrategy = async () => {
    setExtracting(true);
    try {
      // Fetch the latest export strategy from a product
      const prodRes = await fetch('/api/products');
      const products = await prodRes.json();
      if (!products || products.length === 0) {
        toast.error('No products found', 'Please create a product with research data first');
        return;
      }
      const product = products[0];
      if (!product.exportStrategy && !product.internationalTerms) {
        // Try to build a minimal strategy from product data
        const strategy = {
          productNameEN: product.name,
          internationalTerms: product.applicationIndustries || [],
          industryCategory: product.productType || '',
          competitorAnalysis: [],
          trends: []
        };
        const res = await fetch('/api/seo/keywords/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ exportStrategy: strategy, productName: product.name })
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Extraction failed');
        const data = await res.json();
        toast.success(`Extracted ${data.count} keyword clusters`);
        onRefresh();
        return;
      }
      const res = await fetch('/api/seo/keywords/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exportStrategy: product.exportStrategy || product, productName: product.name })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Extraction failed');
      const data = await res.json();
      toast.success(`Extracted ${data.count} keyword clusters`);
      onRefresh();
    } catch (err: any) {
      toast.error('Keyword extraction failed', err.message);
    } finally {
      setExtracting(false);
    }
  };

  const handleCreateManual = async () => {
    if (!manualName || !manualPrimary) return;
    try {
      const res = await fetch('/api/seo/keywords/clusters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: manualName, primaryKeyword: manualPrimary, relatedKeywords: [] })
      });
      if (!res.ok) throw new Error('Failed to create cluster');
      toast.success('Keyword cluster created');
      setManualName('');
      setManualPrimary('');
      setShowManualForm(false);
      onRefresh();
    } catch (err: any) {
      toast.error('Creation failed', err.message);
    }
  };

  const handleDeleteCluster = async (id: string) => {
    try {
      await fetch(`/api/seo/keywords/clusters/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch { /* silent */ }
  };

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleExtractFromICP}
          disabled={extractingIcp}
          className="px-5 py-2.5 bg-gradient-to-r from-navy-900 to-navy-800 text-white rounded-xl text-xs font-bold hover:from-navy-800 hover:to-navy-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg"
        >
          {extractingIcp ? <Loader2 className="animate-spin" size={14} /> : <Target size={14} className="text-gold" />}
          ICP 驱动关键词提取
        </button>
        <button
          onClick={handleExtractFromStrategy}
          disabled={extracting}
          className="px-5 py-2.5 bg-navy-900 text-white rounded-xl text-xs font-bold hover:bg-navy-800 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {extracting ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} className="text-gold" />}
          从出海调研中提取关键词
        </button>
        <button
          onClick={() => setShowManualForm(!showManualForm)}
          className="px-5 py-2.5 bg-ivory-surface border border-border text-navy-900 rounded-xl text-xs font-bold hover:bg-ivory transition-all flex items-center gap-2"
        >
          <Plus size={14} /> 手动创建聚类
        </button>
      </div>

      {/* Manual Form */}
      {showManualForm && (
        <div className="bg-ivory-surface border border-border rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">聚类名称</label>
              <input
                value={manualName}
                onChange={e => setManualName(e.target.value)}
                placeholder="e.g. Robotic Spray Painting Solutions"
                className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">主关键词</label>
              <input
                value={manualPrimary}
                onChange={e => setManualPrimary(e.target.value)}
                placeholder="e.g. robotic paint cell"
                className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-gold"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowManualForm(false)} className="px-4 py-2 text-xs text-slate-500">Cancel</button>
            <button onClick={handleCreateManual} className="px-5 py-2 bg-navy-900 text-white rounded-lg text-xs font-bold">Create</button>
          </div>
        </div>
      )}

      {/* Clusters Grid */}
      {clusters.length === 0 ? (
        <div className="text-center py-20 bg-ivory-surface border border-dashed border-border rounded-3xl">
          <Search size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-navy-900 font-bold">No keyword clusters yet</p>
          <p className="text-xs text-slate-500 mt-1">Extract from export strategy research or create manually</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {clusters.map(cluster => (
            <div key={cluster.id} className={`bg-ivory-surface border rounded-2xl overflow-hidden hover:border-gold/30 transition-all ${
              cluster.source === 'icp-driven' ? 'border-gold/40' : 'border-border'
            }`}>
              <div
                className="p-5 cursor-pointer flex items-center justify-between"
                onClick={() => setExpandedCluster(expandedCluster === cluster.id ? null : cluster.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Target size={14} className="text-gold shrink-0" />
                    <h4 className="text-sm font-bold text-navy-900 truncate">{cluster.name}</h4>
                  </div>
                  <p className="text-xs text-slate-500">
                    Primary: <span className="font-bold text-navy-900">{cluster.primaryKeyword}</span>
                    <span className="mx-2 text-slate-300">|</span>
                    {cluster.relatedKeywords?.length || 0} related keywords
                  </p>
                  {/* ICP-driven metadata */}
                  {cluster.targetPersona && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
                        {cluster.targetPersona.title}
                      </span>
                      {cluster.journeyStage && (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          cluster.journeyStage === 'awareness' ? 'bg-blue-50 text-blue-600' :
                          cluster.journeyStage === 'consideration' ? 'bg-amber-50 text-amber-600' :
                          'bg-emerald-50 text-emerald-600'
                        }`}>
                          {cluster.journeyStage === 'awareness' ? '🎯 Awareness' : 
                           cluster.journeyStage === 'consideration' ? '🔍 Consideration' : '💰 Decision'}
                        </span>
                      )}
                      {cluster.primarySearchIntent && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          {cluster.primarySearchIntent}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    cluster.source === 'icp-driven' ? 'bg-gold/10 text-gold' :
                    cluster.source === 'export-strategy' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {cluster.source === 'icp-driven' ? 'ICP-Driven' : cluster.source === 'export-strategy' ? 'AI Extracted' : 'Manual'}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteCluster(cluster.id); }} className="p-1 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 size={12} className="text-slate-300 hover:text-red-500" />
                  </button>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${expandedCluster === cluster.id ? 'rotate-180' : ''}`} />
                </div>
              </div>
              {expandedCluster === cluster.id && (
                <div className="px-5 pb-5 border-t border-border/50">
                  {/* Pain points addressed */}
                  {cluster.addressPainPoints && cluster.addressPainPoints.length > 0 && (
                    <div className="mt-3 mb-3">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1.5">Addresses Pain Points</p>
                      <div className="flex flex-wrap gap-1">
                        {cluster.addressPainPoints.map((pp, i) => (
                          <span key={i} className="text-[9px] px-2 py-1 rounded bg-red-50 text-red-600">{pp}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Recommended content types */}
                  {cluster.recommendedContentTypes && cluster.recommendedContentTypes.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1.5">Recommended Content Types</p>
                      <div className="flex flex-wrap gap-1">
                        {cluster.recommendedContentTypes.map((ct, i) => (
                          <span key={i} className="text-[9px] px-2 py-1 rounded bg-emerald-50 text-emerald-600">{ct}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Related keywords */}
                  {cluster.relatedKeywords?.length > 0 && (
                    <div className="grid grid-cols-1 gap-2 mt-3">
                      {cluster.relatedKeywords.map((kw, i) => (
                      <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-xs">
                        <span className="font-medium text-navy-900">{kw.keyword}</span>
                        <div className="flex items-center gap-3">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            kw.searchVolume === 'high' ? 'bg-emerald-50 text-emerald-600' : kw.searchVolume === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'
                          }`}>{kw.searchVolume} vol</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            kw.competition === 'low' ? 'bg-emerald-50 text-emerald-600' : kw.competition === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                          }`}>{kw.competition} comp</span>
                          <span className="text-[9px] text-slate-400 capitalize">{kw.searchIntent}</span>
                        </div>
                      </div>
                    ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== Tab 2: Content Planning ====================

const ContentPlanningTab: React.FC<{
  plans: ContentPlanFE[];
  clusters: KeywordClusterFE[];
  onRefresh: () => void;
  toast: any;
}> = ({ plans, clusters, onRefresh, toast }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContentType, setFormContentType] = useState<string>('blog-article');
  const [formPriority, setFormPriority] = useState<string>('P1');
  const [formClusterId, setFormClusterId] = useState<string>('');
  const [formKeywords, setFormKeywords] = useState('');

  // Auto-generate content plans from ICP-driven clusters
  const handleAutoGenerate = async () => {
    const icpClusters = clusters.filter(c => c.source === 'icp-driven' && c.targetPersona);
    if (icpClusters.length === 0) {
      toast.error('No ICP-driven clusters found', 'Please extract ICP-driven keywords first');
      return;
    }
    
    setAutoGenerating(true);
    try {
      const res = await fetch('/api/seo/content-plans/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clusterIds: icpClusters.map(c => c.id)
        })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Auto-generation failed');
      const data = await res.json();
      toast.success(`Generated ${data.count} content plans`, 
        `P0: ${data.summary?.byPriority?.P0 || 0}, P1: ${data.summary?.byPriority?.P1 || 0}, P2: ${data.summary?.byPriority?.P2 || 0}`);
      onRefresh();
    } catch (err: any) {
      toast.error('Auto-generation failed', err.message);
    } finally {
      setAutoGenerating(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!formTitle) return;
    try {
      const res = await fetch('/api/seo/content-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          contentType: formContentType,
          priority: formPriority,
          keywordClusterId: formClusterId || undefined,
          targetKeywords: formKeywords.split(',').map(k => k.trim()).filter(Boolean)
        })
      });
      if (!res.ok) throw new Error('Failed to create plan');
      toast.success('Content plan created');
      setFormTitle('');
      setFormKeywords('');
      setShowCreateForm(false);
      onRefresh();
    } catch (err: any) {
      toast.error('Create failed', err.message);
    }
  };

  const handleDeletePlan = async (id: string) => {
    try {
      await fetch(`/api/seo/content-plans/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch { /* silent */ }
  };

  const statusColors: Record<string, string> = {
    planned: 'bg-slate-100 text-slate-600',
    generating: 'bg-blue-50 text-blue-600',
    draft: 'bg-amber-50 text-amber-600',
    optimizing: 'bg-purple-50 text-purple-600',
    ready: 'bg-emerald-50 text-emerald-600',
    published: 'bg-navy-900/10 text-navy-900'
  };

  const priorityColors: Record<string, string> = {
    P0: 'bg-red-50 text-red-600 border-red-200',
    P1: 'bg-amber-50 text-amber-600 border-amber-200',
    P2: 'bg-slate-50 text-slate-500 border-slate-200'
  };

  const contentTypeLabels: Record<string, string> = {
    'landing-page': 'Landing Page',
    'blog-article': 'Blog Article',
    'faq-page': 'FAQ Page',
    'case-study': 'Case Study',
    'technical-doc': 'Technical Doc'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-500">Editorial calendar with SEO-driven content pipeline</p>
        <div className="flex gap-2">
          {clusters.some(c => c.source === 'icp-driven') && (
            <button
              onClick={handleAutoGenerate}
              disabled={autoGenerating}
              className="px-5 py-2.5 bg-gradient-to-r from-gold to-amber-500 text-navy-900 rounded-xl text-xs font-bold hover:from-amber-500 hover:to-gold transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {autoGenerating ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
              智能生成内容计划
            </button>
          )}
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-5 py-2.5 bg-navy-900 text-white rounded-xl text-xs font-bold hover:bg-navy-800 transition-all flex items-center gap-2"
          >
            <Plus size={14} /> New Content Plan
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-ivory-surface border border-gold/30 rounded-2xl p-6 space-y-4">
          <h4 className="text-sm font-bold text-navy-900">Create Content Plan</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Title</label>
              <input value={formTitle} onChange={e => setFormTitle(e.target.value)}
                placeholder="e.g. Complete Guide to Robotic Paint Cells" className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-gold" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Content Type</label>
              <select value={formContentType} onChange={e => setFormContentType(e.target.value)}
                className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs outline-none">
                <option value="blog-article">Blog Article</option>
                <option value="landing-page">Landing Page</option>
                <option value="faq-page">FAQ Page</option>
                <option value="case-study">Case Study</option>
                <option value="technical-doc">Technical Doc</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Priority</label>
              <select value={formPriority} onChange={e => setFormPriority(e.target.value)}
                className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs outline-none">
                <option value="P0">P0 - Critical</option>
                <option value="P1">P1 - Important</option>
                <option value="P2">P2 - Nice to have</option>
              </select>
            </div>
            {clusters.length > 0 && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Keyword Cluster</label>
                <select value={formClusterId} onChange={e => setFormClusterId(e.target.value)}
                  className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs outline-none">
                  <option value="">— None —</option>
                  {clusters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div className={clusters.length > 0 ? '' : 'col-span-2'}>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Target Keywords (comma-separated)</label>
              <input value={formKeywords} onChange={e => setFormKeywords(e.target.value)}
                placeholder="robotic paint cell, automated spray booth" className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowCreateForm(false)} className="px-4 py-2 text-xs text-slate-500">Cancel</button>
            <button onClick={handleCreatePlan} disabled={!formTitle} className="px-5 py-2 bg-navy-900 text-white rounded-lg text-xs font-bold disabled:opacity-50">Create Plan</button>
          </div>
        </div>
      )}

      {/* Plans Table */}
      {plans.length === 0 ? (
        <div className="text-center py-20 bg-ivory-surface border border-dashed border-border rounded-3xl">
          <Calendar size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-navy-900 font-bold">No content plans yet</p>
          <p className="text-xs text-slate-500 mt-1">Create your first SEO content plan to start the pipeline</p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map(plan => (
            <div key={plan.id} className="bg-ivory-surface border border-border rounded-2xl p-5 flex items-center justify-between hover:border-gold/30 transition-all">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <span className={`text-[9px] font-bold px-2 py-1 rounded border shrink-0 ${priorityColors[plan.priority] || ''}`}>
                  {plan.priority}
                </span>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-navy-900 truncate">{plan.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-400">{contentTypeLabels[plan.contentType] || plan.contentType}</span>
                    {plan.targetKeywords?.length > 0 && (
                      <>
                        <span className="text-slate-300">|</span>
                        <span className="text-[10px] text-slate-400">{plan.targetKeywords.slice(0, 3).join(', ')}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full capitalize ${statusColors[plan.status] || ''}`}>
                  {plan.status}
                </span>
                <button onClick={() => handleDeletePlan(plan.id)} className="p-1 hover:bg-red-50 rounded-lg">
                  <Trash2 size={12} className="text-slate-300 hover:text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== Tab 3: Content Generation ====================

const ContentGenerationTab: React.FC<{
  plans: ContentPlanFE[];
  contentAssets: any[];
  onRefresh: () => void;
  onNewAssetGenerated?: (asset: ContentAsset) => void;
  toast: any;
}> = ({ plans, contentAssets, onRefresh, onNewAssetGenerated, toast }) => {
  const [generating, setGenerating] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [genTitle, setGenTitle] = useState('');
  const [genContentType, setGenContentType] = useState('blog-article');
  const [genFocusKeyword, setGenFocusKeyword] = useState('');
  const [genKeywords, setGenKeywords] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [editingBody, setEditingBody] = useState('');
  const [saving, setSaving] = useState(false);

  // Auto-fill from plan
  useEffect(() => {
    if (selectedPlanId) {
      const plan = plans.find(p => p.id === selectedPlanId);
      if (plan) {
        setGenTitle(plan.title);
        setGenContentType(plan.contentType);
        setGenKeywords(plan.targetKeywords?.join(', ') || '');
        if (plan.targetKeywords?.length) setGenFocusKeyword(plan.targetKeywords[0]);
      }
    }
  }, [selectedPlanId, plans]);

  const handleGenerate = async () => {
    if (!genFocusKeyword && !genKeywords) { toast.error('Please specify target keywords'); return; }
    setGenerating(true);
    try {
      const targetKeywords = [genFocusKeyword, ...genKeywords.split(',').map(k => k.trim())].filter(Boolean);
      const res = await fetch('/api/seo/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentPlanId: selectedPlanId || undefined,
          contentType: genContentType,
          targetKeywords,
          focusKeyword: genFocusKeyword || targetKeywords[0],
          title: genTitle || undefined,
          language: 'en'
        })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Generation failed');
      const asset = await res.json();
      toast.success('Content generated successfully');
      setSelectedAsset(asset);
      setEditingBody(asset.body || '');

      // Notify parent for legacy compatibility
      if (onNewAssetGenerated) {
        onNewAssetGenerated({
          id: asset.id,
          title: asset.title,
          category: asset.contentType || 'blog-article',
          status: 'draft',
          knowledgeRefs: [],
          keywords: asset.keywords || [],
          lastModified: new Date().toISOString().split('T')[0],
          draftBody: asset.body,
        });
      }
      onRefresh();
    } catch (err: any) {
      toast.error('Generation failed', err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedAsset) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/seo/content/${selectedAsset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: editingBody })
      });
      if (!res.ok) throw new Error('Save failed');
      const updated = await res.json();
      setSelectedAsset(updated);
      toast.success('Content saved');
      onRefresh();
    } catch (err: any) {
      toast.error('Save failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Generation Form */}
      <div className="bg-ivory-surface border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-gold" />
          <h4 className="text-sm font-bold text-navy-900">AI SEO Content Generator</h4>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.length > 0 && (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">From Plan</label>
              <select value={selectedPlanId} onChange={e => setSelectedPlanId(e.target.value)}
                className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs outline-none">
                <option value="">— Direct Generation —</option>
                {plans.filter(p => p.status === 'planned' || p.status === 'draft').map(p =>
                  <option key={p.id} value={p.id}>{p.title}</option>
                )}
              </select>
            </div>
          )}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Content Type</label>
            <select value={genContentType} onChange={e => setGenContentType(e.target.value)}
              className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs outline-none">
              <option value="blog-article">Blog Article</option>
              <option value="landing-page">Landing Page</option>
              <option value="faq-page">FAQ Page</option>
              <option value="case-study">Case Study</option>
              <option value="technical-doc">Technical Doc</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Focus Keyword</label>
            <input value={genFocusKeyword} onChange={e => setGenFocusKeyword(e.target.value)}
              placeholder="robotic paint cell" className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Secondary Keywords</label>
            <input value={genKeywords} onChange={e => setGenKeywords(e.target.value)}
              placeholder="automated spray, paint booth" className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs outline-none" />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Title (optional, AI will generate if empty)</label>
          <input value={genTitle} onChange={e => setGenTitle(e.target.value)}
            placeholder="Leave blank for AI-generated title" className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs outline-none" />
        </div>
        <button onClick={handleGenerate} disabled={generating || (!genFocusKeyword && !genKeywords)}
          className="px-6 py-2.5 bg-navy-900 text-white rounded-xl text-xs font-bold hover:bg-navy-800 disabled:opacity-50 transition-all flex items-center gap-2">
          {generating ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} className="text-gold" />}
          {generating ? 'Generating SEO Content...' : 'Generate SEO Content'}
        </button>
      </div>

      {/* Content List + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset List */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Content Assets ({contentAssets.length})</p>
          <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-hide">
            {contentAssets.map(a => (
              <div key={a.id || a._id} onClick={() => { setSelectedAsset(a); setEditingBody(a.body || ''); }}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedAsset?.id === (a.id || a._id) ? 'bg-navy-900 border-navy-800' : 'bg-ivory-surface border-border hover:border-gold/30'
                }`}>
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                    selectedAsset?.id === (a.id || a._id) ? 'bg-gold/20 text-gold' : 'bg-slate-100 text-slate-500'
                  }`}>{a.contentType}</span>
                  {a.seoScore?.overall > 0 && (
                    <span className={`text-[9px] font-bold ${a.seoScore.overall >= 70 ? 'text-emerald-500' : a.seoScore.overall >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                      SEO: {a.seoScore.overall}
                    </span>
                  )}
                </div>
                <h4 className={`text-[11px] font-bold leading-relaxed line-clamp-2 ${
                  selectedAsset?.id === (a.id || a._id) ? 'text-white' : 'text-navy-900'
                }`}>{a.title}</h4>
              </div>
            ))}
          </div>
        </div>

        {/* Content Editor */}
        <div className="lg:col-span-2">
          {selectedAsset ? (
            <div className="bg-ivory-surface border border-border rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-ivory/30 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-navy-900 text-sm">{selectedAsset.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    {selectedAsset.focusKeyword && <span className="text-[9px] bg-gold/10 text-gold px-2 py-0.5 rounded font-bold">{selectedAsset.focusKeyword}</span>}
                    {selectedAsset.metaTitle && <span className="text-[9px] text-slate-400 truncate max-w-[200px]">Meta: {selectedAsset.metaTitle}</span>}
                  </div>
                </div>
                <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full capitalize ${
                  selectedAsset.status === 'published' ? 'bg-emerald-50 text-emerald-600' :
                  selectedAsset.status === 'optimized' ? 'bg-purple-50 text-purple-600' :
                  'bg-slate-100 text-slate-600'
                }`}>{selectedAsset.status}</span>
              </div>
              <div className="p-6">
                <textarea
                  value={editingBody}
                  onChange={e => setEditingBody(e.target.value)}
                  className="w-full bg-white border border-border rounded-xl px-4 py-3 text-xs font-medium outline-none min-h-[350px] resize-y leading-relaxed focus:border-gold"
                />
              </div>
              <div className="px-6 pb-5 flex justify-end gap-2">
                <button onClick={handleSaveEdit} disabled={saving}
                  className="px-5 py-2 bg-navy-900 text-white rounded-lg text-xs font-bold hover:bg-navy-800 disabled:opacity-50 flex items-center gap-2">
                  {saving ? <Loader2 className="animate-spin" size={12} /> : <Edit3 size={12} />} Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-ivory-surface border border-dashed border-border rounded-2xl p-16 text-center">
              <div>
                <FileText size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-navy-900 font-bold">Select or generate content</p>
                <p className="text-xs text-slate-500 mt-1">Use the generator above to create SEO-optimized content</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== Tab 4: SEO Optimizer ====================

const SEOOptimizerTab: React.FC<{
  contentAssets: any[];
  onRefresh: () => void;
  toast: any;
}> = ({ contentAssets, onRefresh, toast }) => {
  const [selectedId, setSelectedId] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [generatingSchema, setGeneratingSchema] = useState(false);
  const [suggestingLinks, setSuggestingLinks] = useState(false);
  const [seoScore, setSeoScore] = useState<any>(null);
  const [internalLinks, setInternalLinks] = useState<any[]>([]);
  const [structuredData, setStructuredData] = useState<any[]>([]);

  const selectedAsset = contentAssets.find(a => (a.id || a._id) === selectedId);

  const handleAnalyze = async () => {
    if (!selectedId) return;
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/seo/analyze/${selectedId}`, { method: 'POST' });
      if (!res.ok) throw new Error((await res.json()).error || 'Analysis failed');
      const data = await res.json();
      setSeoScore(data.seoScore);
      toast.success(`SEO Score: ${data.seoScore.overall}/100`);
      onRefresh();
    } catch (err: any) {
      toast.error('Analysis failed', err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleOptimize = async () => {
    if (!selectedId) return;
    setOptimizing(true);
    try {
      const res = await fetch(`/api/seo/optimize/${selectedId}`, { method: 'POST' });
      if (!res.ok) throw new Error((await res.json()).error || 'Optimization failed');
      const data = await res.json();
      toast.success(`Content optimized! ${(data.changesApplied || []).length} changes applied`);
      setSeoScore(null);
      onRefresh();
    } catch (err: any) {
      toast.error('Optimization failed', err.message);
    } finally {
      setOptimizing(false);
    }
  };

  const handleSuggestLinks = async () => {
    if (!selectedId) return;
    setSuggestingLinks(true);
    try {
      const res = await fetch('/api/seo/internal-links/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId: selectedId })
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setInternalLinks(data.suggestions || []);
    } catch (err: any) {
      toast.error('Link suggestion failed', err.message);
    } finally {
      setSuggestingLinks(false);
    }
  };

  const handleGenerateSchema = async () => {
    if (!selectedId) return;
    setGeneratingSchema(true);
    try {
      const res = await fetch('/api/seo/structured-data/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId: selectedId })
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setStructuredData(data.structuredData || []);
      toast.success(`Generated ${(data.structuredData || []).length} schema types`);
    } catch (err: any) {
      toast.error('Schema generation failed', err.message);
    } finally {
      setGeneratingSchema(false);
    }
  };

  const scoreColor = (score: number) => score >= 70 ? 'text-emerald-600' : score >= 40 ? 'text-amber-600' : 'text-red-600';
  const scoreBg = (score: number) => score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="space-y-6">
      {/* Asset Selector */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Select Content to Optimize</label>
          <select value={selectedId} onChange={e => { setSelectedId(e.target.value); setSeoScore(null); setInternalLinks([]); setStructuredData([]); }}
            className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-xs outline-none">
            <option value="">— Select content asset —</option>
            {contentAssets.map(a => (
              <option key={a.id || a._id} value={a.id || a._id}>
                {a.title} ({a.status}{a.seoScore?.overall ? ` · SEO: ${a.seoScore.overall}` : ''})
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 pt-4">
          <button onClick={handleAnalyze} disabled={!selectedId || analyzing}
            className="px-4 py-2.5 bg-navy-900 text-white rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-1.5">
            {analyzing ? <Loader2 className="animate-spin" size={12} /> : <BarChart3 size={12} />} Analyze SEO
          </button>
          <button onClick={handleOptimize} disabled={!selectedId || optimizing}
            className="px-4 py-2.5 bg-gold text-navy-900 rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-1.5">
            {optimizing ? <Loader2 className="animate-spin" size={12} /> : <Zap size={12} />} Auto-Optimize
          </button>
        </div>
      </div>

      {/* Score Dashboard */}
      {(seoScore || selectedAsset?.seoScore) && (() => {
        const score = seoScore || selectedAsset?.seoScore;
        return (
          <div className="bg-ivory-surface border border-border rounded-2xl p-6">
            <div className="flex items-center gap-6 mb-6">
              <div className="text-center">
                <p className={`text-4xl font-bold ${scoreColor(score.overall)}`}>{score.overall}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase">Overall</p>
              </div>
              <div className="flex-1 grid grid-cols-5 gap-3">
                {[
                  { label: 'Keywords', value: score.breakdown.keywordOptimization, weight: '30%' },
                  { label: 'Readability', value: score.breakdown.readability, weight: '20%' },
                  { label: 'Structure', value: score.breakdown.structure, weight: '25%' },
                  { label: 'Internal Links', value: score.breakdown.internalLinking, weight: '15%' },
                  { label: 'Meta Tags', value: score.breakdown.metaTags, weight: '10%' },
                ].map(dim => (
                  <div key={dim.label} className="text-center">
                    <p className={`text-lg font-bold ${scoreColor(dim.value)}`}>{dim.value}</p>
                    <p className="text-[9px] text-slate-400 font-bold">{dim.label}</p>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                      <div className={`h-1.5 rounded-full ${scoreBg(dim.value)}`} style={{ width: `${dim.value}%` }} />
                    </div>
                    <p className="text-[8px] text-slate-300 mt-0.5">weight {dim.weight}</p>
                  </div>
                ))}
              </div>
            </div>
            {score.suggestions?.length > 0 && (
              <div className="border-t border-border pt-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Improvement Suggestions</p>
                <div className="space-y-2">
                  {score.suggestions.map((s: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-navy-900">
                      <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Tools Row */}
      {selectedId && (
        <div className="grid grid-cols-2 gap-4">
          {/* Internal Links */}
          <div className="bg-ivory-surface border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-navy-900 flex items-center gap-2"><Link2 size={14} className="text-gold" /> Internal Links</h4>
              <button onClick={handleSuggestLinks} disabled={suggestingLinks}
                className="text-[10px] font-bold text-navy-900 hover:text-gold flex items-center gap-1">
                {suggestingLinks ? <Loader2 className="animate-spin" size={10} /> : <RefreshCw size={10} />} Suggest
              </button>
            </div>
            {internalLinks.length > 0 ? (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {internalLinks.map((link: any, i: number) => (
                  <div key={i} className="bg-white rounded-lg px-3 py-2 text-[10px] border border-border/50">
                    <p className="font-bold text-navy-900">"{link.anchorText}" <ArrowRight size={10} className="inline text-gold" /> /{link.targetSlug}</p>
                    <p className="text-slate-400 mt-0.5">{link.reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 text-center py-4">Click "Suggest" to generate internal link recommendations</p>
            )}
          </div>

          {/* Structured Data */}
          <div className="bg-ivory-surface border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-navy-900 flex items-center gap-2"><Globe size={14} className="text-gold" /> Structured Data</h4>
              <button onClick={handleGenerateSchema} disabled={generatingSchema}
                className="text-[10px] font-bold text-navy-900 hover:text-gold flex items-center gap-1">
                {generatingSchema ? <Loader2 className="animate-spin" size={10} /> : <Zap size={10} />} Generate
              </button>
            </div>
            {structuredData.length > 0 ? (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {structuredData.map((sd: any, i: number) => (
                  <div key={i} className="bg-white rounded-lg px-3 py-2 text-[10px] border border-border/50">
                    <p className="font-bold text-navy-900">{sd.type}</p>
                    <pre className="text-[8px] text-slate-400 mt-1 overflow-hidden max-h-[60px]">
                      {JSON.stringify(sd.schema, null, 2).substring(0, 200)}...
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 text-center py-4">Click "Generate" to create Schema.org JSON-LD</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== Tab 5: Multi-Format Output ====================

const MultiFormatOutputTab: React.FC<{
  contentAssets: any[];
  onRefresh: () => void;
  toast: any;
}> = ({ contentAssets, onRefresh, toast }) => {
  const [selectedId, setSelectedId] = useState<string>('');
  const [deriving, setDeriving] = useState<string>('');
  const [derivedList, setDerivedList] = useState<DerivedContentFE[]>([]);
  const [publishing, setPublishing] = useState(false);

  const formats: { id: string; label: string; icon: React.FC<any>; desc: string }[] = [
    { id: 'linkedin-post', label: 'LinkedIn Post', icon: MessageSquare, desc: 'Professional post for B2B decision makers' },
    { id: 'twitter-thread', label: 'Twitter Thread', icon: MessageSquare, desc: '5-8 tweet thread with hooks' },
    { id: 'email-sequence', label: 'Email Sequence', icon: Mail, desc: '3-email drip campaign' },
    { id: 'ppt-outline', label: 'PPT Outline', icon: FileText, desc: '10-15 slide presentation structure' },
    { id: 'social-summary', label: 'Social Summary', icon: Share2, desc: 'Multi-platform summary package' },
  ];

  // Fetch derived content for selected asset
  useEffect(() => {
    if (!selectedId) { setDerivedList([]); return; }
    (async () => {
      try {
        const res = await fetch(`/api/seo/content/${selectedId}/derived`);
        if (res.ok) setDerivedList(await res.json());
      } catch { /* silent */ }
    })();
  }, [selectedId]);

  const handleDerive = async (format: string) => {
    if (!selectedId) return;
    setDeriving(format);
    try {
      const res = await fetch(`/api/seo/content/${selectedId}/derive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Derivation failed');
      const derived = await res.json();
      toast.success(`${format} content generated`);
      setDerivedList(prev => [derived, ...prev]);
    } catch (err: any) {
      toast.error('Derivation failed', err.message);
    } finally {
      setDeriving('');
    }
  };

  const handlePublish = async (channel: string) => {
    if (!selectedId) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/seo/content/${selectedId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel })
      });
      if (!res.ok) throw new Error('Publish failed');
      toast.success(`Published to ${channel}`);
      onRefresh();
    } catch (err: any) {
      toast.error('Publish failed', err.message);
    } finally {
      setPublishing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success('Copied to clipboard'));
  };

  return (
    <div className="space-y-6">
      {/* Asset Selector */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Select Source Content</label>
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
            className="w-full bg-white border border-border rounded-lg px-3 py-2.5 text-xs outline-none">
            <option value="">— Select content asset —</option>
            {contentAssets.map(a => (
              <option key={a.id || a._id} value={a.id || a._id}>{a.title} ({a.status})</option>
            ))}
          </select>
        </div>
        {selectedId && (
          <div className="flex gap-2 pt-4">
            <button onClick={() => handlePublish('website')} disabled={publishing}
              className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-1.5">
              <Globe size={12} /> Publish to Website
            </button>
            <button onClick={() => handlePublish('brand-hub')} disabled={publishing}
              className="px-4 py-2.5 bg-navy-900 text-white rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-1.5">
              <Send size={12} /> Push to Brand Hub
            </button>
          </div>
        )}
      </div>

      {selectedId && (
        <>
          {/* Format Derivation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {formats.map(fmt => {
              const Icon = fmt.icon;
              const existing = derivedList.find(d => d.format === fmt.id);
              return (
                <div key={fmt.id} className={`bg-ivory-surface border rounded-2xl p-4 text-center space-y-2 transition-all ${
                  existing ? 'border-emerald-200' : 'border-border hover:border-gold/30'
                }`}>
                  <Icon size={24} className={`mx-auto ${existing ? 'text-emerald-500' : 'text-slate-300'}`} />
                  <p className="text-[11px] font-bold text-navy-900">{fmt.label}</p>
                  <p className="text-[9px] text-slate-400">{fmt.desc}</p>
                  <button
                    onClick={() => handleDerive(fmt.id)}
                    disabled={deriving === fmt.id}
                    className={`w-full py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                      existing ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-navy-900 text-white hover:bg-navy-800'
                    } disabled:opacity-50`}
                  >
                    {deriving === fmt.id ? <Loader2 className="animate-spin" size={10} /> : existing ? <RefreshCw size={10} /> : <Sparkles size={10} />}
                    {existing ? 'Regenerate' : 'Generate'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Derived Content Preview */}
          {derivedList.length > 0 && (
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generated Derivatives ({derivedList.length})</p>
              {derivedList.map((d, i) => (
                <div key={d.id || i} className="bg-ivory-surface border border-border rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between bg-ivory/30">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-navy-900/10 text-navy-900 uppercase">{d.format}</span>
                      {d.metadata?.wordCount && <span className="text-[9px] text-slate-400">{d.metadata.wordCount} words</span>}
                      {d.metadata?.tweetCount && <span className="text-[9px] text-slate-400">{d.metadata.tweetCount} tweets</span>}
                      {d.metadata?.emailCount && <span className="text-[9px] text-slate-400">{d.metadata.emailCount} emails</span>}
                    </div>
                    <button onClick={() => copyToClipboard(Array.isArray(d.content) ? d.content.join('\n\n---\n\n') : d.content)}
                      className="text-[10px] font-bold text-slate-500 hover:text-navy-900 flex items-center gap-1">
                      <Copy size={10} /> Copy
                    </button>
                  </div>
                  <div className="p-5">
                    <pre className="text-xs text-navy-900 whitespace-pre-wrap leading-relaxed max-h-[200px] overflow-y-auto">
                      {Array.isArray(d.content)
                        ? d.content.map((c: any, idx: number) => typeof c === 'object' ? `[${idx + 1}] ${c.subject || ''}\n${c.body || JSON.stringify(c)}` : `[${idx + 1}] ${c}`).join('\n\n')
                        : d.content
                      }
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!selectedId && (
        <div className="text-center py-20 bg-ivory-surface border border-dashed border-border rounded-3xl">
          <Share2 size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-navy-900 font-bold">Select a content asset to generate derivatives</p>
          <p className="text-xs text-slate-500 mt-1">Transform SEO content into LinkedIn posts, Twitter threads, email sequences, and more</p>
        </div>
      )}
    </div>
  );
};

export default MarketingDrive;
