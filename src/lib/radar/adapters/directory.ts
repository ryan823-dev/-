/**
 * 行业名录适配器
 *
 * 发现行业协会会员、采购目录、供应商库
 *
 * 数据来源：
 * 1. 行业协会会员名录
 * 2. 政府采购供应商库
 * 3. B2B 平台企业名录
 * 4. 展会参展商列表
 */

import type {
  RadarAdapter,
  RadarSearchQuery,
  RadarSearchResult,
  NormalizedCandidate,
  HealthStatus,
  AdapterFeatures,
  AdapterConfig,
} from './types';
import { chatCompletion } from '@/lib/ai-client';
import {
  DIRECTORY_SOURCES,
  getSourcesByCountry,
  getSourcesByType,
} from './directory-sources';

// ==================== 类型定义 ====================

export interface DirectorySource {
  id: string;
  name: string;
  type: 'association' | 'government' | 'b2b_platform' | 'trade_show' | 'custom' | 'trade_data';
  url: string;
  country: string;
  industry?: string;
  description?: string;
}

export interface DirectorySearchParams {
  sourceType?: DirectorySource['type'];
  industry?: string;
  country?: string;
}

// 重导出数据源配置和辅助函数
export {
  DIRECTORY_SOURCES,
  getSourcesByCountry,
  getSourcesByType,
};

// ==================== 区域类型 ====================

export type Region =
  | 'NORTH_AMERICA'
  | 'SOUTH_AMERICA'
  | 'EUROPE'
  | 'MIDDLE_EAST'
  | 'AFRICA'
  | 'SOUTH_ASIA'
  | 'SOUTHEAST_ASIA'
  | 'EAST_ASIA'
  | 'OCEANIA'
  | 'GLOBAL';

// ==================== 行业名录适配器 ====================

export class DirectoryAdapter implements RadarAdapter {
  readonly id = 'directory';
  readonly sourceCode = 'directory';
  readonly name = 'Industry Directory';
  readonly channelType = 'DIRECTORY';
  readonly version = '1.0.0';

  private config: AdapterConfig;
  private sources: DirectorySource[] = DIRECTORY_SOURCES;

  constructor(config: AdapterConfig & { customSources?: DirectorySource[] } = {}) {
    this.config = config;
    // 可以通过配置添加自定义数据源
    if (config.customSources) {
      this.sources = [...this.sources, ...config.customSources];
    }
  }

  readonly supportedFeatures: AdapterFeatures = {
    supportsKeywordSearch: true,
    supportsCategoryFilter: true,
    supportsDateFilter: false,
    supportsRegionFilter: true,
    supportsPagination: true,
    supportsDetails: true,
    maxResultsPerQuery: 50,
    rateLimit: { requests: 20, windowMs: 60000 },
  };

  async search(query: RadarSearchQuery): Promise<RadarSearchResult> {
    const startTime = Date.now();
    const keywords = query.keywords || [];
    const countries = query.countries || [];
    const categories = query.categories || [];

    // 1. 筛选相关数据源
    const relevantSources = this.filterSources(countries, categories);

    // 2. 搜索企业名录
    const entries = await this.searchDirectories(relevantSources, keywords);

    // 3. AI 解析企业信息
    const candidates = await this.parseEntries(entries);

    const duration = Date.now() - startTime;

    return {
      items: candidates,
      total: candidates.length,
      hasMore: false,
      metadata: {
        source: this.sourceCode,
        query,
        fetchedAt: new Date(),
        duration,
      },
    };
  }

  async batchSearch(queries: RadarSearchQuery[]): Promise<RadarSearchResult[]> {
    const results: RadarSearchResult[] = [];
    for (const query of queries) {
      const result = await this.search(query);
      results.push(result);
    }
    return results;
  }

  async realTimeSearch(keyword: string): Promise<RadarSearchResult> {
    return this.search({
      keywords: [keyword],
      countries: [],
      categories: [],
    });
  }

  async healthCheck(): Promise<HealthStatus> {
    const sources = this.sources.filter(s => s.type !== 'custom');
    return {
      healthy: sources.length > 0,
      latency: 0,
      message: `${sources.length} directory sources available`,
    };
  }

  // ==================== 私有方法 ====================

  /**
   * 筛选相关数据源
   */
  private filterSources(countries: string[], categories: string[]): DirectorySource[] {
    return this.sources.filter(source => {
      // 国家筛选
      if (countries.length > 0) {
        const countryMatch = countries.some(
          c => source.country.toLowerCase() === c.toLowerCase()
        );
        if (!countryMatch) return false;
      }
      // 行业筛选
      if (categories.length > 0 && source.industry) {
        const industryMatch = categories.some(
          cat => source.industry?.toLowerCase().includes(cat.toLowerCase())
        );
        if (!industryMatch) return false;
      }
      return true;
    });
  }

