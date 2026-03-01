import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { LeadRun, Product, CountryConfig } from '../types';
import { Play, Clock, CheckCircle2, AlertCircle, RefreshCw, Plus, Globe, Languages, Target, Search, Building2, FileText, Calendar, Loader2, Users, Zap, ChevronDown, ChevronUp, X, Star, Sliders, ShieldCheck, XCircle, HelpCircle } from 'lucide-react';

interface LeadRunsProps {
  onViewPool: () => void;
}

// 完整全球国家列表（按洲分组）
const ALL_COUNTRIES = [
  // 欧洲
  { code: 'DE', name: '德国', nameEN: 'Germany', language: '德语', languageEN: 'German', region: 'europe' },
  { code: 'GB', name: '英国', nameEN: 'United Kingdom', language: '英语', languageEN: 'English', region: 'europe' },
  { code: 'FR', name: '法国', nameEN: 'France', language: '法语', languageEN: 'French', region: 'europe' },
  { code: 'IT', name: '意大利', nameEN: 'Italy', language: '意大利语', languageEN: 'Italian', region: 'europe' },
  { code: 'ES', name: '西班牙', nameEN: 'Spain', language: '西班牙语', languageEN: 'Spanish', region: 'europe' },
  { code: 'NL', name: '荷兰', nameEN: 'Netherlands', language: '荷兰语', languageEN: 'Dutch', region: 'europe' },
  { code: 'PL', name: '波兰', nameEN: 'Poland', language: '波兰语', languageEN: 'Polish', region: 'europe' },
  { code: 'SE', name: '瑞典', nameEN: 'Sweden', language: '瑞典语', languageEN: 'Swedish', region: 'europe' },
  { code: 'NO', name: '挪威', nameEN: 'Norway', language: '挪威语', languageEN: 'Norwegian', region: 'europe' },
  { code: 'DK', name: '丹麦', nameEN: 'Denmark', language: '丹麦语', languageEN: 'Danish', region: 'europe' },
  { code: 'FI', name: '芬兰', nameEN: 'Finland', language: '芬兰语', languageEN: 'Finnish', region: 'europe' },
  { code: 'BE', name: '比利时', nameEN: 'Belgium', language: '荷兰语', languageEN: 'Dutch', region: 'europe' },
  { code: 'AT', name: '奥地利', nameEN: 'Austria', language: '德语', languageEN: 'German', region: 'europe' },
  { code: 'CH', name: '瑞士', nameEN: 'Switzerland', language: '德语', languageEN: 'German', region: 'europe' },
  { code: 'PT', name: '葡萄牙', nameEN: 'Portugal', language: '葡萄牙语', languageEN: 'Portuguese', region: 'europe' },
  { code: 'GR', name: '希腊', nameEN: 'Greece', language: '希腊语', languageEN: 'Greek', region: 'europe' },
  { code: 'CZ', name: '捷克', nameEN: 'Czech Republic', language: '捷克语', languageEN: 'Czech', region: 'europe' },
  { code: 'HU', name: '匈牙利', nameEN: 'Hungary', language: '匈牙利语', languageEN: 'Hungarian', region: 'europe' },
  { code: 'RO', name: '罗马尼亚', nameEN: 'Romania', language: '罗马尼亚语', languageEN: 'Romanian', region: 'europe' },
  { code: 'IE', name: '爱尔兰', nameEN: 'Ireland', language: '英语', languageEN: 'English', region: 'europe' },
  { code: 'SK', name: '斯洛伐克', nameEN: 'Slovakia', language: '斯洛伐克语', languageEN: 'Slovak', region: 'europe' },
  { code: 'BG', name: '保加利亚', nameEN: 'Bulgaria', language: '保加利亚语', languageEN: 'Bulgarian', region: 'europe' },
  { code: 'HR', name: '克罗地亚', nameEN: 'Croatia', language: '克罗地亚语', languageEN: 'Croatian', region: 'europe' },
  { code: 'SI', name: '斯洛文尼亚', nameEN: 'Slovenia', language: '斯洛文尼亚语', languageEN: 'Slovenian', region: 'europe' },
  { code: 'RS', name: '塞尔维亚', nameEN: 'Serbia', language: '塞尔维亚语', languageEN: 'Serbian', region: 'europe' },
  { code: 'UA', name: '乌克兰', nameEN: 'Ukraine', language: '乌克兰语', languageEN: 'Ukrainian', region: 'europe' },
  { code: 'RU', name: '俄罗斯', nameEN: 'Russia', language: '俄语', languageEN: 'Russian', region: 'europe' },
  { code: 'TR', name: '土耳其', nameEN: 'Turkey', language: '土耳其语', languageEN: 'Turkish', region: 'europe' },
  // 北美
  { code: 'US', name: '美国', nameEN: 'United States', language: '英语', languageEN: 'English', region: 'americas' },
  { code: 'CA', name: '加拿大', nameEN: 'Canada', language: '英语', languageEN: 'English', region: 'americas' },
  { code: 'MX', name: '墨西哥', nameEN: 'Mexico', language: '西班牙语', languageEN: 'Spanish', region: 'americas' },
  // 南美
  { code: 'BR', name: '巴西', nameEN: 'Brazil', language: '葡萄牙语', languageEN: 'Portuguese', region: 'americas' },
  { code: 'AR', name: '阿根廷', nameEN: 'Argentina', language: '西班牙语', languageEN: 'Spanish', region: 'americas' },
  { code: 'CL', name: '智利', nameEN: 'Chile', language: '西班牙语', languageEN: 'Spanish', region: 'americas' },
  { code: 'CO', name: '哥伦比亚', nameEN: 'Colombia', language: '西班牙语', languageEN: 'Spanish', region: 'americas' },
  { code: 'PE', name: '秘鲁', nameEN: 'Peru', language: '西班牙语', languageEN: 'Spanish', region: 'americas' },
  // 亚洲
  { code: 'JP', name: '日本', nameEN: 'Japan', language: '日语', languageEN: 'Japanese', region: 'asia' },
  { code: 'KR', name: '韩国', nameEN: 'South Korea', language: '韩语', languageEN: 'Korean', region: 'asia' },
  { code: 'IN', name: '印度', nameEN: 'India', language: '英语', languageEN: 'English', region: 'asia' },
  { code: 'TH', name: '泰国', nameEN: 'Thailand', language: '泰语', languageEN: 'Thai', region: 'asia' },
  { code: 'VN', name: '越南', nameEN: 'Vietnam', language: '越南语', languageEN: 'Vietnamese', region: 'asia' },
  { code: 'ID', name: '印度尼西亚', nameEN: 'Indonesia', language: '印尼语', languageEN: 'Indonesian', region: 'asia' },
  { code: 'MY', name: '马来西亚', nameEN: 'Malaysia', language: '英语', languageEN: 'English', region: 'asia' },
  { code: 'SG', name: '新加坡', nameEN: 'Singapore', language: '英语', languageEN: 'English', region: 'asia' },
  { code: 'PH', name: '菲律宾', nameEN: 'Philippines', language: '英语', languageEN: 'English', region: 'asia' },
  { code: 'PK', name: '巴基斯坦', nameEN: 'Pakistan', language: '英语', languageEN: 'English', region: 'asia' },
  { code: 'BD', name: '孟加拉国', nameEN: 'Bangladesh', language: '英语', languageEN: 'English', region: 'asia' },
  { code: 'TW', name: '台湾', nameEN: 'Taiwan', language: '中文', languageEN: 'Chinese', region: 'asia' },
  { code: 'HK', name: '香港', nameEN: 'Hong Kong', language: '中文', languageEN: 'Chinese', region: 'asia' },
  // 中东
  { code: 'AE', name: '阿联酋', nameEN: 'United Arab Emirates', language: '阿拉伯语', languageEN: 'Arabic', region: 'middleeast' },
  { code: 'SA', name: '沙特阿拉伯', nameEN: 'Saudi Arabia', language: '阿拉伯语', languageEN: 'Arabic', region: 'middleeast' },
  { code: 'IL', name: '以色列', nameEN: 'Israel', language: '希伯来语', languageEN: 'Hebrew', region: 'middleeast' },
  { code: 'QA', name: '卡塔尔', nameEN: 'Qatar', language: '阿拉伯语', languageEN: 'Arabic', region: 'middleeast' },
  { code: 'KW', name: '科威特', nameEN: 'Kuwait', language: '阿拉伯语', languageEN: 'Arabic', region: 'middleeast' },
  { code: 'OM', name: '阿曼', nameEN: 'Oman', language: '阿拉伯语', languageEN: 'Arabic', region: 'middleeast' },
  { code: 'BH', name: '巴林', nameEN: 'Bahrain', language: '阿拉伯语', languageEN: 'Arabic', region: 'middleeast' },
  { code: 'EG', name: '埃及', nameEN: 'Egypt', language: '阿拉伯语', languageEN: 'Arabic', region: 'middleeast' },
  // 非洲
  { code: 'ZA', name: '南非', nameEN: 'South Africa', language: '英语', languageEN: 'English', region: 'africa' },
  { code: 'NG', name: '尼日利亚', nameEN: 'Nigeria', language: '英语', languageEN: 'English', region: 'africa' },
  { code: 'KE', name: '肯尼亚', nameEN: 'Kenya', language: '英语', languageEN: 'English', region: 'africa' },
  { code: 'MA', name: '摩洛哥', nameEN: 'Morocco', language: '阿拉伯语', languageEN: 'Arabic', region: 'africa' },
  { code: 'TN', name: '突尼斯', nameEN: 'Tunisia', language: '阿拉伯语', languageEN: 'Arabic', region: 'africa' },
  { code: 'GH', name: '加纳', nameEN: 'Ghana', language: '英语', languageEN: 'English', region: 'africa' },
  // 大洋洲
  { code: 'AU', name: '澳大利亚', nameEN: 'Australia', language: '英语', languageEN: 'English', region: 'oceania' },
  { code: 'NZ', name: '新西兰', nameEN: 'New Zealand', language: '英语', languageEN: 'English', region: 'oceania' },
];

