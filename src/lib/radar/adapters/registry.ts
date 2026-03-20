// ==================== Radar Adapter Registry ====================
// 适配器注册表和工厂

import type { 
  RadarAdapter, 
  AdapterConfig, 
  AdapterFactory, 
  AdapterRegistration,
  SourceReliability
} from './types';
import { UNGMAdapter } from './ungm';
import { TEDAdapter } from './ted';
import { AISearchAdapter } from './ai-search';
import { GooglePlacesAdapter } from './google-places';
import { BraveSearchAdapter } from './brave-search';
import { GenericFeedAdapter } from './generic-feed';
import { SAMGovAdapter } from './sam-gov';
import { HiringSignalAdapter } from './hiring-signal';
import { TradeDataAdapter } from './trade-data';
import { TradeShowAdapter } from './trade-show';
import { DevelopmentBankAdapter } from './development-bank';
import { EmergingMarketsAdapter } from './emerging-markets';
import { HunterAdapter } from './hunter';
import { PeopleDataLabsAdapter } from './pdl';
import { TavilyAdapter } from './tavily';
import { ExaAdapter } from './exa';

// ==================== 数据源可靠性定义 ====================

/**
 * 每个数据源的可靠性信息
 * 用于向用户透明展示数据质量
 */
const SOURCE_RELIABILITY: Record<string, SourceReliability> = {
  // === 官方API（高可靠性）===
  ungm: {
    dataType: 'OFFICIAL_API',
    qualityLevel: 'HIGH',
    requiresAuth: true,
    authMethod: 'OAuth2 Client Credentials',
    updateFrequency: 'DAILY',
    coverageNote: '覆盖所有联合国机构采购公告',
    limitations: ['需要注册开发者账号获取认证信息'],
    docUrl: 'https://developer.ungm.org/',
  },
  ted: {
    dataType: 'OFFICIAL_API',
    qualityLevel: 'HIGH',
    requiresAuth: false,
    updateFrequency: 'DAILY',
    coverageNote: '覆盖欧盟27国政府采购公告',
    limitations: ['搜索API无需认证，但提交公告需要认证'],
    docUrl: 'https://docs.ted.europa.eu/api/latest/index.html',
  },
  sam_gov: {
    dataType: 'OFFICIAL_API',
    qualityLevel: 'HIGH',
    requiresAuth: true,
    authMethod: 'API Key',
    updateFrequency: 'DAILY',
    coverageNote: '覆盖美国联邦政府采购公告',
    limitations: ['需要API Key，免费但有请求限制'],
    docUrl: 'https://open.gsa.gov/api/sam-gov-api/',
  },
  google_places: {
    dataType: 'OFFICIAL_API',
    qualityLevel: 'HIGH',
    requiresAuth: true,
    authMethod: 'API Key',
    updateFrequency: 'REAL_TIME',
    coverageNote: '全球企业信息',
    limitations: ['需要Google Cloud API Key，有费用'],
    docUrl: 'https://developers.google.com/maps/documentation/places',
  },
  
  // === 公开数据（中高可靠性）===
  generic_feed: {
    dataType: 'PUBLIC_DATA',
    qualityLevel: 'MEDIUM',
    requiresAuth: false,
    updateFrequency: 'UNKNOWN',
    coverageNote: '取决于配置的RSS/JSON源',
    limitations: ['数据质量取决于源网站'],
  },
  
  // === AI推断（低可靠性，需要人工验证）===
  ai_search: {
    dataType: 'AI_INFERRED',
    qualityLevel: 'UNSTABLE',
    requiresAuth: true,
    authMethod: '搜索引擎API Key',
    updateFrequency: 'REAL_TIME',
    coverageNote: '全球范围，但结果需要验证',
    limitations: ['AI可能产生幻觉', '搜索结果可能不相关', '需要人工验证'],
  },
  brave_search: {
    dataType: 'AI_INFERRED',
    qualityLevel: 'UNSTABLE',
    requiresAuth: true,
    authMethod: 'Brave Search API Key',
    updateFrequency: 'REAL_TIME',
    coverageNote: '全球范围',
    limitations: ['搜索结果需要人工验证', 'AI分析可能不准确'],
  },
  hiring_signal: {
    dataType: 'AI_INFERRED',
    qualityLevel: 'UNSTABLE',
    requiresAuth: true,
    authMethod: '搜索引擎API Key',
    updateFrequency: 'DAILY',
    coverageNote: '全球招聘平台',
    limitations: ['招聘信息不等于购买意向', '需要进一步验证'],
  },
  trade_data: {
    dataType: 'AI_INFERRED',
    qualityLevel: 'UNSTABLE',
    requiresAuth: true,
    authMethod: '搜索引擎API Key',
    updateFrequency: 'UNKNOWN',
    coverageNote: '公开海关数据源',
    limitations: ['免费海关数据有限', '数据可能过时', '需要验证进口商信息'],
  },
  trade_show: {
    dataType: 'AI_INFERRED',
    qualityLevel: 'UNSTABLE',
    requiresAuth: true,
    authMethod: '搜索引擎API Key',
    updateFrequency: 'WEEKLY',
    coverageNote: '全球展会参展商',
    limitations: ['参展商信息可能不完整', '需要验证联系方式'],
  },
  dev_bank: {
    dataType: 'AI_INFERRED',
    qualityLevel: 'UNSTABLE',
    requiresAuth: true,
    authMethod: '搜索引擎API Key',
    updateFrequency: 'DAILY',
    coverageNote: '世界银行、非洲开发银行等',
    limitations: ['非官方API', '项目信息可能不完整', '需要验证采购机会'],
  },
  emerging_markets: {
    dataType: 'AI_INFERRED',
    qualityLevel: 'UNSTABLE',
    requiresAuth: true,
    authMethod: '搜索引擎API Key',
    updateFrequency: 'UNKNOWN',
    coverageNote: '中东、非洲、拉美、东欧采购平台',
    limitations: ['非官方API', '多语言网站可能解析错误', '需要人工验证'],
  },
  // === 联系人丰富化API ===
  hunter: {
    dataType: 'OFFICIAL_API',
    qualityLevel: 'HIGH',
    requiresAuth: true,
    authMethod: 'API Key',
    updateFrequency: 'REAL_TIME',
    coverageNote: '全球企业邮箱查找和验证',
    limitations: ['免费额度: 25次/月', '仅限邮箱相关数据'],
    docUrl: 'https://hunter.io/api-documentation',
  },
  pdl: {
    dataType: 'OFFICIAL_API',
    qualityLevel: 'HIGH',
    requiresAuth: true,
    authMethod: 'API Key',
    updateFrequency: 'DAILY',
    coverageNote: '全球联系人和公司数据',
    limitations: ['按查询次数计费', '需要合理使用'],
    docUrl: 'https://docs.peopledatalabs.com/',
  },
  // === AI 搜索 API ===
  tavily: {
    dataType: 'OFFICIAL_API',
    qualityLevel: 'HIGH',
    requiresAuth: true,
    authMethod: 'API Key',
    updateFrequency: 'REAL_TIME',
    coverageNote: 'AI原生搜索，专为RAG和Agent设计',
    limitations: ['免费额度: 1000次/月', '最多10条结果/次'],
    docUrl: 'https://docs.tavily.com/',
  },
  exa: {
    dataType: 'OFFICIAL_API',
    qualityLevel: 'HIGH',
    requiresAuth: true,
    authMethod: 'API Key',
    updateFrequency: 'REAL_TIME',
    coverageNote: '神经语义搜索，理解意图而非关键词',
    limitations: ['免费额度: 1000次/月', '最便宜的搜索API'],
    docUrl: 'https://docs.exa.ai/',
  },
};