  /**
   * 搜索企业名录
   */
  private async searchDirectories(
    sources: DirectorySource[],
    keywords: string[]
  ): Promise<Array<{
    companyName: string;
    source: DirectorySource;
    description?: string;
    url?: string;
  }>> {
    const entries: Array<{
      companyName: string;
      source: DirectorySource;
      description?: string;
      url?: string;
    }> = [];

    for (const source of sources.slice(0, 5)) {
      try {
        // 使用 Brave Search 搜索该名录中的企业
        const { BraveSearchAdapter } = await import('./brave-search');
        const adapter = new BraveSearchAdapter({} as AdapterConfig);

        const searchKeywords = keywords.length > 0
          ? keywords.slice(0, 3)
          : [source.industry || 'company'];

        for (const keyword of searchKeywords) {
          const result = await adapter.search({
            keywords: [`${keyword} site:${new URL(source.url).hostname}`],
            countries: [source.country],
          });

          for (const item of result.items.slice(0, 5)) {
            entries.push({
              companyName: item.displayName,
              source,
              description: item.description,
              url: item.sourceUrl,
            });
          }
        }

        await new Promise(r => setTimeout(r, 500));
      } catch (error) {
        console.error(`[Directory] Error searching ${source.name}:`, error);
      }
    }

    return entries;
  }

  /**
   * AI 解析企业条目
   */
  private async parseEntries(entries: Array<{
    companyName: string;
    source: DirectorySource;
    description?: string;
    url?: string;
  }>): Promise<NormalizedCandidate[]> {
    if (entries.length === 0) return [];

    const systemPrompt = `你是一个 B2B 数据专家。从企业名录条目中提取信息。

分析要点：
1. 公司名称是否完整准确
2. 是否是制造商（B2B）而非个人或零售商
3. 公司规模推断（基于描述）
4. 产品/服务方向

输出 JSON 数组：
[{
  "companyName": "公司名",
  "isManufacturer": true/false,
  "confidence": 0.8,
  "products": ["产品1"],
  "summary": "简短描述"
}]`;

    try {
      const result = await chatCompletion([
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `分析企业名录：\n${JSON.stringify(
            entries.slice(0, 20),
            null,
            2,
          )}`,
        },
      ], {
        model: 'qwen-plus',
        temperature: 0.2,
        maxTokens: 1500,
      });

      const parsed = JSON.parse(result.content);

      return entries.slice(0, parsed.length).map((entry, i) => {
        const info = parsed[i] || {};
        const confidence = info.confidence || 0.6;
        const isManufacturer = info.isManufacturer !== false;

        return {
          externalId: `dir_${Date.now()}_${this.hashString(entry.companyName)}`,
          sourceUrl: entry.url || entry.source.url,
          displayName: entry.companyName,
          candidateType: isManufacturer ? 'COMPANY' : 'OPPORTUNITY',
          country: entry.source.country,
          matchScore: confidence * (isManufacturer ? 1 : 0.5),
          matchExplain: {
            channel: 'directory',
            reasons: [
              `来源: ${entry.source.name}`,
              info.products ? `产品: ${info.products.join(', ')}` : '',
              isManufacturer ? '制造商' : '服务商',
            ].filter(Boolean),
          },
          description: info.summary || entry.description,
          rawData: {
            source: entry.source.id,
            sourceName: entry.source.name,
            sourceType: entry.source.type,
          },
        } as NormalizedCandidate;
      });
    } catch (error) {
      console.error('[Directory] Parse error:', error);
      // 降级处理：直接返回基本信息
      return entries.slice(0, 10).map(entry => ({
        externalId: `dir_${Date.now()}_${this.hashString(entry.companyName)}`,
        sourceUrl: entry.url || entry.source.url,
        displayName: entry.companyName,
        candidateType: 'COMPANY' as const,
        country: entry.source.country,
        matchScore: 0.5,
        matchExplain: {
          channel: 'directory',
          reasons: [`来源: ${entry.source.name}`],
        },
        description: entry.description,
      }));
    }
  }

  normalize(raw: unknown): NormalizedCandidate {
    return raw as NormalizedCandidate;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}

// ==================== 区域映射 ====================

/**
 * 区域到国家映射
 */