const REGION_LABELS: Record<string, string> = {
  europe: '欧洲',
  americas: '美洲',
  asia: '亚洲',
  middleeast: '中东',
  africa: '非洲',
  oceania: '大洋洲'
};

// 搜索策略
const SEARCH_STRATEGIES = [
  { id: 'comprehensive', name: '综合搜索', description: '多渠道综合搜索，覆盖面广', icon: Search },
  { id: 'directory', name: '行业目录优先', description: '优先搜索 Kompass、Europages 等 B2B 目录', icon: Building2 },
  { id: 'tender', name: '招投标优先', description: '优先搜索政府采购和招标公告，线索质量高', icon: FileText },
  { id: 'exhibition', name: '展会参展商', description: '从行业展会参展商名录中发现潜在客户', icon: Calendar },
];

type PipelineStage = 'idle' | 'discovery' | 'website-analysis' | 'enrichment' | 'contacts' | 'done' | 'error';

interface ActivePipeline {
  runId: string;
  stage: PipelineStage;
  totalQueries: number;
  completedQueries: number;
  discoveredCompanies: number;
  analyzedCompanies: number;
  qualifiedCompanies: number;
  filteredCompanies: number;
  enrichedCompanies: number;
  totalContacts: number;
  totalCompanies: number;
  targetCompanyCount: number;
  countries: CountryConfig[];
  currentCountryIndex: number;
  log: string[];
  error?: string;
}

