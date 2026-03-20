// ==================== Radar Adapter Types ====================
// 统一的数据源适配器接口定义

import type { ChannelType, AdapterType, RadarStoragePolicy } from '@/generated/prisma/enums';

// ==================== 数据源类型标注 ====================

/**
 * 数据源类型
 * 
 * OFFICIAL_API: 官方API，有明确的API文档和认证方式
 * - 示例：TED, SAM.gov, Google Places
 * - 数据质量：高，直接来自源头
 * - 需要认证：通常需要
 * 
 * PUBLIC_DATA: 公开数据，无需认证即可访问
 * - 示例：UNGM公开端点, 政府网站RSS
 * - 数据质量：高
 * - 需要认证：否
 * 
 * WEB_SCRAPING: 网页抓取，从公开网页提取数据
 * - 示例：政府采购网站、展会参展商列表
 * - 数据质量：中等，取决于网页结构
 * - 需要认证：否
 * 
 * AI_INFERRED: AI推断，通过搜索引擎+AI分析获取
 * - 示例：新兴市场采购、海关数据、招聘信号
 * - 数据质量：不稳定，可能存在幻觉
 * - 需要认证：搜索引擎API Key
 */
export type SourceDataType = 'OFFICIAL_API' | 'PUBLIC_DATA' | 'WEB_SCRAPING' | 'AI_INFERRED';

/**
 * 数据质量等级
 */
export type DataQualityLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNSTABLE';

/**
 * 数据源可靠性描述
 */
export interface SourceReliability {
  /** 数据源类型 */
  dataType: SourceDataType;
  /** 数据质量等级 */
  qualityLevel: DataQualityLevel;
  /** 是否需要认证 */
  requiresAuth: boolean;
  /** 认证方式描述 */
  authMethod?: string;
  /** 数据更新频率 */
  updateFrequency?: 'REAL_TIME' | 'DAILY' | 'WEEKLY' | 'UNKNOWN';
  /** 覆盖范围描述 */
  coverageNote?: string;
  /** 已知限制 */
  limitations?: string[];
  /** 官方文档链接 */
  docUrl?: string;
}

// ==================== 适配器能力 ====================

export interface AdapterFeatures {
  supportsKeywordSearch: boolean;
  supportsCategoryFilter: boolean;  // CPV/UNSPSC codes
  supportsDateFilter: boolean;
  supportsRegionFilter: boolean;
  supportsPagination: boolean;
  supportsDetails: boolean;  // 是否支持按需获取详情
  maxResultsPerQuery: number;
  rateLimit: { requests: number; windowMs: number };
}

// ==================== 搜索查询 ====================

export interface RadarSearchQuery {
  keywords?: string[];
  categories?: string[];  // CPV/UNSPSC codes
  countries?: string[];   // ISO codes
  regions?: string[];     // EU | LATAM | MENA | APAC
  publishedAfter?: Date;
  publishedBefore?: Date;
  deadlineAfter?: Date;
  deadlineBefore?: Date;
  page?: number;
  pageSize?: number;
  // AI 搜索专用
  targetIndustries?: string[];
  companyTypes?: string[];  // manufacturer | distributor | service_provider
  locationBias?: { lat: number; lng: number; radius: number };
  // === 持续扫描游标 ===
  cursor?: {
    nextPage?: number;
    nextPageToken?: string;
    since?: string;        // ISO8601
    queryIndex?: number;
  };
  maxResults?: number;     // 本次最多抓取条数
}

// ==================== 搜索结果 ====================

export interface RadarSearchResult {
  items: NormalizedCandidate[];
  total: number;
  hasMore: boolean;
  nextPage?: number;
  metadata: {
    source: string;
    query: RadarSearchQuery;
    fetchedAt: Date;
    duration: number;
  };
  // === 持续扫描游标 ===
  nextCursor?: {
    nextPage?: number;
    nextPageToken?: string;
    since?: string;        // ISO8601
    queryIndex?: number;
  };
  isExhausted?: boolean;   // 该查询维度已无更多数据
}

// ==================== 标准化候选 ====================

export interface NormalizedCandidate {
  // 必须字段
  externalId: string;
  sourceUrl: string;
  displayName: string;
  candidateType: 'COMPANY' | 'OPPORTUNITY' | 'CONTACT';
  
  // 通用可选字段
  description?: string;
  
  // 公司字段
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  country?: string;
  city?: string;
  industry?: string;
  companySize?: string;
  
  // 机会/招标字段
  deadline?: Date;
  estimatedValue?: number;
  currency?: string;
  buyerName?: string;
  buyerCountry?: string;
  buyerType?: 'government' | 'enterprise' | 'ngo' | 'international_org';
  categoryCode?: string;
  categoryName?: string;
  publishedAt?: Date;
  contactEmail?: string;
  
  // 联系人字段
  contactRole?: string;
  linkedCompanyExternalId?: string;
  
  // 匹配信息
  matchExplain?: {
    query?: string;
    channel?: string;
    reasons?: string[];
    matchedKeywords?: string[];
    // 适配器特定字段
    jobTitles?: string[];
    importProducts?: string[];
    showName?: string;
    suppliers?: string[];
    products?: string[];
  };
  
  // 匹配分数
  matchScore?: number;
  
  // 原始数据
  rawData?: Record<string, unknown>;
}

// ==================== 详情补全结果 ====================

export interface CandidateDetails {
  externalId: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  description?: string;
  additionalInfo?: Record<string, unknown>;
}

// ==================== 健康检查结果 ====================

export interface HealthStatus {
  healthy: boolean;
  latency: number;
  error?: string;
  message?: string;  // 添加 message 字段
  lastCheckedAt?: Date;
}

// ==================== 适配器接口 ====================

export interface RadarAdapter {
  readonly sourceCode: string;
  readonly channelType: ChannelType;
  readonly supportedFeatures: AdapterFeatures;
  
  /**
   * 搜索候选
   */
  search(query: RadarSearchQuery): Promise<RadarSearchResult>;
  
  /**
   * 获取详情（可选，用于按需补全）
   */
  getDetails?(externalId: string): Promise<CandidateDetails | null>;
  
  /**
   * 标准化原始数据
   */
  normalize(raw: unknown): NormalizedCandidate;
  
  /**
   * 健康检查
   */
  healthCheck(): Promise<HealthStatus>;
}

// ==================== 适配器配置 ====================

export interface AdapterConfig {
  apiKey?: string;
  apiEndpoint?: string;
  fieldMapping?: Record<string, string>;
  headers?: Record<string, string>;
  timeout?: number;
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
  };
  // 适配器特定配置
  banks?: string[];      // 开发银行适配器
  regions?: string[];    // 新兴市场适配器
  countries?: string[];  // 国家过滤
  clientId?: string;     // UNGM OAuth
  clientSecret?: string; // UNGM OAuth
}

// ==================== 适配器注册信息 ====================

export interface AdapterRegistration {
  code: string;
  name: string;
  channelType: ChannelType;
  adapterType: AdapterType;
  description: string;
  features: AdapterFeatures;
  defaultConfig: AdapterConfig;
  storagePolicy: RadarStoragePolicy;
  ttlDays: number;
  attributionRequired: boolean;
  countries?: string[];
  regions?: string[];
  isOfficial: boolean;
  websiteUrl?: string;
  termsUrl?: string;
  // === 数据源可靠性标注 ===
  reliability: SourceReliability;
}

// ==================== 适配器工厂 ====================

export type AdapterFactory = (config: AdapterConfig) => RadarAdapter;