const REGION_COUNTRIES: Record<Region, string[]> = {
  'NORTH_AMERICA': ['US', 'CA', 'MX'],
  'SOUTH_AMERICA': ['BR', 'AR', 'CL', 'CO', 'PE'],
  'EUROPE': ['DE', 'FR', 'UK', 'IT', 'ES', 'PL', 'CZ', 'RO'],
  'MIDDLE_EAST': ['AE', 'SA', 'QA', 'KW', 'IL'],
  'AFRICA': ['ZA', 'NG', 'EG', 'KE', 'MA'],
  'SOUTH_ASIA': ['IN', 'PK', 'BD', 'LK'],
  'SOUTHEAST_ASIA': ['SG', 'MY', 'TH', 'VN', 'ID', 'PH'],
  'EAST_ASIA': ['CN', 'JP', 'KR'],
  'OCEANIA': ['AU', 'NZ'],
  'GLOBAL': ['GLOBAL'],
};

/**
 * 区域映射数组（用于测试和遍历）
 */
export const REGION_MAPPINGS: Array<{ region: Region; countries: string[] }> =
  Object.entries(REGION_COUNTRIES).map(([region, countries]) => ({
    region: region as Region,
    countries,
  }));

/**
 * 根据国家代码获取所属区域
 */
export function getRegionByCountry(countryCode: string): Region | null {
  const code = countryCode.toUpperCase();
  for (const [region, countries] of Object.entries(REGION_COUNTRIES)) {
    if (countries.includes(code)) {
      return region as Region;
    }
  }
  return null;
}

/**
 * 根据关键词获取区域（别名）
 */
export function getRegionsByKeyword(keyword: string): Region[] {
  return inferRegionFromKeyword(keyword);
}

/**
 * 根据关键词推断区域
 */
export function inferRegionFromKeyword(keyword: string): Region[] {
  const lowerKeyword = keyword.toLowerCase();
  const matches: Region[] = [];

  const regionKeywords: Record<Region, string[]> = {
    'NORTH_AMERICA': ['北美', 'north america', 'usa', 'us', 'canada', 'mexico', '美国', '加拿大', '墨西哥'],
    'SOUTH_AMERICA': ['南美', 'south america', 'brazil', 'argentina', '巴西', '阿根廷'],
    'EUROPE': ['欧洲', 'europe', 'eu', 'germany', 'france', 'uk', '德国', '法国', '英国'],
    'MIDDLE_EAST': ['中东', 'middle east', 'uae', 'saudi', 'dubai', '阿联酋', '沙特', '迪拜'],
    'AFRICA': ['非洲', 'africa', 'south africa', 'nigeria', 'egypt', '南非', '尼日利亚', '埃及'],
    'SOUTH_ASIA': ['南亚', 'south asia', 'india', '印度', '巴基斯坦'],
    'SOUTHEAST_ASIA': ['东南亚', 'southeast asia', 'thailand', 'vietnam', 'indonesia', '泰国', '越南', '印尼'],
    'EAST_ASIA': ['东亚', 'east asia', 'china', 'japan', 'korea', '中国', '日本', '韩国'],
    'OCEANIA': ['大洋洲', 'oceania', 'australia', 'nz', '澳洲', '澳大利亚', '新西兰'],
    'GLOBAL': ['全球', 'global', 'world', 'worldwide', '世界'],
  };

  for (const [region, keywords] of Object.entries(regionKeywords)) {
    if (keywords.some(k => lowerKeyword.includes(k))) {
      matches.push(region as Region);
    }
  }

  return matches;
}

/**
 * 获取区域内的国家列表
 */
export function getCountriesByRegion(region: Region): string[] {
  return REGION_COUNTRIES[region] || [];
}

/**
 * 获取特定国家的行业名录
 */
export function getDirectorySourcesByCountry(country: string): DirectorySource[] {
  return DIRECTORY_SOURCES.filter(s => s.country === country.toUpperCase());
}

/**
 * 获取特定区域的行业名录
 */
export function getDirectorySourcesByRegion(region: Region): DirectorySource[] {
  const countries = getCountriesByRegion(region);
  return DIRECTORY_SOURCES.filter(s =>
    countries.includes(s.country) || s.country === 'GLOBAL'
  );
}

/**
 * 获取特定行业的名录
 */
export function getDirectorySourcesByIndustry(industry: string): DirectorySource[] {
  return DIRECTORY_SOURCES.filter(
    s => s.industry?.toLowerCase().includes(industry.toLowerCase())
  );
}

/**
 * 添加自定义名录数据源
 */
export function createDirectoryAdapter(customSources: DirectorySource[]): DirectoryAdapter {
  return new DirectoryAdapter({
    customSources: customSources as unknown as Record<string, unknown>,
  } as AdapterConfig);
}

export default DirectoryAdapter;