// 查询配额分配算法
function allocateQueries(countries: Array<{ code: string; priority: 'high' | 'medium' | 'low' }>, targetCount: number): Map<string, number> {
  const avgCompaniesPerQuery = 4;
  const totalQueries = Math.ceil(targetCount / avgCompaniesPerQuery);
  const weights: Record<string, number> = { high: 0.5, medium: 0.3, low: 0.2 };
  const totalWeight = countries.reduce((sum, c) => sum + weights[c.priority], 0);
  
  const allocation = new Map<string, number>();
  countries.forEach(c => {
    allocation.set(c.code, Math.max(1, Math.ceil(totalQueries * weights[c.priority] / totalWeight)));
  });
  return allocation;
}

const LeadRuns: React.FC<LeadRunsProps> = ({ onViewPool }) => {
  const [runs, setRuns] = useState<LeadRun[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newRun, setNewRun] = useState({
    productId: '',
    countryCodes: [] as string[],      // 多选国家
    targetCompanyCount: 30,            // 目标公司数
    strategy: 'comprehensive'
  });
  const [activePipeline, setActivePipeline] = useState<ActivePipeline | null>(null);
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const pipelineRef = useRef<boolean>(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  const selectedProduct = products.find(p => p.id === newRun.productId);
  const selectedCountries = ALL_COUNTRIES.filter(c => newRun.countryCodes.includes(c.code));

  // 从 ICP 画像中提取推荐国家
  const icpTargetRegions = useMemo(() => {
    if (!selectedProduct?.icpProfile?.companyProfile?.targetRegions) return [];
    return selectedProduct.icpProfile.companyProfile.targetRegions
      .sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return (order[a.priority] || 2) - (order[b.priority] || 2);
      })
      .map(tr => {
        // 尝试从 region 名称匹配国家
        const match = ALL_COUNTRIES.find(c => 
          c.name === tr.region || 
          c.nameEN.toLowerCase() === tr.region.toLowerCase() ||
          tr.region.includes(c.name) ||
          tr.region.toLowerCase().includes(c.nameEN.toLowerCase())
        );
        return { ...tr, country: match };
      })
      .filter(tr => tr.country);
  }, [selectedProduct]);

  // 过滤国家列表
  const filteredCountries = useMemo(() => {
    if (!countrySearch) return ALL_COUNTRIES;
    const q = countrySearch.toLowerCase();
    return ALL_COUNTRIES.filter(c => 
      c.name.includes(countrySearch) ||
      c.nameEN.toLowerCase().includes(q) ||
      c.code.toLowerCase() === q
    );
  }, [countrySearch]);

  useEffect(() => {
    fetch('/api/runs').then(res => res.json()).then(setRuns);
    fetch('/api/products').then(res => res.json()).then(data => {
      setProducts(data);
      if (data.length > 0) setNewRun(prev => ({ ...prev, productId: data[0].id }));
    });
  }, []);

  // 当选择产品变化时，自动选中高优先级 ICP 推荐国家
  useEffect(() => {
    if (icpTargetRegions.length > 0) {
      // 自动选中 high 和 medium 优先级的国家
      const autoSelect = icpTargetRegions
        .filter(tr => tr.priority === 'high' || tr.priority === 'medium')
        .map(tr => tr.country!.code);
      if (autoSelect.length > 0) {
        setNewRun(prev => ({ ...prev, countryCodes: autoSelect }));
      }
    }
  }, [icpTargetRegions]);

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Refresh runs list periodically when pipeline is active
  useEffect(() => {
    if (!activePipeline) return;
    const interval = setInterval(() => {
      fetch('/api/runs').then(res => res.json()).then(setRuns);
    }, 3000);
    return () => clearInterval(interval);
  }, [activePipeline]);

  const addLog = useCallback((msg: string) => {
    setActivePipeline(prev => prev ? { ...prev, log: [...prev.log, `[${new Date().toLocaleTimeString('zh-CN')}] ${msg}`] } : prev);
  }, []);

  // === Frontend Pipeline Orchestrator (Multi-Country Serial Execution) ===
  const executePipeline = useCallback(async (runId: string, targetCompanyCount: number, countries: CountryConfig[]) => {
    if (pipelineRef.current) return;
    pipelineRef.current = true;

    const pipeline: ActivePipeline = {
      runId,
      stage: 'discovery',
      totalQueries: countries.reduce((sum, c) => sum + c.allocatedQueries, 0),
      completedQueries: 0,
      discoveredCompanies: 0,
      analyzedCompanies: 0,
      qualifiedCompanies: 0,
      filteredCompanies: 0,
      enrichedCompanies: 0,
      totalContacts: 0,
      totalCompanies: 0,
      targetCompanyCount,
      countries,
      currentCountryIndex: 0,
      log: [`Pipeline started - Target: ${targetCompanyCount} companies across ${countries.length} countries`]
    };
    setActivePipeline(pipeline);

    try {
      // === Phase 1: Discovery (Multi-Country Serial) ===
      const allCompanyIds: string[] = [];
      let reachedTarget = false;

      while (!reachedTarget) {
        setActivePipeline(prev => prev ? { ...prev, stage: 'discovery' } : prev);
        
        const res = await fetch(`/api/runs/${runId}/discover`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();

        if (!res.ok) {
          addLog(`Discovery error: ${data.error || 'Unknown error'}`);
          break;
        }

        // 检查是否达到目标
        if (data.reachedTarget) {
          addLog(`Target reached: ${data.totalDiscovered} companies discovered`);
          reachedTarget = true;
          break;
        }

        // 检查是否切换国家
        if (data.switchedCountry) {
          addLog(`Switched to country: ${data.nextCountry?.countryNameCN || 'next'}`);
          setActivePipeline(prev => prev ? {
            ...prev,
            currentCountryIndex: data.currentCountryIndex || prev.currentCountryIndex + 1
          } : prev);
          continue;
        }

        // 处理新发现的公司
        if (data.companies && data.companies.length > 0) {
          const newIds = data.companies.map((c: any) => c.id);
          allCompanyIds.push(...newIds);
          addLog(`Found ${data.companies.length} companies in ${data.currentCountry?.countryNameCN || 'current country'}`);
          setActivePipeline(prev => prev ? {
            ...prev,
            completedQueries: prev.completedQueries + 1,
            discoveredCompanies: data.totalDiscovered || prev.discoveredCompanies + data.companies.length
          } : prev);
        }

        // 检查是否所有国家已处理完
        if (data.allCountriesExhausted) {
          addLog('All countries exhausted, stopping discovery');
          break;
        }

        // 防止无限循环
        if (allCompanyIds.length >= targetCompanyCount * 2) {
          addLog('Safety limit reached, stopping discovery');
          break;
        }
      }

      addLog(`Discovery complete: ${allCompanyIds.length} companies found`);
      setActivePipeline(prev => prev ? { ...prev, totalCompanies: allCompanyIds.length } : prev);

      if (allCompanyIds.length === 0) {
        addLog('No companies discovered. Pipeline stopped.');
        setActivePipeline(prev => prev ? { ...prev, stage: 'done' } : prev);
        await fetch(`/api/runs/${runId}/finalize`, { method: 'POST' });
        fetch('/api/runs').then(res => res.json()).then(setRuns);
        pipelineRef.current = false;
        return;
      }

      // === Phase 2: Website Analysis (filter before enrichment) ===
      setActivePipeline(prev => prev ? { ...prev, stage: 'website-analysis' } : prev);
      addLog(`Starting website analysis for ${allCompanyIds.length} companies...`);

      const qualifiedCompanyIds: string[] = [];

      for (let i = 0; i < allCompanyIds.length; i++) {
        addLog(`Analyzing website ${i + 1}/${allCompanyIds.length}...`);
        try {
          const res = await fetch(`/api/runs/${runId}/analyze-website/${allCompanyIds[i]}`, { method: 'POST' });
          const data = await res.json();
          if (res.ok) {
            const qual = data.qualification || 'MAYBE';
            const score = data.relevanceScore || 0;
            const companyName = data.company?.name || 'unknown';

            if (qual === 'DISQUALIFIED') {
              addLog(`\u2717 ${companyName} \u2192 DISQUALIFIED (score: ${score}) - ${data.reasoning || 'filtered out'}`);
              setActivePipeline(prev => prev ? {
                ...prev,
                analyzedCompanies: i + 1,
                filteredCompanies: prev.filteredCompanies + 1
              } : prev);
            } else {
              qualifiedCompanyIds.push(allCompanyIds[i]);
              const icon = qual === 'QUALIFIED' ? '\u2713' : '?';
              addLog(`${icon} ${companyName} \u2192 ${qual} (score: ${score})`);
              setActivePipeline(prev => prev ? {
                ...prev,
                analyzedCompanies: i + 1,
                qualifiedCompanies: prev.qualifiedCompanies + 1
              } : prev);
            }
          } else {
            // On error, keep the company (conservative approach)
            qualifiedCompanyIds.push(allCompanyIds[i]);
            addLog(`Website analysis failed for company ${i + 1}: ${data.error}, keeping in pipeline`);
            setActivePipeline(prev => prev ? { ...prev, analyzedCompanies: i + 1 } : prev);
          }
        } catch (e: any) {
          qualifiedCompanyIds.push(allCompanyIds[i]);
          addLog(`Website analysis error for company ${i + 1}: ${e.message}, keeping in pipeline`);
          setActivePipeline(prev => prev ? { ...prev, analyzedCompanies: i + 1 } : prev);
        }
      }

      addLog(`Website analysis complete: ${qualifiedCompanyIds.length} qualified, ${allCompanyIds.length - qualifiedCompanyIds.length} filtered out`);

      if (qualifiedCompanyIds.length === 0) {
        addLog('No qualified companies after website analysis. Pipeline stopped.');
        setActivePipeline(prev => prev ? { ...prev, stage: 'done' } : prev);
        await fetch(`/api/runs/${runId}/finalize`, { method: 'POST' });
        fetch('/api/runs').then(res => res.json()).then(setRuns);
        pipelineRef.current = false;
        return;
      }

      // === Phase 3: Enrichment (only qualified companies) ===
      setActivePipeline(prev => prev ? { ...prev, stage: 'enrichment', totalCompanies: qualifiedCompanyIds.length } : prev);
      addLog(`Starting enrichment for ${qualifiedCompanyIds.length} qualified companies...`);

      for (let i = 0; i < qualifiedCompanyIds.length; i++) {
        addLog(`Enriching company ${i + 1}/${qualifiedCompanyIds.length}...`);
        try {
          const res = await fetch(`/api/runs/${runId}/enrich/${qualifiedCompanyIds[i]}`, { method: 'POST' });
          const data = await res.json();
          if (res.ok) {
            addLog(`Enriched: ${data.company?.name || 'unknown'} \u2192 ${data.tier}`);
            setActivePipeline(prev => prev ? { ...prev, enrichedCompanies: i + 1 } : prev);
          } else {
            addLog(`Enrich failed for company ${i + 1}: ${data.error}`);
          }
        } catch (e: any) {
          addLog(`Enrich error for company ${i + 1}: ${e.message}`);
        }
      }

      // === Phase 4: Contact Mining (only qualified companies) ===
      setActivePipeline(prev => prev ? { ...prev, stage: 'contacts' } : prev);
      addLog(`Starting contact mining for ${qualifiedCompanyIds.length} companies...`);

      for (let i = 0; i < qualifiedCompanyIds.length; i++) {
        addLog(`Mining contacts for company ${i + 1}/${qualifiedCompanyIds.length}...`);
        try {
          const res = await fetch(`/api/runs/${runId}/contacts/${qualifiedCompanyIds[i]}`, { method: 'POST' });
          const data = await res.json();
          if (res.ok) {
            const contactCount = data.contacts?.length || 0;
            addLog(`Found ${contactCount} contacts for company ${i + 1}`);
            setActivePipeline(prev => prev ? { ...prev, totalContacts: prev.totalContacts + contactCount } : prev);
          } else {
            addLog(`Contact mining failed for company ${i + 1}: ${data.error}`);
          }
        } catch (e: any) {
          addLog(`Contact error for company ${i + 1}: ${e.message}`);
        }
      }

      // === Phase 4: Finalize ===
      addLog('Finalizing...');
      const finalRes = await fetch(`/api/runs/${runId}/finalize`, { method: 'POST' });
      const finalData = await finalRes.json();
      if (finalRes.ok) {
        addLog(`Pipeline complete! ${finalData.summary?.totalCompanies || 0} companies, ${finalData.summary?.withContacts || 0} with contacts`);
        addLog(`Tier A: ${finalData.summary?.tierA || 0}, Tier B: ${finalData.summary?.tierB || 0}, Tier C: ${finalData.summary?.tierC || 0}`);
      }

      setActivePipeline(prev => prev ? { ...prev, stage: 'done' } : prev);
      fetch('/api/runs').then(res => res.json()).then(setRuns);

    } catch (err: any) {
      addLog(`Pipeline error: ${err.message}`);
      setActivePipeline(prev => prev ? { ...prev, stage: 'error', error: err.message } : prev);
    } finally {
      pipelineRef.current = false;
    }
  }, [addLog]);

  const handleStartRun = async () => {
    const product = products.find(p => p.id === newRun.productId);
    if (!product || selectedCountries.length === 0) return;

    // 构建国家配置，从 ICP 获取优先级
    const countriesWithPriority = selectedCountries.map(c => {
      const icpRegion = icpTargetRegions.find(tr => tr.country?.code === c.code);
      return {
        code: c.code,
        priority: (icpRegion?.priority || 'low') as 'high' | 'medium' | 'low'
      };
    });

    // 分配查询配额
    const queryAllocation = allocateQueries(countriesWithPriority, newRun.targetCompanyCount);

    // 构建完整的国家配置
    const countriesConfig: CountryConfig[] = selectedCountries
      .map(c => {
        const icpRegion = icpTargetRegions.find(tr => tr.country?.code === c.code);
        return {
          countryCode: c.code,
          countryName: c.nameEN,
          countryNameCN: c.name,
          language: c.languageEN,
          priority: (icpRegion?.priority || 'low') as 'high' | 'medium' | 'low',
          allocatedQueries: queryAllocation.get(c.code) || 1,
          status: 'pending' as const,
          companiesFound: 0
        };
      })
      // 按优先级排序
      .sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.priority] - order[b.priority];
      });

    const res = await fetch('/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: newRun.productId,
        productName: product.name,
        countries: countriesConfig,
        targetCompanyCount: newRun.targetCompanyCount,
        strategy: newRun.strategy
      })
    });
    const data = await res.json();
    setRuns([data, ...runs]);
    setIsCreating(false);

    // 启动 Pipeline
    executePipeline(data.id, newRun.targetCompanyCount, data.countries || countriesConfig);
  };

  const getStageLabel = (stage: PipelineStage) => {
    switch (stage) {
      case 'discovery': return '公司发现';
      case 'website-analysis': return '网站验证';
      case 'enrichment': return '企业穿透';
      case 'contacts': return '联系人挖掘';
      case 'done': return '已完成';
      case 'error': return '出错';
      default: return '等待中';
    }
  };

  const getStageProgress = () => {
    if (!activePipeline) return 0;
    const { stage, completedQueries, totalQueries, analyzedCompanies, discoveredCompanies, enrichedCompanies, totalCompanies } = activePipeline;
    switch (stage) {
      case 'discovery':
        return Math.round((completedQueries / Math.max(totalQueries, 1)) * 25);
      case 'website-analysis':
        return 25 + Math.round((analyzedCompanies / Math.max(discoveredCompanies, 1)) * 25);
      case 'enrichment':
        return 50 + Math.round((enrichedCompanies / Math.max(totalCompanies, 1)) * 25);
      case 'contacts':
        return 75 + Math.round((enrichedCompanies / Math.max(totalCompanies, 1)) * 25);
      case 'done': return 100;
      default: return 0;
    }
  };

  const getRunProgress = (run: LeadRun) => {
    if (run.status === 'done') return 100;
    if (run.status === 'failed') return 0;
    const p = run.progress;
    const total = p.discovery + (p as any).enrichment + p.contact;
    if (total === 0) return 5;
    return Math.min(95, Math.round(total / 30 * 100));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">获客任务中心</h2>
          <p className="text-slate-500 text-sm mt-1">创建获客任务，系统自动发现目标公司、穿透企业信息、挖掘关键联系人。</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          disabled={!!activePipeline && activePipeline.stage !== 'done' && activePipeline.stage !== 'error'}
          className="px-6 py-3 rounded-xl bg-navy-900 text-white text-sm font-bold hover:bg-navy-800 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} className="text-gold" /> 新建获客任务
        </button>
      </div>

      {isCreating && (
        <div className="bg-white rounded-[2rem] border border-gold/30 p-8 custom-shadow animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-navy-900 flex items-center gap-3">
              <Target size={20} className="text-gold" /> 配置获客任务
            </h3>
            <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-navy-900 transition-colors">
              <X size={20} />
            </button>
          </div>
          
          {/* 产品选择 */}
          <div className="mb-6">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">选择产品 / ICP</label>
            <select 
              value={newRun.productId}
              onChange={e => setNewRun({ ...newRun, productId: e.target.value })}
              className="w-full bg-ivory/30 border border-border rounded-xl px-4 py-3 text-sm font-bold text-navy-900 outline-none focus:border-gold/50 transition-colors"
            >
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* ICP 推荐国家（多选） */}
          {icpTargetRegions.length > 0 && (
            <div className="mb-4">
              <label className="text-[10px] font-bold text-gold uppercase tracking-widest block mb-2 flex items-center gap-2">
                <Star size={12} /> ICP 画像推荐目标市场（可多选）
              </label>
              <div className="flex flex-wrap gap-2">
                {icpTargetRegions.slice(0, 6).map((tr, i) => {
                  const c = tr.country!;
                  const isSelected = newRun.countryCodes.includes(c.code);
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        if (isSelected) {
                          setNewRun({ ...newRun, countryCodes: newRun.countryCodes.filter(code => code !== c.code) });
                        } else {
                          setNewRun({ ...newRun, countryCodes: [...newRun.countryCodes, c.code] });
                        }
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-gold text-navy-900 shadow-lg'
                          : 'bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20'
                      }`}
                    >
                      {isSelected ? <CheckCircle2 size={14} /> : <Globe size={14} />}
                      {c.name}
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                        tr.priority === 'high' ? 'bg-red-100 text-red-600' :
                        tr.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {tr.priority === 'high' ? '优先' : tr.priority === 'medium' ? '次优' : '可选'}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                已选 {newRun.countryCodes.length} 个国家，高优先级国家将获得更多查询配额
              </p>
            </div>
          )}

          {/* 目标国家选择 - 搜索+多选下拉 */}
          <div className="mb-6" ref={countryDropdownRef}>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">添加更多国家 / 地区</label>
            <div className="relative">
              <div 
                className="w-full bg-ivory/30 border border-border rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:border-gold/50 transition-colors"
                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              >
                <Globe size={16} className="text-slate-400" />
                {selectedCountries.length > 0 ? (
                  <div className="flex flex-wrap gap-1 flex-1">
                    {selectedCountries.slice(0, 3).map(c => (
                      <span key={c.code} className="px-2 py-0.5 bg-navy-900/10 text-navy-900 rounded text-xs font-medium">
                        {c.name}
                      </span>
                    ))}
                    {selectedCountries.length > 3 && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">
                        +{selectedCountries.length - 3}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-400">点击添加国家...</span>
                )}
                <ChevronDown size={16} className="text-slate-400 ml-auto" />
              </div>

              {showCountryDropdown && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-border rounded-2xl shadow-xl max-h-80 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  {/* 搜索框 */}
                  <div className="p-3 border-b border-border">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={countrySearch}
                        onChange={e => setCountrySearch(e.target.value)}
                        placeholder="搜索国家名称..."
                        className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg outline-none focus:border-gold/50"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* 国家列表 */}
                  <div className="max-h-60 overflow-y-auto">
                    {Object.entries(REGION_LABELS).map(([regionKey, regionLabel]) => {
                      const regionCountries = filteredCountries.filter(c => c.region === regionKey);
                      if (regionCountries.length === 0) return null;
                      return (
                        <div key={regionKey}>
                          <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50">
                            {regionLabel} ({regionCountries.length})
                          </div>
                          {regionCountries.map(country => {
                            const isSelected = newRun.countryCodes.includes(country.code);
                            return (
                              <button
                                key={country.code}
                                onClick={() => {
                                  if (isSelected) {
                                    setNewRun({ ...newRun, countryCodes: newRun.countryCodes.filter(code => code !== country.code) });
                                  } else {
                                    setNewRun({ ...newRun, countryCodes: [...newRun.countryCodes, country.code] });
                                  }
                                }}
                                className={`w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-ivory transition-colors ${
                                  isSelected ? 'bg-gold/10' : ''
                                }`}
                              >
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                  isSelected ? 'bg-gold border-gold' : 'border-slate-300'
                                }`}>
                                  {isSelected && <CheckCircle2 size={12} className="text-white" />}
                                </div>
                                <span className="text-sm font-bold text-navy-900">{country.name}</span>
                                <span className="text-xs text-slate-400">{country.nameEN}</span>
                                <span className="text-[10px] text-slate-300 ml-auto">{country.languageEN}</span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                    {filteredCountries.length === 0 && (
                      <div className="px-4 py-8 text-center text-slate-400 text-sm">
                        未找到匹配的国家
                      </div>
                    )}
                  </div>

                  {/* 底部操作栏 */}
                  <div className="p-3 border-t border-border bg-slate-50 flex justify-between items-center">
                    <span className="text-xs text-slate-500">已选 {newRun.countryCodes.length} 个国家</span>
                    <button
                      onClick={() => setShowCountryDropdown(false)}
                      className="px-4 py-1.5 bg-navy-900 text-white rounded-lg text-xs font-bold"
                    >
                      完成
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 目标公司数设置 */}
          <div className="mb-6">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-2">
              <Sliders size={12} /> 目标公司数
            </label>
            <div className="bg-ivory/30 border border-border rounded-xl p-4">
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="20"
                  max="50"
                  value={newRun.targetCompanyCount}
                  onChange={e => setNewRun({ ...newRun, targetCompanyCount: parseInt(e.target.value) })}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-gold"
                />
                <span className="text-2xl font-black text-navy-900 w-16 text-right">{newRun.targetCompanyCount}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                系统将串行搜索所选国家，达到目标公司数后自动停止。预计耗时 {Math.ceil(newRun.targetCompanyCount / 4 * 0.5)} - {Math.ceil(newRun.targetCompanyCount / 3 * 0.8)} 分钟。
              </p>
            </div>
          </div>

          {/* 搜索策略选择 */}
          <div className="mb-8">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">搜索策略</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SEARCH_STRATEGIES.map(strategy => {
                const Icon = strategy.icon;
                return (
                  <button
                    key={strategy.id}
                    onClick={() => setNewRun({ ...newRun, strategy: strategy.id })}
                    className={`p-4 rounded-xl text-left transition-all border ${
                      newRun.strategy === strategy.id
                        ? 'bg-navy-900 text-white border-navy-900 shadow-lg'
                        : 'bg-white text-slate-600 border-border hover:border-gold/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Icon size={18} className={newRun.strategy === strategy.id ? 'text-gold' : 'text-slate-400'} />
                      <span className="font-bold text-sm">{strategy.name}</span>
                      {strategy.id === 'tender' && (
                        <span className="text-[9px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">推荐</span>
                      )}
                    </div>
                    <p className={`text-xs ${newRun.strategy === strategy.id ? 'text-slate-300' : 'text-slate-400'}`}>
                      {strategy.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 预计产出 */}
          <div className="bg-ivory/50 rounded-xl p-4 mb-6 border border-border">
            <p className="text-xs text-slate-500">
              <span className="font-bold text-navy-900">任务配置：</span>
              {selectedCountries.length} 个国家串行搜索，目标 <span className="font-bold text-navy-900">{newRun.targetCompanyCount} 家</span> 公司，
              预计挖掘 <span className="font-bold text-navy-900">{newRun.targetCompanyCount * 2}-{newRun.targetCompanyCount * 3} 位</span> 关键联系人。
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-4">
            <button onClick={() => setIsCreating(false)} className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-navy-900 transition-all">
              取消
            </button>
            <button 
              onClick={handleStartRun}
              disabled={!newRun.productId || newRun.countryCodes.length === 0}
              className="px-10 py-3 bg-gradient-to-r from-navy-900 to-slate-800 text-white rounded-xl text-sm font-bold hover:shadow-xl transition-all flex items-center gap-3 disabled:opacity-50"
            >
              启动获客任务 <Play size={16} className="text-gold" />
            </button>
          </div>
        </div>
      )}

      {/* Active Pipeline Progress */}
      {activePipeline && activePipeline.stage !== 'done' && (
        <div className="bg-white rounded-[2rem] border-2 border-gold/40 p-8 custom-shadow animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center">
              <Loader2 size={24} className="text-gold animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy-900">Pipeline 执行中</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                当前阶段：<span className="font-bold text-navy-900">{getStageLabel(activePipeline.stage)}</span>
              </p>
            </div>
          </div>

          {/* Stage indicators */}
          <div className="flex items-center gap-2 mb-6">
            {(['discovery', 'website-analysis', 'enrichment', 'contacts'] as PipelineStage[]).map((stage, i) => {
              const isActive = activePipeline.stage === stage;
              const stageOrder = ['discovery', 'website-analysis', 'enrichment', 'contacts'];
              const isDone = stageOrder.indexOf(activePipeline.stage) > i || activePipeline.stage === 'done';
              return (
                <React.Fragment key={stage}>
                  {i > 0 && <div className={`flex-1 h-0.5 ${isDone ? 'bg-emerald-400' : isActive ? 'bg-gold' : 'bg-slate-200'}`} />}
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${
                    isActive ? 'bg-gold/10 text-gold border border-gold/30' :
                    isDone ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    'bg-slate-50 text-slate-400 border border-slate-100'
                  }`}>
                    {isDone ? <CheckCircle2 size={14} /> : isActive ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
                    {getStageLabel(stage)}
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-2">
              <span>总体进度</span>
              <span className="text-navy-900">{getStageProgress()}%</span>
            </div>
            <div className="h-3 bg-ivory rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-gold to-amber-400 transition-all duration-700"
                style={{ width: `${getStageProgress()}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-ivory/50 rounded-xl p-4 text-center border border-border">
              <Building2 size={20} className="mx-auto text-slate-400 mb-2" />
              <p className="text-2xl font-black text-navy-900">{activePipeline.discoveredCompanies}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">发现公司</p>
            </div>
            <div className="bg-ivory/50 rounded-xl p-4 text-center border border-border">
              <ShieldCheck size={20} className="mx-auto text-slate-400 mb-2" />
              <p className="text-2xl font-black text-navy-900">{activePipeline.qualifiedCompanies}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                通过验证
                {activePipeline.filteredCompanies > 0 && (
                  <span className="text-red-400 ml-1">(-{activePipeline.filteredCompanies})</span>
                )}
              </p>
            </div>
            <div className="bg-ivory/50 rounded-xl p-4 text-center border border-border">
              <Zap size={20} className="mx-auto text-slate-400 mb-2" />
              <p className="text-2xl font-black text-navy-900">{activePipeline.enrichedCompanies}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">穿透完成</p>
            </div>
            <div className="bg-ivory/50 rounded-xl p-4 text-center border border-border">
              <Users size={20} className="mx-auto text-slate-400 mb-2" />
              <p className="text-2xl font-black text-navy-900">{activePipeline.totalContacts}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">联系人</p>
            </div>
          </div>

          {/* Log */}
          <div className="bg-slate-900 rounded-xl p-4 max-h-40 overflow-y-auto font-mono text-[11px] text-emerald-400 space-y-1">
            {activePipeline.log.map((line, i) => (
              <div key={i} className="leading-relaxed">{line}</div>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline Complete Summary */}
      {activePipeline && activePipeline.stage === 'done' && (
        <div className="bg-white rounded-[2rem] border-2 border-emerald-200 p-8 custom-shadow animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 size={24} className="text-emerald-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy-900">Pipeline 执行完成</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  发现 {activePipeline.discoveredCompanies} 家公司，验证通过 {activePipeline.qualifiedCompanies} 家（过滤 {activePipeline.filteredCompanies} 家），穿透 {activePipeline.enrichedCompanies} 家，挖掘 {activePipeline.totalContacts} 位联系人
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={onViewPool}
                className="px-6 py-3 bg-navy-900 text-white rounded-xl text-sm font-bold hover:bg-navy-800 transition-all flex items-center gap-2"
              >
                查看线索公海池 <Search size={14} className="text-gold" />
              </button>
              <button 
                onClick={() => setActivePipeline(null)}
                className="px-4 py-3 text-sm font-bold text-slate-400 hover:text-navy-900 transition-all"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 任务列表 */}
      <div className="space-y-4">
        {runs.length === 0 ? (
          <div className="p-16 text-center bg-ivory/30 border border-dashed border-border rounded-2xl">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Search size={28} className="text-slate-300" />
            </div>
            <p className="text-slate-400 font-medium">暂无获客任务</p>
            <p className="text-xs text-slate-300 mt-1">点击上方「新建获客任务」开始</p>
          </div>
        ) : (
          runs.map(run => (
            <div key={run.id} className="bg-white rounded-2xl border border-border p-6 custom-shadow hover:border-gold/30 transition-all">
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                {/* 任务信息 */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      run.status === 'done' ? 'bg-emerald-50 text-emerald-500' : 
                      run.status === 'failed' ? 'bg-red-50 text-red-500' : 
                      run.status === 'running' ? 'bg-gold/10 text-gold' : 'bg-slate-50 text-slate-400'
                    }`}>
                      {run.status === 'done' ? <CheckCircle2 size={20} /> : 
                       run.status === 'failed' ? <AlertCircle size={20} /> : 
                       run.status === 'running' ? <RefreshCw size={20} className="animate-spin" /> :
                       <Clock size={20} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-navy-900">{run.productName}</h4>
                      <div className="flex items-center gap-3 mt-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <Globe size={10} /> 
                          {run.countries && run.countries.length > 0 
                            ? run.countries.map(c => c.countryNameCN || c.countryName).join('、')
                            : run.country}
                        </span>
                        <span className="flex items-center gap-1"><Clock size={10} /> {new Date(run.createdAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 进度展示 */}
                <div className="flex-1 w-full lg:w-auto">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-2">
                    <span>执行进度</span>
                    <span className="text-navy-900">{getRunProgress(run)}%</span>
                  </div>
                  <div className="h-2 bg-ivory rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        run.status === 'done' ? 'bg-emerald-500' : 
                        run.status === 'failed' ? 'bg-red-400' : 'bg-gradient-to-r from-gold to-amber-400'
                      }`}
                      style={{ width: `${getRunProgress(run)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-[9px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Building2 size={10} /> 发现 {run.progress.discovery} 家
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck size={10} /> 验证 {run.progress.websiteAnalysis || 0} 家
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap size={10} /> 穿透 {(run.progress as any).enrichment || run.progress.research || 0} 家
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={10} /> 联系人 {run.progress.contact} 位
                    </span>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="shrink-0 flex gap-2">
                  <button 
                    onClick={onViewPool}
                    className="px-5 py-2.5 rounded-xl border border-border text-xs font-bold text-navy-900 hover:bg-ivory hover:border-gold/30 transition-all"
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