// ==================== 适配器注册表 ====================

const adapterFactories = new Map<string, AdapterFactory>();
const adapterRegistrations = new Map<string, AdapterRegistration>();

// ==================== 注册函数 ====================

export function registerAdapter(
  registration: AdapterRegistration,
  factory: AdapterFactory
): void {
  adapterFactories.set(registration.code, factory);
  adapterRegistrations.set(registration.code, registration);
}

// ==================== 获取适配器 ====================

export function getAdapter(code: string, config?: AdapterConfig): RadarAdapter {
  const factory = adapterFactories.get(code);
  if (!factory) {
    throw new Error(`Adapter not found: ${code}`);
  }
  
  const registration = adapterRegistrations.get(code);
  const mergedConfig = {
    ...registration?.defaultConfig,
    ...config,
  };
  
  return factory(mergedConfig);
}

// ==================== 获取注册信息 ====================

export function getAdapterRegistration(code: string): AdapterRegistration | undefined {
  return adapterRegistrations.get(code);
}

export function listAdapterRegistrations(): AdapterRegistration[] {
  return Array.from(adapterRegistrations.values());
}

export function listAdaptersByChannel(channelType: string): AdapterRegistration[] {
  return listAdapterRegistrations().filter(r => r.channelType === channelType);
}

// ==================== 检查适配器是否存在 ====================

