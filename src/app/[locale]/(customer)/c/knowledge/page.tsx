"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Upload, 
  FileText, 
  Loader2, 
  Sparkles, 
  CheckCircle2,
  FileSpreadsheet,
  Presentation,
  Building2,
  Target,
  Award,
  Users,
  Zap,
  TrendingUp,
  Globe2,
  RefreshCw,
  AlertCircle,
  FolderOpen,
  Clock,
} from 'lucide-react';
import { 
  getCompanyProfile, 
  getAnalyzableAssets, 
  analyzeAssets,
  type CompanyProfileData 
} from '@/actions/knowledge';

// Supported file formats display
const SUPPORTED_FORMATS = [
  { label: '文档', icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-50' },
  { label: '演示文稿', icon: Presentation, color: 'text-orange-500', bgColor: 'bg-orange-50' },
  { label: '表格', icon: FileSpreadsheet, color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
];

type AssetItem = {
  id: string;
  originalName: string;
  fileCategory: string;
  mimeType: string;
  fileSize: number;
  createdAt: Date;
};

export default function KnowledgeEnginePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [profile, setProfile] = useState<CompanyProfileData | null>(null);

  // 加载数据
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [profileData, assetsData] = await Promise.all([
        getCompanyProfile(),
        getAnalyzableAssets(),
      ]);
      setProfile(profileData);
      setAssets(assetsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // AI 分析
  const handleAnalyze = async () => {
    if (selectedAssetIds.length === 0) return;
    
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeAssets(selectedAssetIds);
      setProfile(result);
      setSelectedAssetIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI分析失败');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 切换素材选择
  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssetIds(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  // 计算知识完整度
  const calculateCompleteness = () => {
    if (!profile) return 0;
    let score = 0;
    if (profile.companyName) score += 10;
    if (profile.companyIntro) score += 10;
    if (profile.coreProducts?.length > 0) score += 15;
    if (profile.techAdvantages?.length > 0) score += 15;
    if (profile.scenarios?.length > 0) score += 10;
    if (profile.differentiators?.length > 0) score += 10;
    if (profile.targetIndustries?.length > 0) score += 10;
    if (profile.targetRegions?.length > 0) score += 5;
    if (profile.buyerPersonas?.length > 0) score += 10;
    if (profile.painPoints?.length > 0) score += 5;
    return Math.min(score, 100);
  };

  const completeness = calculateCompleteness();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#C7A56A] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1B2B]">知识引擎</h1>
          <p className="text-sm text-slate-500 mt-1">上传企业资料，AI自动提炼企业能力画像</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">知识完整度</span>
            <div className="w-32 h-2 bg-[#E7E0D3] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#C7A56A] rounded-full transition-all duration-500" 
                style={{ width: `${completeness}%` }}
              />
            </div>
            <span className="text-sm font-bold text-[#C7A56A]">{completeness}%</span>
          </div>
          <button 
            onClick={loadData}
            className="p-2 text-slate-400 hover:text-[#C7A56A] transition-colors"
            title="刷新数据"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-red-500 shrink-0" size={20} />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Document Management */}
        <div className="col-span-1 space-y-6">
          {/* Upload Zone - Link to Assets */}
          <div className="bg-[#FFFCF6] rounded-2xl border border-[#E7E0D3] p-6">
            <h3 className="font-bold text-[#0B1B2B] mb-4">上传企业资料</h3>
            <Link 
              href="/c/assets"
              className="block border-2 border-dashed border-[#E7E0D3] rounded-xl p-8 text-center hover:border-[#C7A56A]/50 transition-colors cursor-pointer"
            >
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <p className="text-sm text-slate-600">前往素材中心上传</p>
              <p className="text-xs text-slate-400 mt-1">支持 PDF、Word、PPT、Excel</p>
            </Link>

            {/* Supported formats */}
            <div className="mt-4 flex gap-2">
              {SUPPORTED_FORMATS.map((format) => (
                <div key={format.label} className={`flex items-center gap-1 px-2 py-1 rounded ${format.bgColor}`}>
                  <format.icon size={12} className={format.color} />
                  <span className="text-[10px] text-slate-600">{format.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Document List */}
          <div className="bg-[#FFFCF6] rounded-2xl border border-[#E7E0D3] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0B1B2B]">可分析素材</h3>
              <span className="text-xs text-slate-400">{assets.length} 个文件</span>
            </div>
            
            {assets.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">暂无可分析的素材</p>
                <Link href="/c/assets" className="text-xs text-[#C7A56A] hover:underline mt-2 inline-block">
                  前往上传
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {assets.map((asset) => (
                  <div 
                    key={asset.id}
                    onClick={() => toggleAssetSelection(asset.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedAssetIds.includes(asset.id)
                        ? 'border-[#C7A56A] bg-[#C7A56A]/5'
                        : 'border-[#E7E0D3] hover:border-[#C7A56A]/30'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50">
                      <FileText size={16} className="text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0B1B2B] truncate">{asset.originalName}</p>
                      <p className="text-[10px] text-slate-400">
                        {formatFileSize(asset.fileSize)} · {new Date(asset.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    {selectedAssetIds.includes(asset.id) && (
                      <CheckCircle2 size={16} className="text-[#C7A56A] shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={selectedAssetIds.length === 0 || isAnalyzing}
              className="w-full mt-4 py-3 bg-[#0B1B2B] text-[#C7A56A] rounded-xl font-medium text-sm hover:bg-[#10263B] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  AI分析中...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  AI分析生成画像 ({selectedAssetIds.length})
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Company Profile (企业能力画像) */}
        <div className="col-span-2 space-y-6">
          {!profile ? (
            <div className="bg-[#FFFCF6] rounded-2xl border border-[#E7E0D3] p-12 text-center">
              <Building2 size={48} className="text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-[#0B1B2B] mb-2">尚未生成企业能力画像</h3>
              <p className="text-sm text-slate-500 mb-4">选择左侧素材，点击"AI分析"自动生成</p>
            </div>
          ) : (
            <>
              {/* Profile Header */}
              <div className="bg-[#FFFCF6] rounded-2xl border border-[#E7E0D3] p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#C7A56A] to-[#C7A56A]/80 rounded-xl flex items-center justify-center">
                    <Building2 size={24} className="text-[#0B1B2B]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#0B1B2B]">{profile.companyName || '企业名称'}</h2>
                    <p className="text-sm text-slate-500">企业能力画像</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    {profile.lastAnalyzedAt && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(profile.lastAnalyzedAt).toLocaleString('zh-CN')}
                      </span>
                    )}
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs rounded-full">
                      {profile.aiModel || 'AI生成'}
                    </span>
                  </div>
                </div>

                {profile.companyIntro && (
                  <p className="text-sm text-slate-600 leading-relaxed mb-6 p-4 bg-[#F7F3EA] rounded-xl">
                    {profile.companyIntro}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {/* Core Products */}
                  <div className="p-4 border border-[#E7E0D3] rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Award size={16} className="text-[#C7A56A]" />
                      <h4 className="font-bold text-[#0B1B2B] text-sm">核心产品</h4>
                    </div>
                    {profile.coreProducts?.length > 0 ? (
                      <ul className="space-y-2">
                        {profile.coreProducts.map((item, i) => (
                          <li key={i} className="text-xs text-slate-600">
                            <span className="font-medium text-[#0B1B2B]">{item.name}</span>
                            {item.description && (
                              <p className="text-slate-400 mt-0.5">{item.description}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400">暂无数据</p>
                    )}
                  </div>

                  {/* Tech Advantages */}
                  <div className="p-4 border border-[#E7E0D3] rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap size={16} className="text-[#C7A56A]" />
                      <h4 className="font-bold text-[#0B1B2B] text-sm">技术优势</h4>
                    </div>
                    {profile.techAdvantages?.length > 0 ? (
                      <ul className="space-y-2">
                        {profile.techAdvantages.map((item, i) => (
                          <li key={i} className="text-xs text-slate-600">
                            <span className="font-medium text-[#0B1B2B]">{item.title}</span>
                            {item.description && (
                              <p className="text-slate-400 mt-0.5">{item.description}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400">暂无数据</p>
                    )}
                  </div>

                  {/* Application Scenarios */}
                  <div className="p-4 border border-[#E7E0D3] rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Target size={16} className="text-[#C7A56A]" />
                      <h4 className="font-bold text-[#0B1B2B] text-sm">应用场景</h4>
                    </div>
                    {profile.scenarios?.length > 0 ? (
                      <div className="space-y-2">
                        {profile.scenarios.map((item, i) => (
                          <div key={i} className="text-xs">
                            <span className="px-2 py-1 bg-[#F7F3EA] text-[#0B1B2B] rounded mr-1">
                              {item.industry}
                            </span>
                            <span className="text-slate-500">{item.scenario}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">暂无数据</p>
                    )}
                  </div>

                  {/* Differentiators */}
                  <div className="p-4 border border-[#E7E0D3] rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp size={16} className="text-[#C7A56A]" />
                      <h4 className="font-bold text-[#0B1B2B] text-sm">差异化优势</h4>
                    </div>
                    {profile.differentiators?.length > 0 ? (
                      <ul className="space-y-2">
                        {profile.differentiators.map((item, i) => (
                          <li key={i} className="text-xs text-slate-600">
                            <span className="font-medium text-[#0B1B2B]">{item.point}</span>
                            {item.description && (
                              <p className="text-slate-400 mt-0.5">{item.description}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400">暂无数据</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ICP Section */}
              <div className="bg-[#FFFCF6] rounded-2xl border border-[#E7E0D3] p-6">
                <h3 className="font-bold text-[#0B1B2B] mb-4 flex items-center gap-2">
                  <Users size={18} className="text-[#C7A56A]" />
                  目标客户画像 (ICP)
                </h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-4 bg-[#F7F3EA] rounded-xl">
                    <p className="text-xs text-slate-500 mb-2">目标行业</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.targetIndustries?.length > 0 ? (
                        profile.targetIndustries.map((item, i) => (
                          <span key={i} className="px-2 py-1 bg-white text-xs text-[#0B1B2B] rounded border border-[#E7E0D3]">
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">暂无数据</span>
                      )}
                    </div>
                  </div>
                  <div className="p-4 bg-[#F7F3EA] rounded-xl">
                    <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                      <Globe2 size={12} />
                      目标区域
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.targetRegions?.length > 0 ? (
                        profile.targetRegions.map((item, i) => (
                          <span key={i} className="px-2 py-1 bg-white text-xs text-[#0B1B2B] rounded border border-[#E7E0D3]">
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">暂无数据</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Buyer Personas */}
                {profile.buyerPersonas?.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {profile.buyerPersonas.map((persona, i) => (
                      <div key={i} className="p-4 border border-[#E7E0D3] rounded-xl">
                        <p className="font-medium text-[#0B1B2B] text-sm">{persona.role}</p>
                        {persona.title && <p className="text-xs text-slate-500">{persona.title}</p>}
                        {persona.concerns?.length > 0 && (
                          <>
                            <p className="text-[10px] text-slate-500 mt-2 mb-1">关注点：</p>
                            <div className="flex flex-wrap gap-1">
                              {persona.concerns.map((concern, j) => (
                                <span key={j} className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] rounded">
                                  {concern}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Pain Points */}
                {profile.painPoints?.length > 0 && (
                  <div className="p-4 border border-[#E7E0D3] rounded-xl">
                    <p className="text-xs font-medium text-[#0B1B2B] mb-2">客户痛点与解决方案</p>
                    <div className="space-y-2">
                      {profile.painPoints.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded shrink-0">
                            {item.pain}
                          </span>
                          <span className="text-slate-500">→</span>
                          <span className="text-slate-600">{item.howWeHelp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