export function hasAdapter(code: string): boolean {
  return adapterFactories.has(code);
}

// ==================== 初始化内置适配器 ====================

let initialized = false;

export function ensureAdaptersInitialized(): void {
  if (initialized) return;
  
  // 注册 UNGM 适配器
  registerAdapter(
    {
      code: 'ungm',
      name: 'UNGM - 联合国采购',
      channelType: 'TENDER',
      adapterType: 'API',
      description: '联合国全球市场平台，覆盖联合国机构的采购公告',
      features: {
        supportsKeywordSearch: true,
        supportsCategoryFilter: true,
        supportsDateFilter: true,
        supportsRegionFilter: false,
        supportsPagination: true,
        supportsDetails: true,
        maxResultsPerQuery: 100,
        rateLimit: { requests: 10, windowMs: 60000 },
      },
      defaultConfig: {
        apiEndpoint: 'https://www.ungm.org',
        timeout: 30000,
      },
      storagePolicy: 'TTL_CACHE',
      ttlDays: 90,
      attributionRequired: true,
      isOfficial: true,
      websiteUrl: 'https://www.ungm.org',
      termsUrl: 'https://www.ungm.org/Public/Pages/TermsOfUse',
      reliability: SOURCE_RELIABILITY.ungm,
    },
    (config) => new UNGMAdapter(config)
  );
  
  // 注册 TED 适配器
  registerAdapter(
    {
      code: 'ted',
      name: 'TED - 欧盟招标',
      channelType: 'TENDER',
      adapterType: 'API',
      description: '欧盟官方招标电子日报，覆盖欧盟27国政府采购',
      features: {
        supportsKeywordSearch: true,
        supportsCategoryFilter: true,
        supportsDateFilter: true,
        supportsRegionFilter: true,
        supportsPagination: true,
        supportsDetails: true,
        maxResultsPerQuery: 100,
        rateLimit: { requests: 30, windowMs: 60000 },
      },
      defaultConfig: {
        apiEndpoint: 'https://api.ted.europa.eu',
        timeout: 30000,
      },
      storagePolicy: 'TTL_CACHE',
      ttlDays: 90,
      attributionRequired: true,
      isOfficial: true,
      countries: ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'],
      regions: ['EU'],
      websiteUrl: 'https://ted.europa.eu',
      termsUrl: 'https://ted.europa.eu/en/legal-notice',
      reliability: SOURCE_RELIABILITY.ted,
    },
    (config) => new TEDAdapter(config)
  );
  
  // 注册 AI 搜索适配器
  registerAdapter(
    {
      code: 'ai_search',
      name: 'AI 智能搜索',
      channelType: 'TENDER',
      adapterType: 'AI_SEARCH',
      description: '使用 AI + 搜索引擎发现全球招标公告，覆盖官方 API 未覆盖的地区',
      features: {
        supportsKeywordSearch: true,
        supportsCategoryFilter: false,
        supportsDateFilter: false,
        supportsRegionFilter: true,
        supportsPagination: false,
        supportsDetails: false,
        maxResultsPerQuery: 20,
        rateLimit: { requests: 5, windowMs: 60000 },
      },
      defaultConfig: {
        timeout: 60000,
      },
      storagePolicy: 'TTL_CACHE',
      ttlDays: 30,
      attributionRequired: true,
      isOfficial: false,
      websiteUrl: undefined,
      reliability: SOURCE_RELIABILITY.ai_search,
    },
    (config) => new AISearchAdapter(config)
  );
  
  // 注册 Google Places 适配器
  registerAdapter(
    {
      code: 'google_places',
      name: 'Google Maps - 企业发现',
      channelType: 'MAPS',
      adapterType: 'API',
      description: '通过 Google Maps Places API 发现目标区域的潜在客户公司',
      features: {
        supportsKeywordSearch: true,
        supportsCategoryFilter: true,
        supportsDateFilter: false,
        supportsRegionFilter: true,
        supportsPagination: true,
        supportsDetails: true,
        maxResultsPerQuery: 60,
        rateLimit: { requests: 100, windowMs: 60000 },
      },
      defaultConfig: {
        timeout: 30000,
      },
      storagePolicy: 'TTL_CACHE',
      ttlDays: 90,
      attributionRequired: true,
      isOfficial: true,
      websiteUrl: 'https://developers.google.com/maps/documentation/places',
      reliability: SOURCE_RELIABILITY.google_places,
    },
    (config) => new GooglePlacesAdapter(config)
  );
  
  // 注册 Brave Search 适配器
  registerAdapter(
    {
      code: 'brave_search',
      name: 'Brave Search - B2B 发现',
      channelType: 'DIRECTORY',
      adapterType: 'AI_SEARCH',
      description: '使用 Brave Search + AI 从互联网发现目标公司',
      features: {
        supportsKeywordSearch: true,
        supportsCategoryFilter: false,
        supportsDateFilter: false,
        supportsRegionFilter: true,
        supportsPagination: false,
        supportsDetails: false,
        maxResultsPerQuery: 30,
        rateLimit: { requests: 15, windowMs: 60000 },
      },
      defaultConfig: {
        timeout: 30000,
      },
      storagePolicy: 'TTL_CACHE',
      ttlDays: 60,
      attributionRequired: false,
      isOfficial: false,
      websiteUrl: 'https://brave.com/search/api/',
      reliability: SOURCE_RELIABILITY.brave_search,
    },
    (config) => new BraveSearchAdapter(config)
  );
  
  // 注册 Generic Feed 适配器
  registerAdapter(
    {
      code: 'generic_feed',
      name: 'Generic Feed - RSS/JSON',
      channelType: 'TENDER',
      adapterType: 'RSS',
      description: 'RSS/JSON 通用 Feed 适配器，支持自定义字段映射',
      features: {
        supportsKeywordSearch: false,
        supportsCategoryFilter: false,
        supportsDateFilter: false,
        supportsRegionFilter: false,
        supportsPagination: false,
        supportsDetails: false,
        maxResultsPerQuery: 100,
        rateLimit: { requests: 10, windowMs: 60000 },
      },
      defaultConfig: {
        timeout: 30000,
      },
      storagePolicy: 'TTL_CACHE',
      ttlDays: 60,
      attributionRequired: true,
      isOfficial: false,
      websiteUrl: undefined,
      reliability: SOURCE_RELIABILITY.generic_feed,
    },
    (config) => new GenericFeedAdapter(config)
  );

  // ==================== 新增数据源 ====================

  // 注册 SAM.gov 适配器（美国政府采购）
  registerAdapter(
    {
      code: 'sam_gov',
      name: 'SAM.gov - 美国政府采购',
      channelType: 'TENDER',
      adapterType: 'API',
      description: '美国联邦政府采购招标平台，覆盖美国政府采购公告',
      features: {
        supportsKeywordSearch: true,
        supportsCategoryFilter: true, // NAICS codes
        supportsDateFilter: true,
        supportsRegionFilter: true,
        supportsPagination: true,
        supportsDetails: true,
        maxResultsPerQuery: 100,
        rateLimit: { requests: 30, windowMs: 60000 },
      },
      defaultConfig: {
        timeout: 30000,
      },
      storagePolicy: 'TTL_CACHE',
      ttlDays: 90,
      attributionRequired: true,
      isOfficial: true,
      countries: ['US'],
      websiteUrl: 'https://sam.gov',
      reliability: SOURCE_RELIABILITY.sam_gov,
    },
    (config) => new SAMGovAdapter(config)
  );

  // 注册招聘信号适配器
  registerAdapter(
    {
      code: 'hiring_signal',
      name: '招聘信号 - 公司增长监测',
      channelType: 'HIRING',
      adapterType: 'AI_SEARCH',
      description: '通过招聘信息识别正在扩张的公司，招聘=增长=潜在需求',
      features: {
        supportsKeywordSearch: true,
        supportsCategoryFilter: true, // 职位类型
        supportsDateFilter: true,
        supportsRegionFilter: true,
        supportsPagination: false,
        supportsDetails: false,
        maxResultsPerQuery: 50,
        rateLimit: { requests: 10, windowMs: 60000 },
      },
      defaultConfig: {
        timeout: 60000,
      },
      storagePolicy: 'TTL_CACHE',
      ttlDays: 30,
      attributionRequired: false,
      isOfficial: false,
      reliability: SOURCE_RELIABILITY.hiring_signal,
    },
    (config) => new HiringSignalAdapter(config)
  );

  // 注册海关贸易数据适配器
  registerAdapter(
    {
      code: 'trade_data',
      name: '海关贸易数据 - 进口商发现',
      channelType: 'ECOSYSTEM',
      adapterType: 'AI_SEARCH',
      description: '通过海关数据发现实际买家，进口商=已购买相关产品=高意向客户',
      features: {
        supportsKeywordSearch: true,
        supportsCategoryFilter: true, // HS codes
        supportsDateFilter: true,
        supportsRegionFilter: true,
        supportsPagination: false,
        supportsDetails: false,
        maxResultsPerQuery: 30,
        rateLimit: { requests: 5, windowMs: 60000 },
      },
      defaultConfig: {
        timeout: 60000,
      },
      storagePolicy: 'TTL_CACHE',
      ttlDays: 90,
      attributionRequired: false,
      isOfficial: false,
      reliability: SOURCE_RELIABILITY.trade_data,
    },
    (config) => new TradeDataAdapter(config)
  );

  // 注册展会参展商适配器
  registerAdapter(
    {
      code: 'trade_show',
      name: '展会参展商 - 市场活跃客户',
      channelType: 'TRADESHOW',
      adapterType: 'AI_SEARCH',
      description: '获取行业展会参展商名单，参展商=有市场预算=高意向客户',
      features: {
        supportsKeywordSearch: true,
        supportsCategoryFilter: true, // 展会类型
        supportsDateFilter: true,
        supportsRegionFilter: true,
        supportsPagination: false,
        supportsDetails: false,
        maxResultsPerQuery: 50,
        rateLimit: { requests: 5, windowMs: 60000 },
      },
      defaultConfig: {
        timeout: 60000,
      },
      storagePolicy: 'TTL_CACHE',
      ttlDays: 90,
      attributionRequired: false,
      isOfficial: false,
      reliability: SOURCE_RELIABILITY.trade_show,
    },
    (config) => new TradeShowAdapter(config)
  );

  // ==================== 新兴市场数据源 ====================

  // 注册国际开发银行适配器
  registerAdapter(
    {
      code: 'dev_bank',
      name: '国际开发银行 - 新兴市场项目',
      channelType: 'TENDER',
      adapterType: 'AI_SEARCH',
      description: '世界银行、非洲开发银行等机构的项目，覆盖中东、非洲、拉美、东欧',
      features: {
        supportsKeywordSearch: true,
        supportsCategoryFilter: true, // 行业/部门
        supportsDateFilter: true,
        supportsRegionFilter: true,
        supportsPagination: false,
        supportsDetails: false,
        maxResultsPerQuery: 50,
        rateLimit: { requests: 10, windowMs: 60000 },
      },
      defaultConfig: {
        timeout: 60000,
      },
      storagePolicy: 'TTL_CACHE',
      ttlDays: 90,
      attributionRequired: false,
      isOfficial: false,
      regions: ['MENA', 'AFRICA', 'LATAM', 'ECA', 'ASIA'],
      reliability: SOURCE_RELIABILITY.dev_bank,
    },
    (config) => new DevelopmentBankAdapter(config)
  );

  // 注册新兴市场采购平台适配器
  registerAdapter(
    {
      code: 'emerging_markets',
      name: '新兴市场采购平台',
      channelType: 'TENDER',
      adapterType: 'AI_SEARCH',
      description: '中东、非洲、拉美、东欧本地采购平台，覆盖 40+ 国家',
      features: {
        supportsKeywordSearch: true,
        supportsCategoryFilter: true,
        supportsDateFilter: true,
        supportsRegionFilter: true,
        supportsPagination: false,
        supportsDetails: false,
        maxResultsPerQuery: 50,
        rateLimit: { requests: 10, windowMs: 60000 },
      },
      defaultConfig: {
        timeout: 60000,
      },
      storagePolicy: 'TTL_CACHE',
      ttlDays: 60,
      attributionRequired: false,
      isOfficial: false,
      regions: ['MENA', 'AFRICA', 'LATAM', 'ECA'],
      reliability: SOURCE_RELIABILITY.emerging_markets,
    },
    (config) => new EmergingMarketsAdapter(config)
  );

  // ==================== 联系人丰富化数据源 ====================

  // 注册 Hunter.io 适配器
  registerAdapter(
    {
      code: 'hunter',
      name: 'Hunter.io - 邮箱查找验证',
      channelType: 'DIRECTORY',
      adapterType: 'API',
      description: '根据域名查找公司邮箱格式，验证邮箱有效性',
      features: {
        supportsKeywordSearch: false,
        supportsCategoryFilter: false,
        supportsDateFilter: false,
        supportsRegionFilter: false,
        supportsPagination: true,
        supportsDetails: true,
        maxResultsPerQuery: 100,
        rateLimit: { requests: 25, windowMs: 60000 },
      },
      defaultConfig: {
        timeout: 30000,
      },
      storagePolicy: 'TTL_CACHE',
      ttlDays: 90,
      attributionRequired: true,
      isOfficial: true,
      websiteUrl: 'https://hunter.io',
      termsUrl: 'https://hunter.io/terms',
      reliability: SOURCE_RELIABILITY.hunter,
    },
    (config) => new HunterAdapter(config)
  );

  // 注册 People Data Labs 适配器
  registerAdapter(
    {
      code: 'pdl',
      name: 'People Data Labs - 联系人丰富化',
      channelType: 'DIRECTORY',
      adapterType: 'API',
      description: '全球联系人和公司数据丰富化，查找决策者',
      features: {
        supportsKeywordSearch: true,
        supportsCategoryFilter: true,
        supportsDateFilter: false,
        supportsRegionFilter: true,
        supportsPagination: true,
        supportsDetails: true,
        maxResultsPerQuery: 100,
        rateLimit: { requests: 10, windowMs: 60000 },
      },
      defaultConfig: {
        timeout: 30000,
      },
      storagePolicy: 'TTL_CACHE',
      ttlDays: 90,
      attributionRequired: true,
      isOfficial: true,
      websiteUrl: 'https://www.peopledatalabs.com',
      termsUrl: 'https://www.peopledatalabs.com/terms',
      reliability: SOURCE_RELIABILITY.pdl,
    },
    (config) => new PeopleDataLabsAdapter(config)
  );

  // ==================== AI 搜索 API ====================

  // 注册 Tavily 适配器
  registerAdapter(
    {
      code: 'tavily',
      name: 'Tavily - AI原生搜索',
      channelType: 'DIRECTORY',
      adapterType: 'API',
      description: 'AI原生搜索，专为RAG和Agent设计，自动评估来源可信度',
      features: {
        supportsKeywordSearch: true,
        supportsCategoryFilter: false,
        supportsDateFilter: true,
        supportsRegionFilter: false,
        supportsPagination: false,
        supportsDetails: false,
        maxResultsPerQuery: 10,
        rateLimit: { requests: 100, windowMs: 60000 },
      },
      defaultConfig: {
        timeout: 30000,
      },
      storagePolicy: 'TTL_CACHE',
      ttlDays: 30,
      attributionRequired: true,
      isOfficial: true,
      websiteUrl: 'https://tavily.com',
      termsUrl: 'https://tavily.com/terms',
      reliability: SOURCE_RELIABILITY.tavily,
    },
    (config) => new TavilyAdapter(config)
  );

  // 注册 Exa 适配器
  registerAdapter(
    {
      code: 'exa',
      name: 'Exa - 神经语义搜索',
      channelType: 'DIRECTORY',
      adapterType: 'API',
      description: '神经语义搜索，理解意图而非关键词匹配，适合"发现"类查询',
      features: {
        supportsKeywordSearch: true,
        supportsCategoryFilter: true,
        supportsDateFilter: true,
        supportsRegionFilter: false,
        supportsPagination: false,
        supportsDetails: false,
        maxResultsPerQuery: 100,
        rateLimit: { requests: 100, windowMs: 60000 },
      },
      defaultConfig: {
        timeout: 30000,
      },
      storagePolicy: 'TTL_CACHE',
      ttlDays: 30,
      attributionRequired: true,
      isOfficial: true,
      websiteUrl: 'https://exa.ai',
      termsUrl: 'https://exa.ai/terms',
      reliability: SOURCE_RELIABILITY.exa,
    },
    (config) => new ExaAdapter(config)
  );

  initialized = true;
}

// ==================== 适配器代码常量 ====================

export const ADAPTER_CODES = {
  UNGM: 'ungm',
  TED: 'ted',
  AI_SEARCH: 'ai_search',
  GOOGLE_PLACES: 'google_places',
  BRAVE_SEARCH: 'brave_search',
  GENERIC_FEED: 'generic_feed',
  // 新增数据源
  SAM_GOV: 'sam_gov',
  HIRING_SIGNAL: 'hiring_signal',
  TRADE_DATA: 'trade_data',
  TRADE_SHOW: 'trade_show',
  DEV_BANK: 'dev_bank',
  EMERGING_MARKETS: 'emerging_markets',
  // 联系人丰富化
  HUNTER: 'hunter',
  PDL: 'pdl',
  // AI 搜索
  TAVILY: 'tavily',
  EXA: 'exa',
  // 后续扩展
  CSV_IMPORT: 'csv_import',
} as const;

export type AdapterCode = typeof ADAPTER_CODES[keyof typeof ADAPTER_CODES];
